import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    career_domain: {
        type: String,
        required: true
    },
    skill_level: {
        type: String,
        default: "beginner"
    },
    learning_style: String,
    total_days: {
        type: Number,
        default: 10
    },
    days: [{
        day_number: Number,
        title: String,
        learning_objectives: [String],
        key_topics: [String],
        tasks: [{
            task_id: String,
            title: String,
            description: String,
            type: {
                type: String,
                enum: ['video', 'article', 'exercise', 'project']
            },
            estimated_time_minutes: Number,
            resources: [{
                title: String,
                platform: String,
                url: String,
                type: String
            }]
        }],
        estimated_time_minutes: Number
    }],
    status: {
        type: String,
        enum: ["generated", "in_progress", "completed"],
        default: "generated"
    },
    current_day: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

export default Roadmap;
