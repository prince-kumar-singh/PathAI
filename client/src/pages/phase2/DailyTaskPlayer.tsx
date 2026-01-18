import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    Video,
    BookOpen,
    Code2,
    ChevronRight,
    Clock,
    Loader2
} from 'lucide-react';
import { getDayTask, markResourceComplete } from '../../services/taskApi';
import type { Day, Task } from '../../types/phase2/roadmap.types';
import VideoPlayer from '../../components/phase2/VideoPlayer';
import ArticleRenderer from '../../components/phase2/ArticleRenderer';
import CodeEditor from '../../components/phase2/CodeEditor';
import TextExercise from '../../components/phase2/TextExercise';

/**
 * Helper to determine if exercise should use text-based UI based on career domain
 * Writing domains: UX, Product Management, Project Management, etc.
 */
const isWritingExercise = (careerDomain?: string): boolean => {
    if (!careerDomain) return false;
    const domain = careerDomain.toLowerCase();
    const writingDomains = [
        'product_management',
        'project_management',
        'ux',
        'ux_design',
        'ui_ux',
        'design',
        'business',
        'marketing'
    ];
    return writingDomains.some(d => domain.includes(d));
};

/**
 * Helper to determine the programming language based on career domain
 * Python domains: Data Science, AI, ML, Analytics, etc.
 * JavaScript domains: Web Development, Software Engineering, Frontend, etc.
 */
const getProgrammingLanguage = (careerDomain?: string): 'python' | 'javascript' => {
    if (!careerDomain) return 'javascript';
    const domain = careerDomain.toLowerCase();
    const pythonDomains = [
        'data_science',
        'data science',
        'ai',
        'artificial_intelligence',
        'artificial intelligence',
        'machine_learning',
        'machine learning',
        'ml',
        'analytics',
        'data_analytics',
        'data analytics',
        'python',
        'deep_learning',
        'deep learning'
    ];
    return pythonDomains.some(d => domain.includes(d)) ? 'python' : 'javascript';
};

type ResourceTab = 'video' | 'article' | 'exercise';

const DailyTaskPlayer: React.FC = () => {
    const { roadmapId, dayNumber } = useParams<{ roadmapId: string; dayNumber: string }>();
    const navigate = useNavigate();

    const [day, setDay] = useState<Day | null>(null);
    const [roadmapInfo, setRoadmapInfo] = useState<{ career_domain: string; total_days: number } | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState<ResourceTab>('video');
    const [isLoading, setIsLoading] = useState(true);
    const [completingResource, setCompletingResource] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch day data
    useEffect(() => {
        if (!roadmapId || !dayNumber) return;

        const fetchDay = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await getDayTask(roadmapId, parseInt(dayNumber));
                setDay(response.day);
                setRoadmapInfo({
                    career_domain: response.roadmap.career_domain,
                    total_days: response.roadmap.total_days
                });

                // Auto-select first task
                if (response.day.tasks?.length > 0) {
                    setSelectedTask(response.day.tasks[0]);
                    // Set active tab based on first task type
                    const firstType = response.day.tasks[0].type;
                    if (firstType === 'video') setActiveTab('video');
                    else if (firstType === 'article') setActiveTab('article');
                    else setActiveTab('exercise');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load day');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDay();
    }, [roadmapId, dayNumber]);

    // Handle resource completion
    const handleResourceComplete = async (taskId: string, resourceId: string) => {
        if (!roadmapId || !dayNumber) return;

        setCompletingResource(resourceId);
        try {
            await markResourceComplete(roadmapId, {
                dayNumber: parseInt(dayNumber),
                taskId,
                resourceId
            });

            // Update local state
            setDay(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tasks: prev.tasks.map(task => {
                        if (task.task_id !== taskId) return task;
                        return {
                            ...task,
                            resources: task.resources.map(res => {
                                if (res.id !== resourceId) return res;
                                return { ...res, completed: true };
                            })
                        };
                    })
                };
            });

            // Update selected task if applicable
            if (selectedTask?.task_id === taskId) {
                setSelectedTask(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        resources: prev.resources.map(res => {
                            if (res.id !== resourceId) return res;
                            return { ...res, completed: true };
                        })
                    };
                });
            }
        } catch (err) {
            console.error('Failed to mark resource complete:', err);
        } finally {
            setCompletingResource(null);
        }
    };

    // Get icon for task type
    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} />;
            case 'article': return <BookOpen size={16} />;
            case 'exercise':
            case 'project': return <Code2 size={16} />;
            default: return <BookOpen size={16} />;
        }
    };

    // Calculate completion for a task
    const getTaskCompletion = (task: Task): { completed: number; total: number } => {
        const total = task.resources?.length || 0;
        const completed = task.resources?.filter(r => r.completed).length || 0;
        return { completed, total };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading today's tasks...</p>
                </div>
            </div>
        );
    }

    if (error || !day) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {error || 'Day not found'}
                    </h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-100">
                    <button
                        onClick={() => navigate(`/roadmap/${roadmapId}/preview`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Back to Roadmap</span>
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                            DAY {dayNumber}
                        </span>
                        <span className="text-sm text-gray-500">
                            of {roadmapInfo?.total_days || 10}
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">{day.title}</h1>
                </div>

                {/* Progress */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Day Progress</span>
                        <span className="font-bold text-indigo-600">{day.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${day.progress || 0}%` }}
                        />
                    </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                        Today's Tasks
                    </h3>
                    <div className="space-y-2">
                        {day.tasks.map((task, idx) => {
                            const completion = getTaskCompletion(task);
                            const isSelected = selectedTask?.task_id === task.task_id;
                            const isComplete = completion.total > 0 && completion.completed === completion.total;

                            return (
                                <button
                                    key={task.task_id || idx}
                                    onClick={() => {
                                        setSelectedTask(task);
                                        if (task.type === 'video') setActiveTab('video');
                                        else if (task.type === 'article') setActiveTab('article');
                                        else setActiveTab('exercise');
                                    }}
                                    className={`
                                        w-full text-left p-4 rounded-xl transition-all
                                        ${isSelected
                                            ? 'bg-indigo-50 border-2 border-indigo-300'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`
                                            mt-0.5 p-2 rounded-lg
                                            ${isComplete ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}
                                        `}>
                                            {isComplete ? <CheckCircle size={16} /> : getTaskIcon(task.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-medium truncate ${isComplete ? 'text-green-700' : 'text-gray-800'}`}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span className="capitalize">{task.type}</span>
                                                {task.estimated_time_minutes && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {task.estimated_time_minutes}min
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {completion.total > 0 && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 transition-all"
                                                            style={{ width: `${(completion.completed / completion.total) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {completion.completed}/{completion.total}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400 mt-2" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Navigation */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                    <button
                        onClick={() => navigate(`/roadmap/${roadmapId}/day/${parseInt(dayNumber!) - 1}`)}
                        disabled={parseInt(dayNumber!) <= 1}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={() => navigate(`/roadmap/${roadmapId}/day/${parseInt(dayNumber!) + 1}`)}
                        disabled={parseInt(dayNumber!) >= (roadmapInfo?.total_days || 10)}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {selectedTask ? (
                    <div className="max-w-4xl mx-auto p-8">
                        {/* Task Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {selectedTask.title}
                            </h2>
                            {selectedTask.description && (
                                <p className="text-gray-600 text-lg">
                                    {selectedTask.description}
                                </p>
                            )}
                        </div>

                        {/* Resource Tabs */}
                        <div className="flex gap-2 mb-6">
                            {(['video', 'article', 'exercise'] as ResourceTab[]).map(tab => {
                                const isActive = activeTab === tab;
                                const hasResources = selectedTask.type === tab ||
                                    (tab === 'exercise' && selectedTask.type === 'project');

                                if (!hasResources && selectedTask.resources.length === 0) return null;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                            flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all
                                            ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }
                                        `}
                                    >
                                        {tab === 'video' && <Video size={18} />}
                                        {tab === 'article' && <BookOpen size={18} />}
                                        {tab === 'exercise' && <Code2 size={18} />}
                                        <span className="capitalize">{tab}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Resource Content */}
                        <div className="space-y-6">
                            {selectedTask.resources.map((resource, idx) => {
                                const resourceId = resource.id || `res_${idx + 1}`;
                                const isCompleting = completingResource === resourceId;

                                // Render based on task type (resources inherit task type)
                                if (activeTab === 'video' && selectedTask.type === 'video') {
                                    return (
                                        <VideoPlayer
                                            key={resourceId}
                                            title={resource.title}
                                            url={resource.url}
                                            platform={resource.platform}
                                            completed={resource.completed}
                                            onComplete={() => handleResourceComplete(selectedTask.task_id, resourceId)}
                                            isLoading={isCompleting}
                                        />
                                    );
                                }

                                if (activeTab === 'article' && selectedTask.type === 'article') {
                                    return (
                                        <ArticleRenderer
                                            key={resourceId}
                                            title={resource.title}
                                            url={resource.url}
                                            platform={resource.platform}
                                            description={resource.description}
                                            completed={resource.completed}
                                            onComplete={() => handleResourceComplete(selectedTask.task_id, resourceId)}
                                            isLoading={isCompleting}
                                        />
                                    );
                                }

                                if (activeTab === 'exercise' && (selectedTask.type === 'exercise' || selectedTask.type === 'project')) {
                                    // Route to appropriate component based on career domain
                                    if (isWritingExercise(roadmapInfo?.career_domain)) {
                                        return (
                                            <TextExercise
                                                key={resourceId}
                                                title={resource.title}
                                                description={resource.description || selectedTask.description}
                                                placeholder="Write your response here. Take your time to think through each point carefully..."
                                                completed={resource.completed}
                                                onComplete={() => handleResourceComplete(selectedTask.task_id, resourceId)}
                                                isLoading={isCompleting}
                                            />
                                        );
                                    }
                                    // Default to CodeEditor for technical domains
                                    const codeLanguage = getProgrammingLanguage(roadmapInfo?.career_domain);
                                    return (
                                        <CodeEditor
                                            key={resourceId}
                                            title={resource.title}
                                            description={resource.description || selectedTask.description}
                                            language={codeLanguage}
                                            allowLanguageSwitch={true}
                                            completed={resource.completed}
                                            onComplete={() => handleResourceComplete(selectedTask.task_id, resourceId)}
                                            isLoading={isCompleting}
                                        />
                                    );
                                }

                                return null;
                            })}

                            {/* Empty state for tab */}
                            {selectedTask.resources.length === 0 && (
                                <div className="bg-gray-50 rounded-2xl p-12 text-center">
                                    <div className="max-w-md mx-auto">
                                        {activeTab === 'video' && <Video size={48} className="mx-auto text-gray-400 mb-4" />}
                                        {activeTab === 'article' && <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />}
                                        {activeTab === 'exercise' && <Code2 size={48} className="mx-auto text-gray-400 mb-4" />}
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                            No {activeTab} resources
                                        </h3>
                                        <p className="text-gray-500">
                                            This task doesn't have any {activeTab} content. Try another tab!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Select a task from the sidebar to get started</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyTaskPlayer;
