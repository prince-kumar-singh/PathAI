import express from "express";
import {
    generateRoadmap,
    getRoadmap,
    getPhase1Summary,
    markDayComplete,
    getUserRoadmaps
} from "../../controller/phase2/roadmapController.js";

const router = express.Router();

// Get all user's roadmaps (must be before /:roadmapId to avoid conflict)
router.get("/user/all", getUserRoadmaps);

// Generate personalized roadmap (Phase 1 data + Phase 2 preferences)
router.post("/generate", generateRoadmap);

// Get Phase 1 summary for onboarding preview
router.get("/phase1/summary", getPhase1Summary);

// Get roadmap by ID
router.get("/:roadmapId", getRoadmap);

// Mark a day as complete
router.patch("/:roadmapId/day/complete", markDayComplete);

// Alias route for backward compatibility
router.patch("/:roadmapId/days/complete", markDayComplete);

export default router;

