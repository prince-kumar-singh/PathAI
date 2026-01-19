import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, BookOpen, Clock, Youtube, CheckCircle, PlayCircle, AlertTriangle } from 'lucide-react';

// Matches the backend response from markDayComplete when validation fails
interface ValidationError {
    error?: string;
    message?: string;
    requirements?: {
        resourcesComplete: { met: boolean; current: number; required: number };
        quizPassed: { met: boolean; score: number; required: number };
    };
    missingCriteria?: string[];
}

interface TaskDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    roadmapId?: string;
    onDayComplete?: (dayNumber: number) => void;
    isLoading?: boolean;
    validationError?: ValidationError | null;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
    isOpen,
    onClose,
    data,
    roadmapId,
    onDayComplete,
    isLoading = false,
    validationError
}) => {
    const navigate = useNavigate();
    const errorRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to error when it appears
    React.useEffect(() => {
        if (validationError && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [validationError]);

    if (!data) return null;

    // Calculate resource completion from task data
    const totalResources = data.tasks?.reduce((sum: number, task: any) =>
        sum + (task.resources?.length || 0), 0) || 0;
    const completedResourceCount = data.tasks?.reduce((sum: number, task: any) =>
        sum + (task.resources?.filter((r: any) => r.completed)?.length || 0), 0) || 0;
    const resourceProgress = totalResources > 0
        ? Math.round((completedResourceCount / totalResources) * 100)
        : 100;

    const handleDayComplete = () => {
        onDayComplete?.(data.day_number);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className={`
                fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div>
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-2">
                                DAY {data.day_number}
                            </span>
                            <h2 className="text-2xl font-bold text-gray-800">{data.title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-full transition-colors"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* 🎯 Objective */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                <span className="bg-yellow-100 p-1 rounded">🎯</span> Learning Objective
                            </h3>
                            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {data.learning_objectives?.[0] || data.goal || data.description || "Master the core concepts defined for today."}
                            </p>
                        </div>

                        {/* 📊 Completion Requirements - Only show if not completed */}
                        {!data.completed && (
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                    <span className="bg-purple-100 p-1 rounded">📊</span> Completion Requirements
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                    {/* Resource Progress */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                {resourceProgress === 100 ? (
                                                    <CheckCircle size={16} className="text-green-500" />
                                                ) : (
                                                    <BookOpen size={16} className="text-gray-400" />
                                                )}
                                                Resources Completed
                                            </span>
                                            <span className={`text-sm font-bold ${resourceProgress === 100 ? 'text-green-600' : 'text-gray-600'}`}>
                                                {completedResourceCount}/{totalResources}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${resourceProgress === 100
                                                    ? 'bg-green-500'
                                                    : 'bg-indigo-500'
                                                    }`}
                                                style={{ width: `${resourceProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Quiz Status */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                {data.quizPassed ? (
                                                    <CheckCircle size={16} className="text-green-500" />
                                                ) : (
                                                    <AlertTriangle size={16} className="text-amber-400" />
                                                )}
                                                Quiz Passed (70%+ required)
                                            </span>
                                            <span className={`text-sm font-bold ${data.quizPassed ? 'text-green-600' : 'text-amber-600'}`}>
                                                {data.quizPassed ? '✓ Passed' : (data.bestQuizScore ? `Best: ${data.bestQuizScore}%` : 'Not Yet')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ✅ Tasks Checklist */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                <span className="bg-green-100 p-1 rounded">✅</span> Today's Tasks
                            </h3>
                            <div className="space-y-3">
                                {data.tasks?.map((task: any, idx: number) => (
                                    <label key={idx} className="flex items-start gap-4 p-4 rounded-xl border-2 border-transparent hover:border-gray-100 hover:bg-gray-50 cursor-pointer transition-all group">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input type="checkbox" className="peer w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer appearance-none" />
                                            <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-gray-700 group-hover:text-gray-900 peer-checked:line-through peer-checked:text-gray-400 transition-colors font-medium">
                                                {typeof task === 'string' ? task : task.title}
                                            </span>
                                            {task.description && (
                                                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 📚 Resources */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                <span className="bg-blue-100 p-1 rounded">📚</span> Recommended Resources
                            </h3>
                            <div className="space-y-3">
                                {(() => {
                                    // Helper to generate search URL as fallback
                                    const getResourceUrl = (res: any) => {
                                        // Use real URL if available from DuckDuckGo search
                                        if (res.url && res.url.startsWith('http')) {
                                            return res.url;
                                        }

                                        // Fallback: generate platform-specific search URL
                                        const searchQuery = encodeURIComponent(
                                            `${res.title || ''} ${res.url_hint || ''} tutorial`.trim()
                                        );
                                        const platform = res.platform?.toLowerCase() || '';

                                        if (platform.includes('youtube')) {
                                            return `https://www.youtube.com/results?search_query=${searchQuery}`;
                                        } else if (platform.includes('medium')) {
                                            return `https://medium.com/search?q=${searchQuery}`;
                                        } else if (platform.includes('freecodecamp')) {
                                            return `https://www.freecodecamp.org/news/search/?query=${searchQuery}`;
                                        } else if (platform.includes('dev.to')) {
                                            return `https://dev.to/search?q=${searchQuery}`;
                                        } else if (platform.includes('mdn') || platform.includes('mozilla')) {
                                            return `https://developer.mozilla.org/en-US/search?q=${searchQuery}`;
                                        } else if (platform.includes('w3schools')) {
                                            return `https://www.w3schools.com/search/search_result.asp?query=${searchQuery}`;
                                        } else if (platform.includes('geeksforgeeks')) {
                                            return `https://www.geeksforgeeks.org/search/?q=${searchQuery}`;
                                        }

                                        // Default: Google search
                                        return `https://www.google.com/search?q=${searchQuery}`;
                                    };

                                    // Collect all resources from all tasks
                                    const allResources = data.tasks?.reduce((acc: any[], task: any) => {
                                        if (task.resources && Array.isArray(task.resources)) {
                                            return [...acc, ...task.resources];
                                        }
                                        return acc;
                                    }, []) || [];

                                    return allResources.length > 0 ? (
                                        allResources.map((res: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={getResourceUrl(res)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${res.completed
                                                    ? 'border-green-200 bg-green-50'
                                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${res.completed
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {res.completed ? (
                                                        <CheckCircle size={20} />
                                                    ) : res.platform?.toLowerCase().includes('youtube') || res.platform?.toLowerCase().includes('video') ? (
                                                        <Youtube size={20} />
                                                    ) : (
                                                        <BookOpen size={20} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-semibold truncate ${res.completed
                                                        ? 'text-green-700'
                                                        : 'text-gray-800 group-hover:text-indigo-700'
                                                        }`}>
                                                        {res.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {res.platform || 'Resource'} {res.url ? '• Direct link' : '• Search'}
                                                        {res.completed && ' • ✓ Completed'}
                                                    </p>
                                                </div>
                                                <ExternalLink size={16} className="text-gray-400 group-hover:text-indigo-600" />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-xl">
                                            Resources will be curated for you soon! 🤖
                                        </p>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* ⏱️ Time Estimation */}
                        <div className="bg-indigo-900 text-white p-5 rounded-2xl flex items-center gap-4">
                            <Clock className="text-indigo-300" />
                            <div>
                                <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Estimated Time</p>
                                <p className="font-bold text-lg">1.5 - 2 Hours</p>
                            </div>
                        </div>

                    </div>

                    {/* Activity Footer */}
                    <div className="p-6 border-t bg-gray-50 space-y-3">
                        {/* Validation Error Message - Made more prominent */}
                        {validationError && (
                            <div ref={errorRef} className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-xl text-sm animate-pulse">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-red-600" />
                                    <div>
                                        <p className="font-bold mb-2 text-red-700">⚠️ Cannot complete day yet!</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {validationError.missingCriteria?.map((criteria, i) => (
                                                <li key={i} className="font-medium">{criteria}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* View Full Task Button */}
                        {roadmapId && (
                            <button
                                onClick={() => navigate(`/roadmap/${roadmapId}/day/${data.day_number}`)}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <PlayCircle size={20} />
                                View Full Task Player
                            </button>
                        )}

                        {data.completed ? (
                            <div className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                Day Completed ✓
                            </div>
                        ) : (
                            <button
                                onClick={handleDayComplete}
                                disabled={isLoading || !onDayComplete}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Checking...
                                    </>
                                ) : (
                                    'Mark Day as Complete ✓'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
