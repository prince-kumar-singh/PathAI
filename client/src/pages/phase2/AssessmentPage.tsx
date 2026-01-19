import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import QuizAssessment from "../../components/phase2/QuizAssessment";

interface RoadmapDay {
    day_number: number;
    title: string;
    completed: boolean;
    key_topics?: string[];
    learning_objectives?: string[];
}

interface Roadmap {
    _id: string;
    career_domain: string;
    current_day: number;
    days: RoadmapDay[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AssessmentPage = () => {
    const { roadmapId, dayNumber } = useParams<{
        roadmapId: string;
        dayNumber: string;
    }>();
    const navigate = useNavigate();

    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInstructions, setShowInstructions] = useState(true);

    const dayNum = parseInt(dayNumber || "1");

    useEffect(() => {
        fetchRoadmap();
    }, [roadmapId]);

    const fetchRoadmap = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/roadmaps/${roadmapId}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                throw new Error("Failed to load roadmap");
            }

            const data = await response.json();
            setRoadmap(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async (passed: boolean, _score: number) => {
        if (passed && roadmap) {
            try {
                await fetch(
                    `${API_BASE_URL}/api/v1/roadmaps/${roadmapId}/day/complete`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ dayNumber: dayNum }),
                    }
                );
            } catch (err) {
                console.error("Failed to mark day complete:", err);
            }

            if (dayNum < (roadmap.days?.length || 10)) {
                navigate(`/roadmap/${roadmapId}/day/${dayNum + 1}`);
            } else {
                navigate(`/roadmap/${roadmapId}/preview`);
            }
        }
    };

    const handleCancel = () => {
        navigate(`/roadmap/${roadmapId}/day/${dayNumber}`);
    };

    const currentDay = roadmap?.days?.find((d) => d.day_number === dayNum);

    // Premium Loading State
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl">📝</span>
                        </div>
                    </div>
                    <p className="mt-6 text-lg font-medium text-gray-600">Loading assessment...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">😕</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Pre-assessment Instructions - Premium Design
    if (showInstructions) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
                <div className="max-w-2xl w-full">
                    {/* Back Button */}
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        <span>Back to Day {dayNumber}</span>
                    </button>

                    {/* Main Card */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header with Gradient */}
                        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white text-center relative overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

                            <div className="relative">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                                    <span className="text-5xl">📝</span>
                                </div>
                                <h1 className="text-3xl font-black mb-2">Day {dayNumber} Quiz</h1>
                                <p className="text-white/80 text-lg">{currentDay?.title || "Assessment"}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                                    <div className="text-3xl font-black text-blue-600">5</div>
                                    <div className="text-sm text-blue-700 font-medium">Questions</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                                    <div className="text-3xl font-black text-green-600">70%</div>
                                    <div className="text-sm text-green-700 font-medium">To Pass</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
                                    <div className="text-3xl font-black text-purple-600">∞</div>
                                    <div className="text-sm text-purple-700 font-medium">Retries</div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="mb-8">
                                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">📋</span>
                                    How it works
                                </h2>
                                <div className="space-y-3">
                                    {[
                                        { icon: "🤖", text: "AI generates questions based on today's topics" },
                                        { icon: "✅", text: "Answer all 5 multiple-choice questions" },
                                        { icon: "🎯", text: "Score 70% or higher to unlock the next day" },
                                        { icon: "🔄", text: "No limit on retries - practice makes perfect!" },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="text-gray-700">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Topics Preview */}
                            {currentDay?.key_topics && currentDay.key_topics.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">📚</span>
                                        Topics Covered
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {currentDay.key_topics.map((topic: string, i: number) => (
                                            <span
                                                key={i}
                                                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="bg-amber-50 rounded-2xl p-5 mb-8 border border-amber-100">
                                <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                    <span>💡</span> Pro Tips
                                </h3>
                                <ul className="text-amber-700 text-sm space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1">•</span>
                                        <span>Read each question carefully before answering</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1">•</span>
                                        <span>Use the navigation dots to jump between questions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1">•</span>
                                        <span>Review all your answers before submitting</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition transform hover:scale-[1.02]"
                                >
                                    Maybe Later
                                </button>
                                <button
                                    onClick={() => setShowInstructions(false)}
                                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-200 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 group"
                                >
                                    <span>Start Quiz</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz Component
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
            <QuizAssessment
                roadmapId={roadmapId || ""}
                dayNumber={dayNum}
                onComplete={handleComplete}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default AssessmentPage;
