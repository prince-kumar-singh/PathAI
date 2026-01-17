import type { TaskProgressResponse } from '../types/phase2/progress.types';

const API_BASE = '/api/v1/tasks';

/**
 * Get aggregated progress for a roadmap
 * Re-export from taskApi for semantic clarity
 */
export async function getRoadmapProgress(roadmapId: string): Promise<TaskProgressResponse> {
    const response = await fetch(`${API_BASE}/${roadmapId}/progress`, {
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch progress');
    }

    return response.json();
}

/**
 * Calculate overall completion percentage from progress data
 */
export function calculateCompletionPercentage(progress: TaskProgressResponse['progress']): number {
    return progress.overall;
}

/**
 * Check if a day is fully completed based on progress
 */
export function isDayCompleted(progress: TaskProgressResponse['progress'], dayNumber: number): boolean {
    const dayProgress = progress.byDay[dayNumber];
    return dayProgress ? dayProgress.percentage === 100 : false;
}
