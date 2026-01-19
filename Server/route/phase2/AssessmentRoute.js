import express from "express";
import {
    getQuiz,
    submitQuiz,
    getAssessmentHistory,
    getDayAssessmentResults,
    getAssessmentDetail
} from "../../controller/phase2/assessmentController.js";

const router = express.Router();

/**
 * Assessment Routes for Phase 2 Quiz System
 * 
 * GET  /api/v1/assessments/history - Get all assessment attempts for user
 * GET  /api/v1/assessments/roadmaps/:roadmapId/days/:dayNumber/quiz - Get quiz for a day
 * POST /api/v1/assessments/roadmaps/:roadmapId/days/:dayNumber/quiz/submit - Submit quiz answers
 * GET  /api/v1/assessments/roadmaps/:roadmapId/days/:dayNumber/results - Get day's assessment results
 */

// Get assessment history for authenticated user
router.get("/history", getAssessmentHistory);

// Get single assessment detail by ID
router.get("/:assessmentId", getAssessmentDetail);

// Get quiz for a specific roadmap day
router.get("/roadmaps/:roadmapId/days/:dayNumber/quiz", getQuiz);

// Submit quiz answers for grading
router.post("/roadmaps/:roadmapId/days/:dayNumber/quiz/submit", submitQuiz);

// Get assessment results for a specific day
router.get("/roadmaps/:roadmapId/days/:dayNumber/results", getDayAssessmentResults);

export default router;
