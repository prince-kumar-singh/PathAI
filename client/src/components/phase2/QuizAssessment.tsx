import { useState, useEffect, useRef } from "react";

interface QuizQuestion {
    index: number;
    question: string;
    options: string[];
    topic: string;
}

interface QuizData {
    career_domain: string;
    day_number: number;
    day_title: string;
    total_questions: number;
    questions: QuizQuestion[];
}

interface QuizResult {
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    passThreshold: number;
    feedback: string;
    answers: {
        questionIndex: number;
        isCorrect: boolean;
        correctAnswer: number;
        yourAnswer: number;
    }[];
}

interface QuizAssessmentProps {
    roadmapId: string;
    dayNumber: number;
    onComplete: (passed: boolean, score: number) => void;
    onCancel: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Confetti-like celebration animation component
const Celebration = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {[...Array(50)].map((_, i) => (
            <div
                key={i}
                className="absolute animate-confetti"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                }}
            >
                <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                        backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'][
                            Math.floor(Math.random() * 6)
                        ],
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            </div>
        ))}
        <style>{`
      @keyframes confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      .animate-confetti {
        animation: confetti linear forwards;
      }
    `}</style>
    </div>
);

// Animated counter component
const AnimatedScore = ({ value, duration = 1500 }: { value: number; duration?: number }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const start = 0;
        const increment = value / (duration / 16);
        let currentValue = start;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= value) {
                setCurrent(value);
                clearInterval(timer);
            } else {
                setCurrent(Math.floor(currentValue));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{current}</span>;
};

const QuizAssessment = ({
    roadmapId,
    dayNumber,
    onComplete,
    onCancel,
}: QuizAssessmentProps) => {
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Ref to prevent double-fetch in React Strict Mode or re-renders
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        // Only fetch if we haven't already fetched for this roadmap/day combination
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchQuiz();
        }
    }, [roadmapId, dayNumber]);

    const fetchQuiz = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/assessments/roadmaps/${roadmapId}/days/${dayNumber}/quiz`,
                { credentials: "include" }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to load quiz");
            }

            const data = await response.json();
            setQuiz(data.quiz);
            setSelectedAnswers(new Array(data.quiz.total_questions).fill(-1));
        } catch (err: any) {
            setError(err.message || "Failed to load quiz");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnswer = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = optionIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < (quiz?.total_questions ?? 0) - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentQuestion((prev) => prev + 1);
                setIsTransitioning(false);
            }, 150);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentQuestion((prev) => prev - 1);
                setIsTransitioning(false);
            }, 150);
        }
    };

    const handleSubmit = async () => {
        const unanswered = selectedAnswers.filter((a) => a === -1).length;
        if (unanswered > 0) {
            setError(`Please answer all questions. ${unanswered} remaining.`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/assessments/roadmaps/${roadmapId}/days/${dayNumber}/quiz/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ answers: selectedAnswers }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit quiz");
            }

            const data = await response.json();
            setResult(data.result);

            // Show celebration if passed
            if (data.result.passed) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 4000);
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit quiz");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Premium Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
                    {/* Spinning ring */}
                    <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
                    {/* Inner pulse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-8 mb-2">Preparing Your Quiz</h3>
                <p className="text-gray-500 text-center max-w-md">
                    Our AI is generating personalized questions based on Day {dayNumber} topics...
                </p>
                <div className="flex gap-1 mt-6">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Error State
    if (error && !quiz) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">😕</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Something Went Wrong</h3>
                <p className="text-red-500 mb-6 text-center max-w-md">{error}</p>
                <div className="flex gap-4">
                    <button
                        onClick={fetchQuiz}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all transform hover:scale-105"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Result State
    if (result) {
        return (
            <>
                {showCelebration && <Celebration />}
                <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto animate-fadeIn">
                    {/* Score Circle with Animation */}
                    <div className="relative mb-8">
                        {/* Background glow */}
                        <div
                            className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${result.passed ? "bg-green-400" : "bg-red-400"
                                }`}
                        />
                        {/* Score ring */}
                        <div
                            className={`relative w-40 h-40 rounded-full flex items-center justify-center ${result.passed
                                ? "bg-gradient-to-br from-green-400 to-emerald-600"
                                : "bg-gradient-to-br from-red-400 to-rose-600"
                                } shadow-2xl`}
                        >
                            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className={`text-5xl font-black ${result.passed ? "text-green-600" : "text-red-600"}`}>
                                        <AnimatedScore value={result.score} />
                                        <span className="text-2xl">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Message */}
                    <div className={`text-center mb-8 ${result.passed ? "animate-bounce-slow" : ""}`}>
                        <h2 className={`text-3xl font-black mb-2 ${result.passed ? "text-green-600" : "text-red-600"}`}>
                            {result.passed ? "🎉 Congratulations!" : "📚 Keep Learning!"}
                        </h2>
                        <p className="text-gray-600 text-lg max-w-md">{result.feedback}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center transform hover:scale-105 transition">
                            <div className="text-3xl font-black text-blue-600">{result.correctAnswers}</div>
                            <div className="text-sm text-blue-700 font-medium">Correct</div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center transform hover:scale-105 transition">
                            <div className="text-3xl font-black text-gray-600">{result.totalQuestions}</div>
                            <div className="text-sm text-gray-700 font-medium">Total</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center transform hover:scale-105 transition">
                            <div className="text-3xl font-black text-purple-600">{result.passThreshold}%</div>
                            <div className="text-sm text-purple-700 font-medium">Required</div>
                        </div>
                    </div>

                    {/* Answer Summary */}
                    <div className="w-full bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📊</span> Question Summary
                        </h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {result.answers.map((a, i) => (
                                <div
                                    key={i}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transform hover:scale-110 transition cursor-default ${a.isCorrect
                                        ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-200"
                                        : "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-200"
                                        }`}
                                    title={a.isCorrect ? "Correct!" : `Incorrect - The answer was option ${a.correctAnswer + 1}`}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        {result.passed ? (
                            <button
                                onClick={() => onComplete(true, result.score)}
                                className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-green-300 transition-all transform hover:scale-105 flex items-center gap-3"
                            >
                                <span>Continue to Next Day</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setSelectedAnswers(new Array(quiz?.total_questions ?? 5).fill(-1));
                                        setCurrentQuestion(0);
                                        fetchQuiz();
                                    }}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-300 transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    <span>🔄</span>
                                    <span>Try Again</span>
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                                >
                                    Review Material
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
        `}</style>
            </>
        );
    }

    // Quiz State
    if (!quiz) return null;

    const currentQ = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.total_questions) * 100;
    const isLastQuestion = currentQuestion === quiz.total_questions - 1;
    const canSubmit = selectedAnswers.every((a) => a !== -1);

    return (
        <div className="flex flex-col p-6 max-w-3xl mx-auto">
            {/* Header with Day Badge */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold mb-3 shadow-lg">
                    <span>📝</span>
                    <span>Day {dayNumber} Assessment</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{quiz.day_title}</h2>
            </div>

            {/* Progress Bar - Premium Style */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                        Question {currentQuestion + 1} of {quiz.total_questions}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
                {/* Question dots */}
                <div className="flex justify-center gap-2 mt-4">
                    {quiz.questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setIsTransitioning(true);
                                setTimeout(() => {
                                    setCurrentQuestion(idx);
                                    setIsTransitioning(false);
                                }, 150);
                            }}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentQuestion
                                ? "w-8 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                                : selectedAnswers[idx] !== -1
                                    ? "bg-green-500"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Question Card with Animation */}
            <div
                className={`bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8 transition-all duration-300 ${isTransitioning ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
                    }`}
            >
                {/* Topic Badge */}
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-bold">
                        {currentQ.topic}
                    </span>
                </div>

                {/* Question */}
                <h3 className="text-xl font-bold text-gray-800 mb-8 leading-relaxed">
                    {currentQ.question}
                </h3>

                {/* Options - Premium Style */}
                <div className="space-y-4">
                    {currentQ.options.map((option, idx) => {
                        const isSelected = selectedAnswers[currentQuestion] === idx;
                        const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D

                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectAnswer(idx)}
                                className={`w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${isSelected
                                    ? "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg shadow-blue-100"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-4 transition-all ${isSelected
                                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {optionLetter}
                                </div>
                                <span className={`text-left flex-1 ${isSelected ? "text-gray-800 font-medium" : "text-gray-700"}`}>
                                    {option}
                                </span>
                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 animate-shake">
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className={`px-6 py-4 rounded-2xl font-semibold transition-all flex items-center gap-2 ${currentQuestion === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-lg transform hover:scale-105"
                        }`}
                >
                    <span>←</span>
                    <span>Previous</span>
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${canSubmit && !isSubmitting
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-2xl hover:shadow-green-200 transform hover:scale-105"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Grading...</span>
                            </>
                        ) : (
                            <>
                                <span>Submit Quiz</span>
                                <span>✓</span>
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQuestion] === -1}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${selectedAnswers[currentQuestion] !== -1
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-2xl hover:shadow-blue-200 transform hover:scale-105"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        <span>Next</span>
                        <span>→</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizAssessment;
