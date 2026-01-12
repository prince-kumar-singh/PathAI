import express from "express";
import {
    generateRoadmap,
    getRoadmap,
    getPhase1Summary
} from "../../controller/phase2/roadmapController.js";

const router = express.Router();

// Generate personalized roadmap (Phase 1 data + Phase 2 preferences)
router.post("/generate", generateRoadmap);

// Get roadmap by ID
router.get("/:roadmapId", getRoadmap);

// Get Phase 1 summary for onboarding preview
router.get("/phase1/summary", getPhase1Summary);

export default router;

