/**
 * Per-day progress breakdown
 */
export interface DayProgress {
    total: number;
    completed: number;
    percentage: number;
}

/**
 * Aggregated progress response from getTaskProgress API
 */
export interface TaskProgressResponse {
    success: boolean;
    progress: {
        overall: number;
        totalResources: number;
        completedResources: number;
        byDay: Record<number, DayProgress>;
        daysCompleted: number;
        totalDays: number;
    };
}
