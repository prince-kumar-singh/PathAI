import React from 'react';
import { X, ExternalLink, BookOpen, Clock, Youtube, CheckCircle } from 'lucide-react';

interface TaskDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    onDayComplete?: (dayNumber: number) => Promise<void>;
    isLoading?: boolean;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ isOpen, onClose, data, onDayComplete, isLoading = false }) => {
    if (!data) return null;

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
                                                href={res.url || res.url_hint || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    {res.platform?.toLowerCase().includes('youtube') || res.platform?.toLowerCase().includes('video') ? <Youtube size={20} /> : <BookOpen size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-800 truncate group-hover:text-indigo-700">
                                                        {res.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {res.platform || 'Resource'}
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
                    <div className="p-6 border-t bg-gray-50">
                        {data.completed ? (
                            <div className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                Day Completed ✓
                            </div>
                        ) : (
                            <button
                                onClick={() => onDayComplete?.(data.day_number)}
                                disabled={isLoading || !onDayComplete}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Saving...
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
