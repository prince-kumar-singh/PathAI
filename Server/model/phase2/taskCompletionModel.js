import mongoose from "mongoose";

/**
 * ResourceProgress Schema
 * Tracks per-resource completion for users within roadmaps
 * Enables granular progress tracking beyond day-level completion
 */
const resourceProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Roadmap",
        required: true,
        index: true
    },
    dayNumber: {
        type: Number,
        required: true
    },
    taskId: {
        type: String,
        required: true
    },
    resourceId: {
        type: String,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    timeSpent: {
        type: Number,  // seconds
        default: 0
    }
}, { timestamps: true });

// Compound unique index for idempotent completion tracking
// Prevents duplicate completion records for same resource
resourceProgressSchema.index(
    { userId: 1, roadmapId: 1, taskId: 1, resourceId: 1 },
    { unique: true }
);

// Index for efficient progress queries by roadmap
resourceProgressSchema.index({ userId: 1, roadmapId: 1 });

const ResourceProgress = mongoose.model("ResourceProgress", resourceProgressSchema);

export default ResourceProgress;
