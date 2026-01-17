import React, { useState } from 'react';
import { CheckCircle, PenLine, FileText, Lightbulb } from 'lucide-react';

interface TextExerciseProps {
    title: string;
    description?: string;
    placeholder?: string;
    minWords?: number;
    completed?: boolean;
    onComplete?: () => void;
    isLoading?: boolean;
}

/**
 * Text-based exercise component for writing/UX/Product exercises
 * Used for tasks like drafting interview questions, personas, user journeys, etc.
 */
const TextExercise: React.FC<TextExerciseProps> = ({
    title,
    description,
    placeholder = 'Write your response here...',
    minWords = 0,
    completed = false,
    onComplete,
    isLoading = false
}) => {
    const [text, setText] = useState('');

    // Calculate word count
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;
    const meetsMinimum = wordCount >= minWords;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <PenLine size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                {description && (
                    <p className="text-purple-100 text-sm mt-2">{description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 text-xs font-bold rounded-full uppercase">
                        Writing Exercise
                    </span>
                </div>
            </div>

            {/* Text Editor */}
            <div className="border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium">Your Response</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{wordCount} words</span>
                        <span className="text-gray-300">|</span>
                        <span>{charCount} characters</span>
                        {minWords > 0 && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span className={meetsMinimum ? 'text-green-600' : 'text-amber-600'}>
                                    Min: {minWords} words
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-64 p-4 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-inset"
                    placeholder={placeholder}
                    spellCheck={true}
                />
            </div>

            {/* Tips & Guidance Section */}
            <div className="p-6 bg-gray-50">
                {/* Tips */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                    <div className="flex items-start gap-3">
                        <Lightbulb size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Tips for this exercise:</strong>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li>Take your time to think through each point</li>
                                <li>Be specific and provide concrete examples</li>
                                <li>Consider different user perspectives</li>
                                <li>Review and refine your response before marking complete</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Completion Checkbox */}
                <label className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }
                `}>
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={completed}
                            onChange={() => !completed && onComplete?.()}
                            disabled={completed || isLoading}
                            className="peer w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-green-600 checked:border-green-600 transition-all cursor-pointer appearance-none disabled:cursor-not-allowed"
                        />
                        {completed && (
                            <CheckCircle size={16} className="absolute text-white pointer-events-none" />
                        )}
                    </div>
                    <span className={`font-medium ${completed ? 'text-green-700' : 'text-gray-700'}`}>
                        {completed ? 'Exercise completed ✓' : 'I completed this exercise'}
                    </span>
                    {isLoading && (
                        <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                    )}
                </label>
            </div>
        </div>
    );
};

export default TextExercise;
