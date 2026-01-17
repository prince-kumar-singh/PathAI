import express from "express";
import {
    getDayTask,
    markResourceComplete,
    getTaskProgress
} from "../../controller/phase2/taskController.js";

const router = express.Router();

// Get a specific day's task with resources and completion status
// GET /api/v1/tasks/:roadmapId/day/:dayNumber
router.get("/:roadmapId/day/:dayNumber", getDayTask);

// Mark a resource as complete (idempotent)
// PATCH /api/v1/tasks/:roadmapId/resource/complete
router.patch("/:roadmapId/resource/complete", markResourceComplete);

// Get aggregated progress for a roadmap
// GET /api/v1/tasks/:roadmapId/progress
router.get("/:roadmapId/progress", getTaskProgress);

export default router;
