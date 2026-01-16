import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import Score from "../../model/scoreModel.js";
import { resolveCareerDomain, CareerResolutionError, mapCareerToDomain } from "../../utils/careerDomainMapping.js";
import Roadmap from "../../model/phase2/roadmapModel.js";

/**
 * Sanitize roadmap data to handle stringified JSON and invalid enums
 * This is a FAILSAFE in case Python sanitization doesn't run
 */
function sanitizeRoadmapData(data) {
    console.log("🛡️  Running Node.js failsafe sanitization...");

    // Enum mapping for task types
    const taskTypeMap = {
        'reading': 'article',
        'coding_exercise': 'exercise',
        'installation': 'exercise',
        'account_setup': 'exercise',
        'planning': 'project',
        'git_commit_planning': 'project'
    };

    if (!data.days || !Array.isArray(data.days)) {
        console.warn("⚠️  No days array found");
        return data;
    }

    let fixCount = 0;

    data.days.forEach((day, dayIdx) => {
        // Parse stringified arrays at day level
        ['learning_objectives', 'key_topics'].forEach(field => {
            if (day[field] && typeof day[field] === 'string') {
                try {
                    day[field] = JSON.parse(day[field]);
                    fixCount++;
                    console.log(`✅ Fixed day ${dayIdx} ${field}`);
                } catch (e) {
                    console.error(`❌ Failed to parse day ${dayIdx} ${field}`);
                    day[field] = [];
                }
            }
        });

        if (!Array.isArray(day.tasks)) return;

        day.tasks.forEach((task, taskIdx) => {
            // Fix task type enum
            if (task.type && taskTypeMap[task.type]) {
                console.log(`🔄 Mapping task type: ${task.type} → ${taskTypeMap[task.type]}`);
                task.type = taskTypeMap[task.type];
                fixCount++;
            }

            // Parse stringified resources
            if (task.resources) {
                if (typeof task.resources === 'string') {
                    try {
                        task.resources = JSON.parse(task.resources);
                        fixCount++;
                        console.log(`✅ Fixed day ${dayIdx} task ${taskIdx} resources`);
                    } catch (e) {
                        console.error(`❌ Failed to parse day ${dayIdx} task ${taskIdx} resources`);
                        task.resources = [];
                    }
                }

                // Ensure resources is an array
                if (!Array.isArray(task.resources)) {
                    task.resources = [];
                }

                // Parse stringified resource items
                task.resources = task.resources.map((res, resIdx) => {
                    if (typeof res === 'string') {
                        try {
                            return JSON.parse(res);
                        } catch (e) {
                            console.error(`❌ Failed to parse resource item at day ${dayIdx} task ${taskIdx} res ${resIdx}`);
                            return { title: "Invalid resource", platform: "Unknown" };
                        }
                    }
                    return res;
                });
            } else {
                task.resources = [];
            }
        });
    });

    console.log(`✅ Failsafe sanitization complete: ${fixCount} fixes applied`);
    return data;
}


/**
 * Generate personalized roadmap using Phase 1 data + Phase 2 preferences
 * GET Phase 1: career domain, personality, interests
 * GET Phase 2: learning style, skill level, pacing
 * COMBINE: Send to FastAPI for AI generation
 */
export const generateRoadmap = async (req, res) => {
    try {
        // 1. Verify user authentication
        const token = req.cookies.session_token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized. Please login." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // 2. Fetch Phase 1 assessment data
        const scoreDoc = await Score.findOne({ userId });

        // 3. Validate Phase 1 completion
        if (!scoreDoc || !scoreDoc.careerPrediction) {
            return res.status(400).json({
                error: "Please complete all Phase 1 assessments first",
                missing: {
                    careerPrediction: !scoreDoc?.careerPrediction,
                    bigFive: !scoreDoc?.bigFive,
                    riasec: !scoreDoc?.riasec
                }
            });
        }

        // 4. Extract career domain from Phase 1 (STRICT - no fallback)
        const recommendedCareer = scoreDoc.careerPrediction.recommended_career;

        let careerDomain;
        try {
            careerDomain = resolveCareerDomain(recommendedCareer);
            console.log(`✅ User ${userId}: Career resolved "${recommendedCareer}" → "${careerDomain}"`);
        } catch (error) {
            if (error instanceof CareerResolutionError) {
                console.error(`❌ Career resolution failed for user ${userId}: ${error.message}`);
                return res.status(400).json({
                    error: "Invalid career prediction",
                    message: `Cannot generate roadmap for unknown career: "${recommendedCareer}"`,
                    hint: "Please complete the career assessment again",
                    originalCareer: error.originalCareer
                });
            }
            throw error;
        }

        // 5. Combine Phase 1 data + Phase 2 preferences
        const roadmapRequest = {
            user_id: userId,

            // From Phase 1 (auto-populated)
            career_domain: careerDomain,
            recommended_career: recommendedCareer,
            bigFive: scoreDoc.bigFive,
            riasec: scoreDoc.riasec,

            // Phase 2 is ALWAYS beginner level (10-day intro roadmap)
            skill_level: "beginner",

            // From Phase 2 onboarding (user selected)
            learning_style: req.body.learning_style || "mixed",
            pacing_preference: req.body.pacing_preference || "standard",
            time_availability: req.body.time_availability || 5
        };

        // 6. Call FastAPI AI service
        const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:7000";
        const response = await fetch(`${fastApiUrl}/api/v1/roadmaps/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-ID": userId.toString()
            },
            body: JSON.stringify(roadmapRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("FastAPI Error:", errorText);
            return res.status(response.status).json({
                error: "Roadmap generation failed",
                details: errorText
            });
        }

        const roadmapData = await response.json();

        // Failsafe: Sanitize stringified JSON (LangChain sometimes still returns strings)
        console.log("✅ Received roadmap from LangChain - sanitizing...");

        const sanitizeRoadmap = (data) => {
            // Helper to parse stringified JSON
            const parseIfString = (value) => {
                if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value;
                    }
                }
                return value;
            };

            // Sanitize each day
            if (data.days && Array.isArray(data.days)) {
                data.days = data.days.map(day => ({
                    ...day,
                    learning_objectives: parseIfString(day.learning_objectives),
                    key_topics: parseIfString(day.key_topics),
                    tasks: Array.isArray(day.tasks) ? day.tasks.map(task => ({
                        ...task,
                        resources: parseIfString(task.resources)
                    })) : []
                }));
            }

            return data;
        };

        const sanitizedData = sanitizeRoadmap(roadmapData);

        // 7. Save to MongoDB
        const newRoadmap = new Roadmap({
            userId,
            career_domain: sanitizedData.career_domain,
            skill_level: sanitizedData.skill_level,
            learning_style: req.body.learning_style,
            days: sanitizedData.days,
            status: "generated"
        });

        await newRoadmap.save();

        // 8. Return saved roadmap (with _id)
        return res.json({
            success: true,
            roadmap: {
                ...newRoadmap.toObject(),
                roadmap_id: newRoadmap._id
            }
        });

    } catch (error) {
        console.error("Error generating roadmap:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

/**
 * Get roadmap by ID
 */
export const getRoadmap = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Fetch from MongoDB (roadmaps are stored here, not in FastAPI)
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found"
            });
        }

        return res.json(roadmap);

    } catch (error) {
        console.error("Error fetching roadmap:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Get Phase 1 data for onboarding preview
 * Shows recommended career before user starts Phase 2
 */
export const getPhase1Summary = async (req, res) => {
    try {
        const token = req.cookies.session_token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        const scoreDoc = await Score.findOne({ userId });

        if (!scoreDoc) {
            return res.status(404).json({ error: "No assessment data found" });
        }

        // Resolve domain with error handling (graceful for summary endpoint)
        let domain = null;
        try {
            if (scoreDoc.careerPrediction?.recommended_career) {
                domain = resolveCareerDomain(scoreDoc.careerPrediction.recommended_career);
            }
        } catch (error) {
            if (error instanceof CareerResolutionError) {
                console.warn(`⚠️ Could not resolve domain for summary: ${error.message}`);
                domain = null;
            } else {
                throw error;
            }
        }

        return res.json({
            recommended_career: scoreDoc.careerPrediction?.recommended_career,
            alternative_careers: scoreDoc.careerPrediction?.alternative_careers,
            confidence: scoreDoc.careerPrediction?.confidence,
            phase1_complete: !!(scoreDoc.careerPrediction && scoreDoc.bigFive && scoreDoc.riasec),
            domain
        });

    } catch (error) {
        console.error("Error fetching Phase 1 summary:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Mark a day as complete
 * Updates the day's completion status and advances to next day
 */
export const markDayComplete = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { dayNumber } = req.body;
        const token = req.cookies.session_token;

        // 🔍 Enhanced logging for debugging
        console.log('📍 Mark Day Complete Request:', {
            roadmapId,
            dayNumber,
            dayNumberType: typeof dayNumber,
            hasToken: !!token,
            timestamp: new Date().toISOString()
        });

        // Validate authentication
        if (!token) {
            console.log('❌ No authentication token provided');
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Validate dayNumber
        if (dayNumber === undefined || dayNumber === null) {
            console.log('❌ dayNumber is missing');
            return res.status(400).json({
                error: "Invalid request",
                message: "dayNumber is required"
            });
        }

        if (typeof dayNumber !== 'number') {
            console.log('❌ dayNumber is not a number:', { dayNumber, type: typeof dayNumber });
            return res.status(400).json({
                error: "Invalid request",
                message: "dayNumber must be a number"
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SCERET);
            console.log('✅ Token verified for user:', decoded.id);
        } catch (jwtError) {
            console.error('❌ JWT verification failed:', jwtError.message);
            return res.status(401).json({
                error: "Invalid token",
                message: jwtError.message
            });
        }

        const userId = decoded.id;

        // Find the roadmap and verify ownership
        console.log('🔍 Searching for roadmap:', { roadmapId, userId });
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

        if (!roadmap) {
            console.log('❌ Roadmap not found for:', { roadmapId, userId });
            return res.status(404).json({ error: "Roadmap not found" });
        }

        console.log('✅ Roadmap found:', {
            roadmapId: roadmap._id,
            totalDays: roadmap.days.length,
            currentDay: roadmap.current_day,
            status: roadmap.status
        });

        // Find the day to mark as complete
        const dayIndex = roadmap.days.findIndex(d => d.day_number === dayNumber);

        if (dayIndex === -1) {
            console.log('❌ Day not found:', {
                dayNumber,
                availableDays: roadmap.days.map(d => d.day_number)
            });
            return res.status(404).json({ error: "Day not found" });
        }

        console.log('✅ Found day at index:', dayIndex, 'Current completed status:', roadmap.days[dayIndex].completed);

        // Mark day as complete
        roadmap.days[dayIndex].completed = true;
        console.log(`✅ Marked day ${dayNumber} as complete`);

        // Update current_day to next day if this was the current day
        if (roadmap.current_day === dayNumber && dayNumber < roadmap.total_days) {
            roadmap.current_day = dayNumber + 1;
            console.log(`➡️ Advanced current_day to ${roadmap.current_day}`);
        }

        // Update status to in_progress if it was just generated
        if (roadmap.status === "generated") {
            roadmap.status = "in_progress";
            console.log('📊 Status updated to in_progress');
        }

        // Check if all days are complete
        const allComplete = roadmap.days.every(d => d.completed);
        if (allComplete) {
            roadmap.status = "completed";
            console.log('🎉 All days completed! Status updated to completed');
        }

        // Save the roadmap
        console.log('💾 Saving roadmap...');
        await roadmap.save();
        console.log('✅ Roadmap saved successfully');

        return res.json({
            success: true,
            roadmap: roadmap.toObject()
        });

    } catch (error) {
        console.error("❌ Error marking day complete:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        return res.status(500).json({
            error: error.message,
            errorType: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Get all roadmaps for the authenticated user
 * Used by Dashboard to show user's existing roadmaps
 */
export const getUserRoadmaps = async (req, res) => {
    try {
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        console.log('📋 Fetching roadmaps for user:', userId);

        // Get all roadmaps for this user, sorted by newest first
        const roadmaps = await Roadmap.find({ userId })
            .sort({ createdAt: -1 })
            .select('_id career_domain status current_day total_days days createdAt updatedAt');

        console.log(`✅ Found ${roadmaps.length} roadmaps for user`);

        return res.json({
            success: true,
            roadmaps: roadmaps.map(r => ({
                _id: r._id,
                career_domain: r.career_domain,
                status: r.status,
                current_day: r.current_day,
                total_days: r.total_days,
                progress: Math.round((r.days.filter(d => d.completed).length / r.total_days) * 100),
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            }))
        });

    } catch (error) {
        console.error("Error fetching user roadmaps:", error);
        return res.status(500).json({ error: error.message });
    }
};

