import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Phase1Data {
    recommended_career: string;
    alternative_careers?: string[];
    confidence?: number;
    phase1_complete: boolean;
    domain: string;
}

interface OnboardingPreferences {
    learning_style: string;
    pacing_preference: string;
    time_availability: number;
}

const OnboardingFlow: React.FC = () => {
    const navigate = useNavigate();
    const [phase1Data, setPhase1Data] = useState<Phase1Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [generating, setGenerating] = useState(false);

    const [preferences, setPreferences] = useState<OnboardingPreferences>({
        learning_style: '',
        pacing_preference: '',
        time_availability: 5
    });

    const questions = [
        {
            id: 'learning_style',
            question: "What's your preferred learning style?",
            icon: '🎨',
            options: [
                { value: 'visual', label: 'Visual', description: 'Videos, diagrams, infographics' },
                { value: 'reading', label: 'Reading', description: 'Articles, documentation, books' },
                { value: 'hands_on', label: 'Hands-On', description: 'Coding exercises, projects' },
                { value: 'mixed', label: 'Mixed', description: 'Combination of all above' }
            ]
        },
        {
            id: 'pacing_preference',
            question: "How much time can you dedicate daily?",
            icon: '⏱️',
            options: [
                { value: 'intensive', label: 'Intensive', description: '3+ hours/day (Fast track)' },
                { value: 'standard', label: 'Standard', description: '1.5 hours/day (Recommended)' },
                { value: 'leisurely', label: 'Leisurely', description: '45 min/day (Flexible)' }
            ]
        },
        {
            id: 'time_availability',
            question: "How many days per week can you commit?",
            icon: '📅',
            options: [
                { value: 7, label: '7 days/week', description: 'Full commitment' },
                { value: 5, label: '5 days/week', description: 'Weekdays only' },
                { value: 3, label: '3 days/week', description: 'Part-time learning' }
            ]
        }
    ];

    useEffect(() => {
        fetchPhase1Data();
    }, []);

    const fetchPhase1Data = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/user-scores', {
                credentials: 'include'
            });

            if (res.status === 401) {
                alert('Please login first');
                navigate('/login');
                return;
            }

            const data = await res.json();

            // Check if Phase 1 is complete
            if (!data.careerPrediction || !data.bigFive || !data.riasec) {
                alert('⚠️ Please complete all Phase 1 assessments first!\n\n' +
                    'Required:\n' +
                    '✓ Big Five Test\n' +
                    '✓ RIASEC Test\n' +
                    '✓ Reading Comprehension Test');
                navigate('/dashboard');
                return;
            }

            // Get Phase 1 summary
            const summaryRes = await fetch('http://localhost:8000/api/v1/roadmaps/phase1/summary', {
                credentials: 'include'
            });

            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                setPhase1Data(summary);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching Phase 1 data:', error);
            alert('Error loading data. Please try again.');
            navigate('/dashboard');
        }
    };

    const handleOptionClick = (questionId: string, value: any) => {
        setPreferences(prev => ({
            ...prev,
            [questionId]: value
        }));

        // Auto-advance to next question after 300ms
        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            }
        }, 300);
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleGenerateRoadmap = async () => {
        // Validate all preferences filled
        const allFilled = Object.values(preferences).every(val => val !== '' && val !== 0);

        if (!allFilled) {
            alert('Please answer all questions before generating your roadmap');
            return;
        }

        setGenerating(true);

        try {
            const res = await fetch('http://localhost:8000/api/v1/roadmaps/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(preferences)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to generate roadmap');
            }

            const data = await res.json();

            // Navigate to roadmap preview
            navigate(`/roadmap/${data.roadmap.roadmap_id}/preview`, {
                state: { roadmap: data.roadmap }
            });

        } catch (error) {
            console.error('Error generating roadmap:', error);
            alert('Failed to generate roadmap. Please try again.');
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestion === questions.length - 1;
    const currentValue = preferences[currentQ.id as keyof OnboardingPreferences];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-800">Phase 2 Onboarding</h1>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-600 hover:text-gray-800 font-medium"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-4xl">
                {/* Phase 1 Career Display */}
                {phase1Data && (
                    <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">🎯</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-indigo-100 mb-1">
                                    Your Recommended Career Path (from Phase 1)
                                </p>
                                <h2 className="text-3xl font-bold mb-2">
                                    {phase1Data.recommended_career}
                                </h2>
                                {phase1Data.confidence && (
                                    <p className="text-indigo-100 text-sm">
                                        Confidence: {Math.round(phase1Data.confidence * 100)}%
                                    </p>
                                )}
                            </div>
                            <div className="text-6xl">✅</div>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                            Question {currentQuestion + 1} of {questions.length}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                            {Math.round(progress)}% Complete
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">{currentQ.icon}</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {currentQ.question}
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="grid gap-4">
                        {currentQ.options.map((option) => {
                            const isSelected = currentValue === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleOptionClick(currentQ.id, option.value)}
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

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentQuestion === 0}
                        className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        ← Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleGenerateRoadmap}
                            disabled={generating || !currentValue}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    Generating Roadmap...
                                </>
                            ) : (
                                <>
                                    Generate My Roadmap 🚀
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            disabled={!currentValue}
                            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingFlow;
