import mongoose from "mongoose";

/**
 * AssessmentResult Schema
 * Tracks quiz assessment attempts for roadmap days
 */
const assessmentResultSchema = new mongoose.Schema({
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
        required: true,
        min: 1,
        max: 10
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    passed: {
        type: Boolean,
        required: true,
        default: false
    },
    totalQuestions: {
        type: Number,
        default: 5
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    answers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        questionText: {
            type: String,
            required: true
        },
        options: [{
            type: String
        }],
        selectedAnswer: {
            type: Number,
            required: true
        },
        correctAnswer: {
            type: Number,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
assessmentResultSchema.index({ userId: 1, roadmapId: 1, dayNumber: 1 });

// Virtual for pass threshold (70%)
assessmentResultSchema.virtual('passThreshold').get(function () {
    return 70;
});

const AssessmentResult = mongoose.model("AssessmentResult", assessmentResultSchema);

export default AssessmentResult;
