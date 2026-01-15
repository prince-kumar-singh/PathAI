import React from 'react';

export interface Option {
    value: string | number;
    label: string;
    description: string;
}

export interface Question {
    id: string;
    question: string;
    icon: string;
    options: Option[];
}

interface QuestionCardProps {
    question: Question;
    selectedValue: string | number | undefined;
    onSelect: (questionId: string, value: any) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, selectedValue, onSelect }) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 animate-fadeIn">
            <div className="text-center mb-8">
                <div className="text-6xl mb-4">{question.icon}</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {question.question}
                </h2>
            </div>

            {/* Options */}
            <div className="grid gap-4">
                {question.options.map((option) => {
                    const isSelected = selectedValue === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => onSelect(question.id, option.value)}
                            className={`
                                p-6 rounded-xl border-2 text-left transition-all duration-200
                                ${isSelected
                                    ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-[1.02]'
                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                }
                            `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1
                                    ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}
                                `}>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
                                        {option.label}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {option.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
