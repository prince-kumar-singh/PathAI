import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

interface Answer {
    questionIndex: number;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
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

interface Stats {
    totalQuizzes: number;
    passedQuizzes: number;
    failedQuizzes: number;
    averageScore: number;
    highestScore: number;
    passRate: number;
    domainStats: Record<string, { attempts: number; passed: number; totalScore: number }>;
}

type SortField = "date" | "score" | "day";
type SortOrder = "asc" | "desc";
type FilterType = "all" | "passed" | "failed";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AssessmentHistoryPage = () => {
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

    // Filtering & Sorting
    const [filter, setFilter] = useState<FilterType>("all");
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [searchDomain, setSearchDomain] = useState("");

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/assessments/history`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to load assessment history");
            }

            const data = await response.json();
            setAssessments(data.assessments || []);
            setStats(data.stats || null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered and sorted assessments
    const filteredAssessments = useMemo(() => {
        let result = [...assessments];

        // Apply filter
        if (filter === "passed") {
            result = result.filter((a) => a.passed);
        } else if (filter === "failed") {
            result = result.filter((a) => !a.passed);
        }

        // Apply domain search
        if (searchDomain) {
            result = result.filter((a) =>
                a.careerDomain?.toLowerCase().includes(searchDomain.toLowerCase())
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "date":
                    comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
                    break;
                case "score":
                    comparison = a.score - b.score;
                    break;
                case "day":
                    comparison = a.dayNumber - b.dayNumber;
                    break;
            }
            return sortOrder === "desc" ? -comparison : comparison;
        });

        return result;
    }, [assessments, filter, sortField, sortOrder, searchDomain]);

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
                    <p className="mt-6 text-lg font-medium text-gray-600">Loading your history...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-3xl font-black text-gray-800">Assessment History</h1>
                    <p className="text-gray-500 mt-1">Track your progress and learn from past attempts</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition">
                            <div className="text-3xl font-black text-blue-600">{stats.totalQuizzes}</div>
                            <div className="text-sm text-gray-500 font-medium">Total Quizzes</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition">
                            <div className="text-3xl font-black text-green-600">{stats.passedQuizzes}</div>
                            <div className="text-sm text-gray-500 font-medium">Passed</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition">
                            <div className="text-3xl font-black text-red-500">{stats.failedQuizzes}</div>
                            <div className="text-sm text-gray-500 font-medium">Failed</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition">
                            <div className="text-3xl font-black text-purple-600">{stats.averageScore}%</div>
                            <div className="text-sm text-gray-500 font-medium">Average</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition">
                            <div className="text-3xl font-black text-amber-500">{stats.highestScore}%</div>
                            <div className="text-sm text-gray-500 font-medium">Best Score</div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition">
                            <div className="text-3xl font-black text-teal-600">{stats.passRate}%</div>
                            <div className="text-sm text-gray-500 font-medium">Pass Rate</div>
                        </div>
                    </div>
                )}

                {/* Filters and Sorting */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            {(["all", "passed", "failed"] as FilterType[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl font-medium transition ${filter === f
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {f === "all" ? "All" : f === "passed" ? "✓ Passed" : "✗ Failed"}
                                </button>
                            ))}
                        </div>

                        {/* Sort Options */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-gray-500">Sort by:</span>
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as SortField)}
                                className="px-3 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="date">Date</option>
                                <option value="score">Score</option>
                                <option value="day">Day</option>
                            </select>
                            <button
                                onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                                className="px-3 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition"
                            >
                                {sortOrder === "desc" ? "↓" : "↑"}
                            </button>
                        </div>

                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search by domain..."
                            value={searchDomain}
                            onChange={(e) => setSearchDomain(e.target.value)}
                            className="px-4 py-2 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                    </div>
                </div>

                {/* Assessment List */}
                {filteredAssessments.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <span className="text-6xl mb-4 block">📝</span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Assessments Found</h3>
                        <p className="text-gray-500 mb-6">
                            {assessments.length === 0
                                ? "Take your first quiz to see your history here!"
                                : "No assessments match your current filters."}
                        </p>
                        {assessments.length === 0 && (
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                            >
                                Start Learning
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAssessments.map((assessment) => (
                            <div
                                key={assessment._id}
                                onClick={() => setSelectedAssessment(assessment)}
                                className={`bg-white rounded-2xl p-6 shadow-lg border-2 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01] ${assessment.passed ? "border-green-200 hover:border-green-400" : "border-red-200 hover:border-red-400"
                                    }`}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Score Circle */}
                                    <div
                                        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${assessment.passed
                                                ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                                                : "bg-gradient-to-br from-red-400 to-red-600 text-white"
                                            }`}
                                    >
                                        {assessment.score}%
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                                Day {assessment.dayNumber}
                                            </span>
                                            <span className="text-gray-400 text-sm">•</span>
                                            <span className="text-gray-500 text-sm">{formatDomain(assessment.careerDomain)}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>
                                                {assessment.correctAnswers}/{assessment.totalQuestions} correct
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span>{formatDate(assessment.submittedAt)}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div
                                        className={`px-4 py-2 rounded-xl font-bold ${assessment.passed
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {assessment.passed ? "✓ PASSED" : "✗ FAILED"}
                                    </div>

                                    {/* View Button */}
                                    <button className="text-gray-400 hover:text-blue-600 transition">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedAssessment && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedAssessment(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            className={`p-6 rounded-t-3xl ${selectedAssessment.passed
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                    : "bg-gradient-to-r from-red-500 to-rose-600"
                                } text-white`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Day {selectedAssessment.dayNumber} Review</h2>
                                    <p className="text-white/80">{formatDomain(selectedAssessment.careerDomain)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black">{selectedAssessment.score}%</div>
                                    <div className="text-white/80">{selectedAssessment.passed ? "Passed" : "Failed"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {/* Stats */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{selectedAssessment.correctAnswers}</div>
                                    <div className="text-sm text-gray-500">Correct</div>
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-red-500">
                                        {selectedAssessment.totalQuestions - selectedAssessment.correctAnswers}
                                    </div>
                                    <div className="text-sm text-gray-500">Incorrect</div>
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-600">{selectedAssessment.totalQuestions}</div>
                                    <div className="text-sm text-gray-500">Total</div>
                                </div>
                            </div>

                            {/* Answers Review */}
                            <h3 className="font-bold text-gray-800 mb-4">Question Review</h3>
                            <div className="space-y-3">
                                {selectedAssessment.answers?.map((answer, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-xl border-2 ${answer.isCorrect
                                                ? "border-green-200 bg-green-50"
                                                : "border-red-200 bg-red-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${answer.isCorrect
                                                        ? "bg-green-500 text-white"
                                                        : "bg-red-500 text-white"
                                                    }`}
                                            >
                                                Q{idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className={answer.isCorrect ? "text-green-700" : "text-red-700"}>
                                                        Your answer: Option {String.fromCharCode(65 + answer.selectedAnswer)}
                                                    </span>
                                                    {!answer.isCorrect && (
                                                        <>
                                                            <span className="text-gray-400">•</span>
                                                            <span className="text-green-600 font-medium">
                                                                Correct: Option {String.fromCharCode(65 + answer.correctAnswer)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-2xl">{answer.isCorrect ? "✅" : "❌"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Date */}
                            <div className="mt-6 text-center text-gray-500 text-sm">
                                Taken on {formatDate(selectedAssessment.submittedAt)}
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedAssessment(null)}
                                className="w-full mt-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentHistoryPage;
