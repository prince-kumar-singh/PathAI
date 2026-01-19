import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";

interface Answer {
    questionIndex: number;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    questionText?: string;
    options?: string[];
}

interface Assessment {
    _id: string;
    roadmapId: string;
    careerDomain: string;
    dayNumber: number;
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    answers: Answer[];
    submittedAt: string;
}

interface RoadmapDay {
    day_number: number;
    title: string;
    completed: boolean;
}

interface RoadmapData {
    _id: string;
    career_domain: string;
    days: RoadmapDay[];
    total_days: number;
}

type SortField = "date" | "score" | "day";
type SortOrder = "asc" | "desc";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const RoadmapQuizHistoryPage = () => {
    const { roadmapId } = useParams<{ roadmapId: string }>();
    const navigate = useNavigate();

    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuiz, setSelectedQuiz] = useState<Assessment | null>(null);

    // Sorting
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    useEffect(() => {
        if (roadmapId) {
            fetchData();
        }
    }, [roadmapId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch roadmap data
            const roadmapRes = await fetch(`${API_BASE_URL}/api/v1/roadmaps/${roadmapId}`, {
                credentials: "include",
            });

            // Check for authentication error
            if (roadmapRes.status === 401 || roadmapRes.status === 403) {
                navigate("/login", { replace: true });
                return;
            }

            if (roadmapRes.ok) {
                const roadmapData = await roadmapRes.json();
                setRoadmap(roadmapData);
            } else {
                // Roadmap not found or other error
                setError("Roadmap not found. Please check the URL.");
                return;
            }

            // Fetch assessment history
            const historyRes = await fetch(`${API_BASE_URL}/api/v1/assessments/history`, {
                credentials: "include",
            });

            if (historyRes.status === 401 || historyRes.status === 403) {
                navigate("/login", { replace: true });
                return;
            }

            if (historyRes.ok) {
                const data = await historyRes.json();
                // Filter to this roadmap only
                const filtered = data.assessments?.filter((a: Assessment) => a.roadmapId === roadmapId) || [];
                setAssessments(filtered);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    // Split into high-scoring (≥70%) and other attempts
    const highScoringAttempts = useMemo(() => {
        return assessments
            .filter((a) => a.score >= 70)
            .sort((a, b) => {
                if (sortField === "date") return sortOrder === "desc"
                    ? new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                    : new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
                if (sortField === "score") return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
                // sortField === "day"
                return sortOrder === "desc" ? b.dayNumber - a.dayNumber : a.dayNumber - b.dayNumber;
            });
    }, [assessments, sortField, sortOrder]);

    const otherAttempts = useMemo(() => {
        return assessments
            .filter((a) => a.score < 70)
            .sort((a, b) => {
                if (sortField === "date") return sortOrder === "desc"
                    ? new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                    : new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
                if (sortField === "score") return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
                // sortField === "day"
                return sortOrder === "desc" ? b.dayNumber - a.dayNumber : a.dayNumber - b.dayNumber;
            });
    }, [assessments, sortField, sortOrder]);

    // Latest highest score
    const latestHighest = useMemo(() => {
        if (highScoringAttempts.length === 0) return null;
        return highScoringAttempts.reduce((best, current) =>
            current.score > best.score ? current : best
            , highScoringAttempts[0]);
    }, [highScoringAttempts]);

    // Group high-scoring by day for context
    const dayGroups = useMemo(() => {
        const groups: Record<number, Assessment[]> = {};
        highScoringAttempts.forEach((a) => {
            if (!groups[a.dayNumber]) groups[a.dayNumber] = [];
            groups[a.dayNumber].push(a);
        });
        return groups;
    }, [highScoringAttempts]);

    // Get best score per day (for cumulative calculation)
    const bestScorePerDay = useMemo(() => {
        const best: Record<number, number> = {};
        assessments.forEach((a) => {
            if (!best[a.dayNumber] || a.score > best[a.dayNumber]) {
                best[a.dayNumber] = a.score;
            }
        });
        return best;
    }, [assessments]);

    // Calculate progression stats - ALL 10 days must be completed
    const progressionStats = useMemo(() => {
        const totalDays = roadmap?.total_days || roadmap?.days?.length || 10;
        const completedDays = Object.keys(bestScorePerDay).length;
        const allDaysCompleted = completedDays >= totalDays;

        // Get list of missing days
        const missingDays: number[] = [];
        for (let i = 1; i <= totalDays; i++) {
            if (!bestScorePerDay[i]) {
                missingDays.push(i);
            }
        }

        // Calculate cumulative score (average of BEST scores per day)
        let cumulativeScore = 0;
        if (allDaysCompleted) {
            const totalBestScores = Object.values(bestScorePerDay).reduce((sum, score) => sum + score, 0);
            cumulativeScore = Math.round(totalBestScores / totalDays);
        } else if (completedDays > 0) {
            // Show current progress even if not all days complete
            const totalBestScores = Object.values(bestScorePerDay).reduce((sum, score) => sum + score, 0);
            cumulativeScore = Math.round(totalBestScores / completedDays);
        }

        // Phase 3 eligible ONLY if all days done AND cumulative ≥60%
        const phase3Eligible = allDaysCompleted && cumulativeScore >= 60;

        return {
            totalDays,
            completedDays,
            allDaysCompleted,
            missingDays,
            cumulativeScore,
            phase3Eligible,
            totalAttempts: assessments.length,
            passedAttempts: assessments.filter(a => a.passed).length,
        };
    }, [assessments, bestScorePerDay, roadmap]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDomain = (domain: string) => {
        return domain?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl">📊</span>
                        </div>
                    </div>
                    <p className="mt-6 text-lg font-medium text-gray-600">Loading quiz history...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">😕</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(`/roadmap/${roadmapId}/preview`)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                    >
                        Back to Roadmap
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/roadmap/${roadmapId}/preview`)}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition group"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform text-xl">←</span>
                            </button>
                            <div>
                                <span className="text-sm font-bold text-amber-600 tracking-wider">QUIZ HISTORY</span>
                                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                                    {formatDomain(roadmap?.career_domain || "")} Path
                                </h1>
                            </div>
                        </div>
                        {/* Sort Controls */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Sort:</span>
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as SortField)}
                                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-semibold border-2 border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                            >
                                <option value="date">📅 Date</option>
                                <option value="score">📊 Score</option>
                                <option value="day">📆 Day</option>
                            </select>
                            <button
                                onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition shadow-sm"
                            >
                                {sortOrder === "desc" ? "↓ Newest First" : "↑ Oldest First"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 max-w-5xl">
                {/* Progression Status Card */}
                <div className={`rounded-3xl p-6 mb-8 shadow-lg ${progressionStats.phase3Eligible
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    : progressionStats.allDaysCompleted
                        ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                        : "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                    }`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">
                                {progressionStats.phase3Eligible
                                    ? "🎉 Phase 3 Unlocked!"
                                    : progressionStats.allDaysCompleted
                                        ? "📝 Score Below Threshold"
                                        : "📈 Complete All Days!"}
                            </h2>
                            <p className="text-white/90">
                                {progressionStats.phase3Eligible
                                    ? "Congratulations! You've completed all days with a cumulative score of 60% or higher."
                                    : progressionStats.allDaysCompleted
                                        ? `Your cumulative score is ${progressionStats.cumulativeScore}%. Retake quizzes to reach 60%.`
                                        : `Complete quizzes for all ${progressionStats.totalDays} days to unlock Phase 3.`}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                                <div className="text-3xl font-black">{progressionStats.completedDays}/{progressionStats.totalDays}</div>
                                <div className="text-sm text-white/80">Days Done</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                                <div className="text-3xl font-black">{progressionStats.cumulativeScore}%</div>
                                <div className="text-sm text-white/80">Cumulative</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                                <div className="text-3xl font-black">{progressionStats.passedAttempts}/{progressionStats.totalAttempts}</div>
                                <div className="text-sm text-white/80">Passed</div>
                            </div>
                        </div>
                    </div>

                    {/* Missing Days Warning */}
                    {!progressionStats.allDaysCompleted && progressionStats.missingDays.length > 0 && (
                        <div className="mt-4 bg-white/10 rounded-xl p-4">
                            <p className="text-sm font-medium mb-2">⚠️ Missing quizzes for days:</p>
                            <div className="flex flex-wrap gap-2">
                                {progressionStats.missingDays.map((day) => (
                                    <span key={day} className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                                        Day {day}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Low Score Warning */}
                    {progressionStats.allDaysCompleted && !progressionStats.phase3Eligible && (
                        <div className="mt-4 bg-white/10 rounded-xl p-4">
                            <p className="text-sm">💡 <strong>Tip:</strong> Your cumulative score is below 60%. Review and retake quizzes to improve your score and unlock Phase 3.</p>
                        </div>
                    )}
                </div>

                {/* Latest Highest Score Highlight */}
                {latestHighest && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span>🏆</span> Your Best Performance
                        </h3>
                        <div
                            onClick={() => setSelectedQuiz(latestHighest)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl cursor-pointer transition-all hover:scale-[1.01]"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                    <span className="text-4xl font-black">{latestHighest.score}%</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-xl font-bold">Day {latestHighest.dayNumber}</div>
                                    <div className="text-white/80">
                                        {latestHighest.correctAnswers}/{latestHighest.totalQuestions} correct • {formatDate(latestHighest.submittedAt)}
                                    </div>
                                </div>
                                <span className="text-xl">→</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* High-Scoring Quizzes Section (≥70%) */}
                <div className="mb-10">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span>✅</span> High-Scoring Quizzes (≥70%)
                        <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {highScoringAttempts.length} {highScoringAttempts.length === 1 ? 'attempt' : 'attempts'}
                        </span>
                    </h3>

                    {/* Day-wise grouping */}
                    {roadmap?.days?.map((day) => {
                        const dayAttempts = dayGroups[day.day_number] || [];
                        const hasPassed = dayAttempts.length > 0;

                        return (
                            <div key={day.day_number} className="mb-4">
                                <div className={`rounded-2xl border-2 overflow-hidden ${hasPassed ? "border-green-200 bg-white" : "border-gray-200 bg-gray-50"
                                    }`}>
                                    {/* Day Header */}
                                    <div className={`px-5 py-3 flex items-center justify-between ${hasPassed ? "bg-green-50" : "bg-gray-100"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${hasPassed ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                                                }`}>
                                                {day.day_number}
                                            </span>
                                            <div>
                                                <div className="font-bold text-gray-800">{day.title || `Day ${day.day_number}`}</div>
                                                <div className="text-xs text-gray-500">
                                                    {hasPassed ? `${dayAttempts.length} successful ${dayAttempts.length === 1 ? 'attempt' : 'attempts'}` : "No passing attempts"}
                                                </div>
                                            </div>
                                        </div>
                                        {hasPassed && (
                                            <span className="text-green-600 font-bold text-sm">✓ PASSED</span>
                                        )}
                                    </div>

                                    {/* Attempts List */}
                                    {dayAttempts.length > 0 && (
                                        <div className="divide-y divide-green-100">
                                            {dayAttempts.map((attempt) => (
                                                <div
                                                    key={attempt._id}
                                                    onClick={() => setSelectedQuiz(attempt)}
                                                    className="px-5 py-4 flex items-center gap-4 hover:bg-green-50 cursor-pointer transition"
                                                >
                                                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-200">
                                                        {attempt.score}%
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm text-gray-600">
                                                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                                        </div>
                                                        <div className="text-xs text-gray-400">{formatDate(attempt.submittedAt)}</div>
                                                    </div>
                                                    <span className="text-gray-400 hover:text-green-600 transition">View →</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {highScoringAttempts.length === 0 && (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                            <span className="text-4xl mb-4 block">📝</span>
                            <p className="text-gray-500">No high-scoring attempts yet. Keep practicing!</p>
                        </div>
                    )}
                </div>

                {/* Other Attempts Section (<70%) */}
                {otherAttempts.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span>📚</span> Other Attempts ({'<'}70%)
                            <span className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                {otherAttempts.length} {otherAttempts.length === 1 ? 'attempt' : 'attempts'}
                            </span>
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">Review these attempts to learn from your mistakes and improve your score.</p>

                        <div className="space-y-3">
                            {otherAttempts.map((attempt) => (
                                <div
                                    key={attempt._id}
                                    onClick={() => setSelectedQuiz(attempt)}
                                    className="bg-white rounded-xl border-2 border-red-200 p-4 flex items-center gap-4 hover:shadow-md cursor-pointer transition hover:border-red-300"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-red-200">
                                        {attempt.score}%
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-800">Day {attempt.dayNumber}</div>
                                        <div className="text-sm text-gray-500">
                                            {attempt.correctAnswers}/{attempt.totalQuestions} correct • {formatDate(attempt.submittedAt)}
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                        ✗ Failed
                                    </span>
                                    <span className="text-gray-400 hover:text-red-600 transition">Review →</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {assessments.length === 0 && (
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <span className="text-6xl mb-6 block">📝</span>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Quiz History Yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Start taking quizzes to track your progress and unlock Phase 3!
                        </p>
                        <button
                            onClick={() => navigate(`/roadmap/${roadmapId}/preview`)}
                            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-xl transition"
                        >
                            Start Learning
                        </button>
                    </div>
                )}
            </div>

            {/* Detailed Quiz View Modal */}
            {selectedQuiz && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    onClick={() => setSelectedQuiz(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`p-6 text-white ${selectedQuiz.passed ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-rose-600"}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Day {selectedQuiz.dayNumber} - Quiz Review</h2>
                                    <p className="text-white/80">{formatDate(selectedQuiz.submittedAt)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-black">{selectedQuiz.score}%</div>
                                    <div className="text-white/80">{selectedQuiz.passed ? "Passed" : "Failed"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {/* Stats Summary */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-green-600">{selectedQuiz.correctAnswers}</div>
                                    <div className="text-sm text-green-700">Correct</div>
                                </div>
                                <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {selectedQuiz.totalQuestions - selectedQuiz.correctAnswers}
                                    </div>
                                    <div className="text-sm text-red-700">Incorrect</div>
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-gray-600">{selectedQuiz.totalQuestions}</div>
                                    <div className="text-sm text-gray-700">Total</div>
                                </div>
                            </div>

                            {/* Question-by-Question Review */}
                            <h3 className="font-bold text-gray-800 mb-4">Question Review</h3>
                            <div className="space-y-6">
                                {selectedQuiz.answers?.map((answer, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-5 rounded-2xl border-2 ${answer.isCorrect
                                            ? "border-green-200 bg-green-50/50"
                                            : "border-red-200 bg-red-50/50"
                                            }`}
                                    >
                                        {/* Question Header */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${answer.isCorrect ? "bg-green-500" : "bg-red-500"
                                                }`}>
                                                Q{idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 text-lg">
                                                    {answer.questionText || `Question ${idx + 1}`}
                                                </p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${answer.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                    }`}>
                                                    {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* All Options Display */}
                                        <div className="space-y-2 ml-16">
                                            {answer.options && answer.options.length > 0 ? (
                                                answer.options.map((option, optIdx) => {
                                                    const isSelected = optIdx === answer.selectedAnswer;
                                                    const isCorrectOption = optIdx === answer.correctAnswer;
                                                    const wasWrong = isSelected && !answer.isCorrect;

                                                    let optionStyle = "bg-white border-gray-200";
                                                    let labelStyle = "bg-gray-100 text-gray-600";
                                                    let textStyle = "text-gray-700";

                                                    if (isCorrectOption) {
                                                        optionStyle = "bg-green-50 border-green-400 border-2";
                                                        labelStyle = "bg-green-500 text-white";
                                                        textStyle = "text-green-800 font-medium";
                                                    }
                                                    if (wasWrong) {
                                                        optionStyle = "bg-red-50 border-red-400 border-2";
                                                        labelStyle = "bg-red-500 text-white";
                                                        textStyle = "text-red-800";
                                                    }

                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border ${optionStyle} transition`}
                                                        >
                                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${labelStyle}`}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </span>
                                                            <span className={`flex-1 ${textStyle}`}>
                                                                {option}
                                                            </span>
                                                            {isSelected && (
                                                                <span className={`text-xs font-bold px-2 py-1 rounded ${answer.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                                                    }`}>
                                                                    Your Answer
                                                                </span>
                                                            )}
                                                            {isCorrectOption && !isSelected && (
                                                                <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-600">
                                                                    Correct
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                /* Fallback for old quiz data without options */
                                                <div className="space-y-2">
                                                    <div className={`flex items-center gap-2 p-3 rounded-xl border ${answer.isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                                                        }`}>
                                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white ${answer.isCorrect ? "bg-green-500" : "bg-red-500"
                                                            }`}>
                                                            {String.fromCharCode(65 + answer.selectedAnswer)}
                                                        </span>
                                                        <span className="font-medium">Your Answer</span>
                                                        {answer.isCorrect ? (
                                                            <span className="text-green-500 text-xl ml-auto">✓</span>
                                                        ) : (
                                                            <span className="text-red-500 text-xl ml-auto">✗</span>
                                                        )}
                                                    </div>
                                                    {!answer.isCorrect && (
                                                        <div className="flex items-center gap-2 p-3 rounded-xl border bg-green-50 border-green-300">
                                                            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white bg-green-500">
                                                                {String.fromCharCode(65 + answer.correctAnswer)}
                                                            </span>
                                                            <span className="font-medium text-green-700">Correct Answer</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Helpful Tips for Failed Quizzes */}
                            {!selectedQuiz.passed && (
                                <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-200">
                                    <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                        <span>💡</span> Tips to Improve
                                    </h4>
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        <li>• Review the day's learning materials again</li>
                                        <li>• Focus on topics where you made mistakes</li>
                                        <li>• Take notes while learning</li>
                                        <li>• You can retake the quiz anytime!</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t bg-gray-50 flex gap-4">
                            <button
                                onClick={() => setSelectedQuiz(null)}
                                className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                            {!selectedQuiz.passed && (
                                <button
                                    onClick={() => {
                                        setSelectedQuiz(null);
                                        navigate(`/roadmap/${roadmapId}/day/${selectedQuiz.dayNumber}/assessment`);
                                    }}
                                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                                >
                                    Retake Quiz
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapQuizHistoryPage;
