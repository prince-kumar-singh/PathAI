import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoadmapNode } from '../../components/phase2/RoadmapNode';
import { TaskDrawer } from '../../components/phase2/TaskDrawer';

const RoadmapPreview: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const roadmapData = location.state?.roadmap;

    const [selectedDay, setSelectedDay] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Fallback if accessed directly without data (for dev/demo)
    if (!roadmapData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No Roadmap Found</h2>
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
                    >
                        Create New Roadmap
                    </button>
                </div>
            </div>
        );
    }

    const handleNodeClick = (dayData: any) => {
        setSelectedDay(dayData);
        setIsDrawerOpen(true);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <span className="text-sm font-bold text-indigo-600 tracking-wider">GENERATED ROADMAP</span>
                        <h1 className="text-2xl font-bold text-gray-900 capitalize">
                            {roadmapData.career_domain?.replace(/_/g, ' ')} Path
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900"
                        >
                            Exit
                        </button>
                        <button className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            Save Roadmap
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Timeline Tree */}
            <div className="container mx-auto px-6 py-12 max-w-3xl">
                <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto">
                    This 10-day personalized plan is designed to kickstart your journey in
                    <strong className="text-gray-800"> {roadmapData.career_domain?.replace(/_/g, ' ')}</strong>.
                    Click on a day to view tasks and resources.
                </p>

                <div className="space-y-8 relative pb-24">
                    {roadmapData.days?.map((day: any, index: number) => (
                        <RoadmapNode
                            key={index}
                            day={day.day_number}
                            title={day.title || `Day ${day.day_number}: ${day.topic}`}
                            description={day.learning_objectives?.[0] || day.description || "Complete daily tasks."}
                            status={index === 0 ? 'active' : 'locked'}
                            isLast={index === roadmapData.days.length - 1}
                            onClick={() => handleNodeClick(day)}
                        />
                    ))}
                </div>
            </div>

            {/* Task Details Drawer */}
            <TaskDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                data={selectedDay}
            />
        </div>
    );
};

export default RoadmapPreview;
