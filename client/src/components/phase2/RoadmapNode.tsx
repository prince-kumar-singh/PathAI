import React from 'react';
import { CheckCircle2, Lock, ArrowRight } from 'lucide-react';

interface RoadmapNodeProps {
    day: number;
    title: string;
    description: string;
    status: 'locked' | 'active' | 'completed';
    isLast: boolean;
    onClick: () => void;
}

export const RoadmapNode: React.FC<RoadmapNodeProps> = ({
    day,
    title,
    description,
    status,
    isLast,
    onClick
}) => {

    const getStatusStyles = () => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 border-green-500 text-green-700';
            case 'active':
                return 'bg-white border-indigo-600 shadow-lg scale-105 ring-4 ring-indigo-50';
            case 'locked':
                return 'bg-gray-50 border-gray-200 text-gray-400 grayscale';
            default:
                return 'bg-white border-gray-200';
        }
    };

    return (
        <div className="relative flex group">
            {/* Timeline Line (Vertical) */}
            {!isLast && (
                <div className="absolute left-[2.25rem] top-16 bottom-[-2rem] w-1 bg-gray-200 group-hover:bg-indigo-200 transition-colors z-0"></div>
            )}

            {/* Icon / Number Bubble */}
            <div className={`
                relative z-10 flex-shrink-0 rounded-full border-4 flex flex-col items-center justify-center font-bold
                transition-all duration-300
                ${status === 'active' ? 'w-20 h-20 border-indigo-600 bg-white text-indigo-600 shadow-xl' : 'w-[4.5rem] h-[4.5rem]'}
                ${status === 'completed' ? 'border-green-500 bg-green-500 text-white' : ''}
                ${status === 'locked' ? 'border-gray-300 bg-gray-100 text-gray-400' : ''}
            `}>
                {status === 'completed' ? (
                    <CheckCircle2 size={32} />
                ) : (
                    <>
                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">Day</span>
                        <span className="text-2xl leading-none">{day}</span>
                    </>
                )}
            </div>

            {/* Content Card */}
            <div
                onClick={status !== 'locked' ? onClick : undefined}
                className={`
                ml-8 flex-1 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
                ${getStatusStyles()}
                ${status !== 'locked' ? 'hover:-translate-y-1 hover:shadow-md' : 'cursor-not-allowed'}
            `}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`text-xl font-bold mb-1 ${status === 'active' ? 'text-indigo-700' : ''}`}>
                            {title}
                        </h3>
                        <p className={`text-sm line-clamp-2 md:line-clamp-none ${status === 'active' ? 'text-slate-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                            {description}
                        </p>
                    </div>
                    {status !== 'locked' && (
                        <ArrowRight className={`
                            w-6 h-6 transform transition-transform duration-300
                            ${status === 'active' ? 'text-indigo-600 translate-x-1' : 'text-gray-400 group-hover:translate-x-1'}
                        `} />
                    )}
                    {status === 'locked' && <Lock className="w-5 h-5 opacity-50" />}
                </div>
            </div>
        </div>
    );
};
