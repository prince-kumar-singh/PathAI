import type {
    DayTaskResponse,
    MarkResourceCompleteRequest,
    ResourceProgressResponse
} from '../types/phase2/task.types';
import type { TaskProgressResponse } from '../types/phase2/progress.types';

const API_BASE = '/api/v1/tasks';

/**
 * Fetch a specific day's tasks with resources and completion status
 */
export async function getDayTask(roadmapId: string, dayNumber: number): Promise<DayTaskResponse> {
    const response = await fetch(`${API_BASE}/${roadmapId}/day/${dayNumber}`, {
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch day task');
    }

    return response.json();
}

/**
 * Mark a resource as complete (idempotent)
 */
export async function markResourceComplete(
    roadmapId: string,
    data: MarkResourceCompleteRequest
): Promise<ResourceProgressResponse> {
    const response = await fetch(`${API_BASE}/${roadmapId}/resource/complete`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark resource complete');
    }

    return response.json();
}

/**
 * Get aggregated progress for a roadmap
 */
export async function getTaskProgress(roadmapId: string): Promise<TaskProgressResponse> {
    const response = await fetch(`${API_BASE}/${roadmapId}/progress`, {
        credentials: 'include'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch task progress');
    }

    return response.json();
}
