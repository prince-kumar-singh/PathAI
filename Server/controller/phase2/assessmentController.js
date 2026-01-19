import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import Roadmap from "../../model/phase2/roadmapModel.js";
import AssessmentResult from "../../model/phase2/assessmentModel.js";

const PASS_THRESHOLD = 70; // 70% to pass

/**
 * Get quiz for a specific roadmap day
 * Fetches quiz questions from FastAPI AI service
 * 
 * GET /api/v1/assessments/roadmaps/:roadmapId/days/:dayNumber/quiz
 */
export const getQuiz = async (req, res) => {
    try {
        const { roadmapId, dayNumber } = req.params;
        const token = req.cookies.session_token;

        // Validate authentication
        if (!token) {
            return res.status(401).json({ error: "Unauthorized. Please login." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Fetch roadmap to get day details
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

        if (!roadmap) {
            return res.status(404).json({ error: "Roadmap not found" });
        }

        // Find the specific day
        const dayNum = parseInt(dayNumber);
        const day = roadmap.days.find(d => d.day_number === dayNum);

        if (!day) {
            return res.status(404).json({ error: `Day ${dayNumber} not found` });
        }

        console.log(`🎯 Generating quiz for Day ${dayNumber}: ${day.title}`);

        // Call FastAPI AI service to generate quiz
        const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:7000";

        const quizRequest = {
            career_domain: roadmap.career_domain,
            day_number: dayNum,
            day_title: day.title || `Day ${dayNum}`,
            topics: day.key_topics || [],
            objectives: day.learning_objectives || []
        };

        const response = await fetch(`${fastApiUrl}/api/v1/quiz/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(quizRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Quiz generation failed:", errorText);
            return res.status(response.status).json({
                error: "Failed to generate quiz",
                details: errorText
            });
        }

        const quizData = await response.json();

        console.log(`✅ Quiz generated: ${quizData.questions?.length || 0} questions`);

        // Return quiz questions (without correct answers for client)
        const clientQuiz = {
            career_domain: quizData.career_domain,
            day_number: quizData.day_number,
            day_title: day.title,
            total_questions: quizData.total_questions,
            questions: quizData.questions.map((q, index) => ({
                index,
                question: q.question,
                options: q.options,
                topic: q.topic
                // correctAnswer intentionally omitted
            }))
        };

        // Store full quiz in session/cache for grading (in production use Redis)
        // For now, we'll re-fetch answers on submit
        req.app.locals.quizCache = req.app.locals.quizCache || {};
        req.app.locals.quizCache[`${userId}_${roadmapId}_${dayNumber}`] = quizData.questions;

        return res.json({
            success: true,
            quiz: clientQuiz
        });

    } catch (error) {
        console.error("Error getting quiz:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

/**
 * Submit quiz answers for grading
 * Auto-grades and saves result to database
 * 
 * POST /api/v1/assessments/roadmaps/:roadmapId/days/:dayNumber/quiz/submit
 */
export const submitQuiz = async (req, res) => {
    try {
        const { roadmapId, dayNumber } = req.params;
        const { answers } = req.body;
        const token = req.cookies.session_token;

        // Validate authentication
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Validate answers array
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: "Invalid request",
                message: "answers must be an array of selected option indices"
            });
        }

        console.log(`📝 Grading quiz for user ${userId}, Day ${dayNumber}`);
        console.log(`   Received ${answers.length} answers`);

        // Get cached quiz questions (contains correct answers)
        const cacheKey = `${userId}_${roadmapId}_${dayNumber}`;
        let cachedQuestions = req.app.locals.quizCache?.[cacheKey];

        // If no cache, regenerate quiz (handles server restart case)
        if (!cachedQuestions) {
            console.log("⚠️ Quiz cache miss - regenerating for grading...");

            const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
            if (!roadmap) {
                return res.status(404).json({ error: "Roadmap not found" });
            }

            const dayNum = parseInt(dayNumber);
            const day = roadmap.days.find(d => d.day_number === dayNum);

            if (!day) {
                return res.status(404).json({ error: "Day not found" });
            }

            // Regenerate quiz
            const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:7000";
            const response = await fetch(`${fastApiUrl}/api/v1/quiz/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    career_domain: roadmap.career_domain,
                    day_number: dayNum,
                    day_title: day.title,
                    topics: day.key_topics || [],
                    objectives: day.learning_objectives || []
                })
            });

            if (!response.ok) {
                return res.status(500).json({ error: "Failed to verify quiz answers" });
            }

            const quizData = await response.json();
            cachedQuestions = quizData.questions;
        }

        // Grade the quiz
        let correctCount = 0;
        const gradedAnswers = answers.map((selectedAnswer, index) => {
            const question = cachedQuestions[index];
            const correctAnswer = question?.correctAnswer ?? 0;
            const isCorrect = selectedAnswer === correctAnswer;

            if (isCorrect) correctCount++;

            return {
                questionIndex: index,
                questionText: question?.question || `Question ${index + 1}`,
                options: question?.options || [],
                selectedAnswer,
                correctAnswer,
                isCorrect
            };
        });

        // Calculate score
        const totalQuestions = cachedQuestions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= PASS_THRESHOLD;

        console.log(`✅ Quiz graded: ${correctCount}/${totalQuestions} = ${score}%`);
        console.log(`   Result: ${passed ? "PASSED ✅" : "FAILED ❌"}`);

        // Save assessment result
        const assessmentResult = new AssessmentResult({
            userId,
            roadmapId,
            dayNumber: parseInt(dayNumber),
            score,
            passed,
            totalQuestions,
            correctAnswers: correctCount,
            answers: gradedAnswers,
            submittedAt: new Date()
        });

        await assessmentResult.save();

        // Clear quiz cache
        if (req.app.locals.quizCache) {
            delete req.app.locals.quizCache[cacheKey];
        }

        // Prepare feedback
        const feedback = passed
            ? "Congratulations! You've passed the assessment. You can proceed to the next day."
            : `You scored ${score}%. You need ${PASS_THRESHOLD}% to pass. Review the material and try again.`;

        return res.json({
            success: true,
            result: {
                score,
                passed,
                correctAnswers: correctCount,
                totalQuestions,
                passThreshold: PASS_THRESHOLD,
                feedback,
                answers: gradedAnswers.map((a, i) => ({
                    questionIndex: a.questionIndex,
                    isCorrect: a.isCorrect,
                    correctAnswer: a.correctAnswer,
                    yourAnswer: a.selectedAnswer
                }))
            }
        });

    } catch (error) {
        console.error("Error submitting quiz:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

/**
 * Get assessment history for authenticated user with aggregate stats
 * 
 * GET /api/v1/assessments/history
 */
export const getAssessmentHistory = async (req, res) => {
    try {
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Get all assessment results for user
        const assessments = await AssessmentResult.find({ userId })
            .sort({ submittedAt: -1 })
            .populate('roadmapId', 'career_domain')
            .limit(100);

        // Calculate aggregate statistics
        const totalQuizzes = assessments.length;
        const passedQuizzes = assessments.filter(a => a.passed).length;
        const averageScore = totalQuizzes > 0
            ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / totalQuizzes)
            : 0;
        const highestScore = totalQuizzes > 0
            ? Math.max(...assessments.map(a => a.score))
            : 0;
        const passRate = totalQuizzes > 0
            ? Math.round((passedQuizzes / totalQuizzes) * 100)
            : 0;

        // Group by career domain for domain-specific stats
        const domainStats = {};
        assessments.forEach(a => {
            const domain = a.roadmapId?.career_domain || 'Unknown';
            if (!domainStats[domain]) {
                domainStats[domain] = { attempts: 0, passed: 0, totalScore: 0 };
            }
            domainStats[domain].attempts++;
            if (a.passed) domainStats[domain].passed++;
            domainStats[domain].totalScore += a.score;
        });

        return res.json({
            success: true,
            stats: {
                totalQuizzes,
                passedQuizzes,
                failedQuizzes: totalQuizzes - passedQuizzes,
                averageScore,
                highestScore,
                passRate,
                domainStats
            },
            assessments: assessments.map(a => ({
                _id: a._id,
                roadmapId: a.roadmapId?._id,
                careerDomain: a.roadmapId?.career_domain,
                dayNumber: a.dayNumber,
                score: a.score,
                passed: a.passed,
                correctAnswers: a.correctAnswers,
                totalQuestions: a.totalQuestions,
                answers: a.answers, // Include answers for detailed review
                submittedAt: a.submittedAt
            }))
        });

    } catch (error) {
        console.error("Error getting assessment history:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

/**
 * Get single assessment details by ID
 * 
 * GET /api/v1/assessments/:assessmentId
 */
export const getAssessmentDetail = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Find assessment and verify ownership
        const assessment = await AssessmentResult.findOne({
            _id: assessmentId,
            userId
        }).populate('roadmapId', 'career_domain days');

        if (!assessment) {
            return res.status(404).json({ error: "Assessment not found" });
        }

        // Get the day info for context
        const day = assessment.roadmapId?.days?.find(
            d => d.day_number === assessment.dayNumber
        );

        return res.json({
            success: true,
            assessment: {
                _id: assessment._id,
                roadmapId: assessment.roadmapId?._id,
                careerDomain: assessment.roadmapId?.career_domain,
                dayNumber: assessment.dayNumber,
                dayTitle: day?.title || `Day ${assessment.dayNumber}`,
                dayTopics: day?.key_topics || [],
                score: assessment.score,
                passed: assessment.passed,
                correctAnswers: assessment.correctAnswers,
                totalQuestions: assessment.totalQuestions,
                answers: assessment.answers,
                submittedAt: assessment.submittedAt
            }
        });

    } catch (error) {
        console.error("Error getting assessment detail:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

/**
 * Get assessment results for a specific roadmap day
 * 
 * GET /api/v1/assessments/roadmaps/:roadmapId/days/:dayNumber/results
 */
export const getDayAssessmentResults = async (req, res) => {
    try {
        const { roadmapId, dayNumber } = req.params;
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Get all attempts for this day
        const results = await AssessmentResult.find({
            userId,
            roadmapId,
            dayNumber: parseInt(dayNumber)
        }).sort({ submittedAt: -1 });

        // Get best result
        const bestResult = results.reduce((best, current) => {
            if (!best || current.score > best.score) return current;
            return best;
        }, null);

        return res.json({
            success: true,
            attempts: results.length,
            hasPassed: results.some(r => r.passed),
            bestScore: bestResult?.score || 0,
            results: results.map(r => ({
                score: r.score,
                passed: r.passed,
                correctAnswers: r.correctAnswers,
                totalQuestions: r.totalQuestions,
                submittedAt: r.submittedAt
            }))
        });

    } catch (error) {
        console.error("Error getting day results:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};
