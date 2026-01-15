import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import Score from "../../model/scoreModel.js";
import { mapCareerToDomain } from "../../utils/careerDomainMapping.js";
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

        // Fetch from FastAPI service
        const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:7000";
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

