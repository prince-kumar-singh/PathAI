/**
 * Resource types for learning materials
 */
export interface Resource {
    id: string;
    title: string;
    type?: 'video' | 'article' | 'exercise';
    platform?: string;
    url?: string;
    url_hint?: string;
    description?: string;
    completed?: boolean;
    completedAt?: string;
    timeSpent?: number;
}

/**
 * Task within a day's learning plan
 */
export interface Task {
    task_id: string;
    title: string;
    description?: string;
    type: 'video' | 'article' | 'exercise' | 'project';
    estimated_time_minutes?: number;
    resources: Resource[];
    /** Optional explicit exercise format for extensibility */
    exercise_format?: 'code' | 'writing' | 'quiz';
}

/**
 * Day in the roadmap
 */
export interface Day {
    day_number: number;
    title: string;
    learning_objectives: string[];
    key_topics: string[];
    tasks: Task[];
    estimated_time_minutes?: number;
    completed: boolean;
    progress?: number;
    totalResources?: number;
    completedResources?: number;
}

/**
 * Full roadmap structure
 */
export interface Roadmap {
    _id: string;
    userId: string;
    career_domain: string;
    skill_level: string;
    learning_style?: string;
    total_days: number;
    current_day: number;
    days: Day[];
    status: 'generated' | 'in_progress' | 'completed';
    createdAt: string;
    updatedAt: string;
}

/**
 * Roadmap summary for list views
 */
export interface RoadmapSummary {
    _id: string;
    career_domain: string;
    status: 'generated' | 'in_progress' | 'completed';
    current_day: number;
    total_days: number;
    progress: number;
    createdAt: string;
    updatedAt: string;
}
