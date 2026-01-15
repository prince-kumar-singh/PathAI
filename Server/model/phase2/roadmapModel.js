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
                enum: ['video', 'article', 'exercise', 'project'],
                default: 'article'
            },
            estimated_time_minutes: Number,
            resources: {
                type: [mongoose.Schema.Types.Mixed],
                set: function (value) {
                    // If it's a string, try to parse it
                    if (typeof value === 'string') {
                        try {
                            return JSON.parse(value);
                        } catch (e) {
                            console.error('Failed to parse resources string:', e);
                            return [];
                        }
                    }
                    // If it's already an array, return as-is
                    if (Array.isArray(value)) {
                        return value.map(item => {
                            if (typeof item === 'string') {
                                try {
                                    return JSON.parse(item);
                                } catch {
                                    return { title: "Invalid resource", platform: "Unknown" };
                                }
                            }
                            return item;
                        });
                    }
                    return [];
                },
                default: []
            }
        }],
        estimated_time_minutes: Number,
        completed: {
            type: Boolean,
            default: false
        }
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