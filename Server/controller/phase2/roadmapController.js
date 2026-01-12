import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import Score from "../../model/scoreModel.js";
import { mapCareerToDomain } from "../../utils/careerDomainMapping.js";

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

        // 4. Extract career domain from Phase 1
        const recommendedCareer = scoreDoc.careerPrediction.recommended_career;
        const careerDomain = mapCareerToDomain(recommendedCareer);

        console.log(`User ${userId}: ${recommendedCareer} → ${careerDomain}`);

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
        const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
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

        const roadmap = await response.json();

        // 7. Return generated roadmap
        return res.json({
            success: true,
            roadmap,
            metadata: {
                career: recommendedCareer,
                domain: careerDomain,
                generated_at: new Date()
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

        // Fetch from FastAPI service
        const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
        const response = await fetch(`${fastApiUrl}/api/v1/roadmaps/${roadmapId}`, {
            headers: {
                "X-User-ID": userId.toString()
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Roadmap not found"
            });
        }

        const roadmap = await response.json();
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

        return res.json({
            recommended_career: scoreDoc.careerPrediction?.recommended_career,
            alternative_careers: scoreDoc.careerPrediction?.alternative_careers,
            confidence: scoreDoc.careerPrediction?.confidence,
            phase1_complete: !!(scoreDoc.careerPrediction && scoreDoc.bigFive && scoreDoc.riasec),
            domain: mapCareerToDomain(scoreDoc.careerPrediction?.recommended_career)
        });

    } catch (error) {
        console.error("Error fetching Phase 1 summary:", error);
        return res.status(500).json({ error: error.message });
    }
};

