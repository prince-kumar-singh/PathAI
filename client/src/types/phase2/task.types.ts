import type { Day } from './roadmap.types';

/**
 * Response from getDayTask API
 */
export interface DayTaskResponse {
    success: boolean;
    day: Day;
    roadmap: {
        _id: string;
        career_domain: string;
        total_days: number;
        current_day: number;
    };
}

/**
 * Request payload for marking resource complete
 */
export interface MarkResourceCompleteRequest {
    dayNumber: number;
    taskId: string;
    resourceId: string;
    timeSpent?: number;
}

/**
 * Response from markResourceComplete API
 */
export interface ResourceProgressResponse {
    success: boolean;
    resourceProgress: {
        _id: string;
        userId: string;
        roadmapId: string;
        dayNumber: number;
        taskId: string;
        resourceId: string;
        completedAt: string;
        timeSpent: number;
    };
}

/**
 * Tab types for resource player
 */
export type ResourceTab = 'video' | 'article' | 'exercise';
