import jwt from "jsonwebtoken";
import Roadmap from "../../model/phase2/roadmapModel.js";
import ResourceProgress from "../../model/phase2/taskCompletionModel.js";

/**
 * Get a specific day's task with resources and completion status
 * GET /api/v1/tasks/:roadmapId/day/:dayNumber
 */
export const getDayTask = async (req, res) => {
    try {
        const { roadmapId, dayNumber } = req.params;
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Fetch roadmap and verify ownership
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });

        if (!roadmap) {
            return res.status(404).json({ error: "Roadmap not found" });
        }

        // Find the specific day
        const day = roadmap.days.find(d => d.day_number === parseInt(dayNumber));

        if (!day) {
            return res.status(404).json({ error: "Day not found" });
        }

        // Fetch all completed resources for this day
        const completedResources = await ResourceProgress.find({
            userId,
            roadmapId,
            dayNumber: parseInt(dayNumber)
        }).select('taskId resourceId completedAt timeSpent');

        // Create a map for quick lookup
        const completionMap = new Map();
        completedResources.forEach(cr => {
            completionMap.set(`${cr.taskId}:${cr.resourceId}`, {
                completed: true,
                completedAt: cr.completedAt,
                timeSpent: cr.timeSpent
            });
        });

        // Overlay completion status on resources
        const tasksWithProgress = day.tasks.map((task, taskIdx) => {
            const taskId = task.task_id || `task_${taskIdx + 1}`;
            const resourcesWithProgress = (task.resources || []).map((resource, resIdx) => {
                const resourceId = resource.id || `res_${resIdx + 1}`;
                const completion = completionMap.get(`${taskId}:${resourceId}`);
                return {
                    ...resource,
                    id: resourceId,
                    completed: completion?.completed || false,
                    completedAt: completion?.completedAt || null,
                    timeSpent: completion?.timeSpent || 0
                };
            });
            return {
                ...task.toObject ? task.toObject() : task,
                task_id: taskId,
                resources: resourcesWithProgress
            };
        });

        // Calculate day progress
        const totalResources = tasksWithProgress.reduce((sum, t) => sum + t.resources.length, 0);
        const completedCount = completedResources.length;
        const dayProgress = totalResources > 0 ? Math.round((completedCount / totalResources) * 100) : 0;

        return res.json({
            success: true,
            day: {
                ...day.toObject ? day.toObject() : day,
                tasks: tasksWithProgress,
                progress: dayProgress,
                totalResources,
                completedResources: completedCount
            },
            roadmap: {
                _id: roadmap._id,
                career_domain: roadmap.career_domain,
                total_days: roadmap.total_days,
                current_day: roadmap.current_day
            }
        });

    } catch (error) {
        console.error("Error fetching day task:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Mark a resource as complete (idempotent upsert)
 * PATCH /api/v1/tasks/:roadmapId/resource/complete
 */
export const markResourceComplete = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { dayNumber, taskId, resourceId, timeSpent = 0 } = req.body;
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Validate required fields
        if (!dayNumber || !taskId || !resourceId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["dayNumber", "taskId", "resourceId"]
            });
        }

        // Verify roadmap ownership
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
        if (!roadmap) {
            return res.status(404).json({ error: "Roadmap not found" });
        }

        // Upsert the completion record (idempotent)
        const result = await ResourceProgress.findOneAndUpdate(
            { userId, roadmapId, taskId, resourceId },
            {
                userId,
                roadmapId,
                dayNumber,
                taskId,
                resourceId,
                completedAt: new Date(),
                $inc: { timeSpent: timeSpent }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Resource marked complete: ${resourceId} (user: ${userId})`);

        return res.json({
            success: true,
            resourceProgress: result
        });

    } catch (error) {
        console.error("Error marking resource complete:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Get aggregated progress for a roadmap
 * GET /api/v1/tasks/:roadmapId/progress
 */
export const getTaskProgress = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const token = req.cookies.session_token;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        // Fetch roadmap
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
        if (!roadmap) {
            return res.status(404).json({ error: "Roadmap not found" });
        }

        // Calculate total resources in roadmap
        let totalResources = 0;
        const resourcesByDay = {};
        const resourcesByType = { video: 0, article: 0, exercise: 0 };

        roadmap.days.forEach(day => {
            let dayResourceCount = 0;
            day.tasks.forEach(task => {
                const resCount = task.resources?.length || 0;
                dayResourceCount += resCount;
                totalResources += resCount;

                // Count by type
                (task.resources || []).forEach(res => {
                    const type = task.type || 'article';
                    if (resourcesByType[type] !== undefined) {
                        resourcesByType[type]++;
                    }
                });
            });
            resourcesByDay[day.day_number] = dayResourceCount;
        });

        // Fetch all completed resources
        const completedResources = await ResourceProgress.find({ userId, roadmapId });

        // Aggregate by day
        const completedByDay = {};
        const completedByType = { video: 0, article: 0, exercise: 0 };

        completedResources.forEach(cr => {
            if (!completedByDay[cr.dayNumber]) {
                completedByDay[cr.dayNumber] = 0;
            }
            completedByDay[cr.dayNumber]++;
        });

        // Calculate overall progress
        const overallProgress = totalResources > 0
            ? Math.round((completedResources.length / totalResources) * 100)
            : 0;

        // Calculate per-day progress
        const dayProgress = {};
        Object.keys(resourcesByDay).forEach(dayNum => {
            const total = resourcesByDay[dayNum];
            const completed = completedByDay[dayNum] || 0;
            dayProgress[dayNum] = {
                total,
                completed,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });

        return res.json({
            success: true,
            progress: {
                overall: overallProgress,
                totalResources,
                completedResources: completedResources.length,
                byDay: dayProgress,
                daysCompleted: roadmap.days.filter(d => d.completed).length,
                totalDays: roadmap.total_days
            }
        });

    } catch (error) {
        console.error("Error fetching task progress:", error);
        return res.status(500).json({ error: error.message });
    }
};
