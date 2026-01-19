import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RoadmapNode } from '../../components/phase2/RoadmapNode';
import { TaskDrawer } from '../../components/phase2/TaskDrawer';

const RoadmapPreview: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { roadmapId } = useParams<{ roadmapId: string }>();
    const initialRoadmap = location.state?.roadmap;

    const [roadmapData, setRoadmapData] = useState<any>(initialRoadmap);
    const [selectedDay, setSelectedDay] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(!initialRoadmap);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Track quiz count for badge
    const [quizCount, setQuizCount] = useState(0);

    // Fetch roadmap from API if not available in location.state
    useEffect(() => {
        if (!roadmapData && roadmapId) {
            const fetchRoadmap = async () => {
                try {
                    setIsLoading(true);
                    setFetchError(null);
                    const response = await fetch(`/api/v1/roadmaps/${roadmapId}`, {
                        credentials: 'include'
                    });

                    if (!response.ok) {
                        throw new Error('Roadmap not found');
                    }

                    const data = await response.json();
                    setRoadmapData(data);
                } catch (error) {
                    console.error('Error fetching roadmap:', error);
                    setFetchError('Unable to load roadmap. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchRoadmap();
        }
    }, [roadmapId, roadmapData]);

    // Fetch quiz count for this roadmap
    useEffect(() => {
        if (roadmapId) {
            fetchQuizCount();
        }
    }, [roadmapId]);

    const fetchQuizCount = async () => {
        try {
            const response = await fetch(`/api/v1/assessments/history`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const count = data.assessments?.filter(
                    (a: any) => a.roadmapId === roadmapId
                ).length || 0;
                setQuizCount(count);
            }
        } catch (error) {
            console.error('Error fetching quiz count:', error);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your roadmap...</p>
                </div>
            </div>
        );
    }

    // Error or no roadmap state
    if (fetchError || !roadmapData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">
                        {fetchError || 'No Roadmap Found'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {fetchError ? 'There was an issue loading your roadmap.' : 'Create a personalized learning path to get started.'}
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Create New Roadmap
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    const handleNodeClick = (dayData: any) => {
        setSelectedDay(dayData);
        setIsDrawerOpen(true);
    };

    const handleDayComplete = async (dayNumber: number) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/v1/roadmaps/${roadmapData._id}/day/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ dayNumber })
            });

            if (!response.ok) {
                throw new Error('Failed to mark day as complete');
            }

            const result = await response.json();
            setRoadmapData(result.roadmap);

            if (selectedDay?.day_number === dayNumber) {
                const updatedDay = result.roadmap.days.find((d: any) => d.day_number === dayNumber);
                setSelectedDay(updatedDay);
            }

            setIsDrawerOpen(false);

        } catch (error) {
            console.error('Error marking day complete:', error);
            alert('Failed to mark day as complete. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                    <div className="flex gap-3 items-center">
                        {/* Quiz History Button - navigates to full page */}
                        <button
                            onClick={() => navigate(`/roadmap/${roadmapId}/quiz-history`)}
                            className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium text-sm transition flex items-center gap-2"
                        >
                            <span>📊</span>
                            Quiz History
                            {quizCount > 0 && (
                                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                    {quizCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900"
                        >
                            Exit
                        </button>
                        <div className="px-5 py-2 bg-green-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                        </div>
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
                    {roadmapData.days?.map((day: any, index: number) => {
                        let status: 'completed' | 'active' | 'locked' = 'locked';

                        if (day.completed) {
                            status = 'completed';
                        } else if (day.day_number === roadmapData.current_day) {
                            status = 'active';
                        } else if (day.day_number < roadmapData.current_day) {
                            status = 'active';
                        }

                        return (
                            <RoadmapNode
                                key={index}
                                day={day.day_number}
                                title={day.title || `Day ${day.day_number}: ${day.topic}`}
                                description={day.learning_objectives?.[0] || day.description || "Complete daily tasks."}
                                status={status}
                                isLast={index === roadmapData.days.length - 1}
                                onClick={() => handleNodeClick(day)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Task Details Drawer */}
            <TaskDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                data={selectedDay}
                roadmapId={roadmapData._id}
                onDayComplete={handleDayComplete}
                isLoading={isLoading}
            />
        </div>
    );
};

export default RoadmapPreview;
