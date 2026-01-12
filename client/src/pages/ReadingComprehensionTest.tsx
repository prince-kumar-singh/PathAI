import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { readingData } from "../data/readingComprehensionData";

const ReadingComprehensionTest: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [finished, setFinished] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.result) {
            setResult(location.state.result);
            setFinished(true);
        }
    }, [location.state]);

    // Define interfaces for the data structure
    interface SliderItem { id: string; text: string; }
    interface McqItem { id: string; question: string; options: string[]; }

    // Combine all questions into a linear flow or keep them per section?
    // The data structure has "groups". Let's show one group at a time.
    const groups = readingData.questions;
    const currentGroup = groups[currentStep];

    const handleSliderChange = (id: string, value: number) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    };

    const handleMcqChange = (id: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    };

    const handleTextChange = (id: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    };

    const isStepComplete = () => {
        if (currentGroup.type === "slider_group") {
            return currentGroup.items?.every(item => answers[item.id]);
        }
        if (currentGroup.type === "mcq_group") {
            return currentGroup.items?.every(item => answers[item.id]);
        }
        if (currentGroup.type === "open_ended") {
            return answers["freeText"] && answers["freeText"].length > 10; // Basic validation
        }
        return false;
    };

    const handleNext = () => {
        if (currentStep < groups.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            finishTest();
        }
    };

    const finishTest = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/predict-career", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(answers),
            });


            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to get prediction");
                setLoading(false);
                return;
            }

            const data = await res.json();
            setResult(data);
            setFinished(true);
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <h2 className="text-2xl font-bold text-blue-800 animate-pulse">Analyzing your profile...</h2>
                <p className="text-gray-500 mt-2">Connecting Personality, Interests, and Cognitive Style models.</p>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-fadeIn">
                <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:max-w-none">

                    {/* Header for Print/View */}
                    <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-black">AI</div>
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black uppercase tracking-wider mb-2">Career Insight Report</h1>
                            <p className="text-blue-200 font-medium text-lg">Comprehensive Analysis & Recommendation</p>
                        </div>
                    </div>

                    <div className="p-10">
                        {/* Top Section: Recommendation */}
                        <div className="flex flex-col md:flex-row gap-8 mb-12 border-b border-gray-100 pb-10">
                            <div className="md:w-1/2">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Top Recommendation</h3>
                                <div className="text-5xl font-black text-gray-900 mb-4 leading-tight">
                                    {result.recommended_career}
                                </div>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    Our models verify that this career path aligns exceptionally well with your combined personality traits and cognitive processing patterns.
                                </p>
                            </div>
                            <div className="md:w-1/2 bg-blue-50 rounded-2xl p-8 border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4">Match Confidence</h3>
                                <div className="space-y-4">
                                    {Object.entries(result.all_jobs_confidences || {}).slice(0, 4).map(([job, score]: any) => (
                                        <div key={job}>
                                            <div className="flex justify-between text-sm font-bold mb-1">
                                                <span className="text-gray-700">{job}</span>
                                                <span className="text-blue-600">{(score * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2.5 bg-blue-200/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${score * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Analysis Breakdown */}
                        <div className="grid md:grid-cols-2 gap-10 mb-12">
                            {/* Personality Model Breakdown */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">P</span>
                                    Personality Alignment
                                </h3>
                                <div className="space-y-3">
                                    {result.breakdown?.personality_model && Object.entries(result.breakdown.personality_model).map(([trait, val]: any) => (
                                        <div key={trait} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="text-gray-600 font-medium capitalize">{trait.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-gray-900">{(val * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                    {!result.breakdown?.personality_model && <div className="text-gray-400 italic">No detailed breakdown available.</div>}
                                </div>
                            </div>

                            {/* Cognitive Model Breakdown */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">C</span>
                                    Cognitive & Reading Profile
                                </h3>
                                <div className="space-y-3">
                                    {result.breakdown?.reading_model && Object.entries(result.breakdown.reading_model).map(([factor, val]: any) => (
                                        <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="text-gray-600 font-medium capitalize">{factor.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-gray-900">{(val * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                    {!result.breakdown?.reading_model && <div className="text-gray-400 italic">No detailed breakdown available.</div>}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 print:hidden">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Generate 10 DAY Roadmap
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:translate-y-0"
                            >
                                Download / Print Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e3f2fd] via-[#fff] to-[#e7edff] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-500 flex flex-col md:flex-row">

            {/* LEFT PANEL: PASSAGE */}
            <div className="w-full md:w-1/2 p-6 md:p-10 md:h-screen md:overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mb-6 text-sm text-gray-500 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                    <span>←</span> Back to Dashboard
                </button>

                <div className="prose dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-6">
                        {readingData.passage.title}
                    </h1>
                    <div className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-medium font-serif">
                        {readingData.passage.text}
                    </div>
                </div>

                <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                    <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-2">Instructions</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Read the passage carefully. You will be asked questions about your preferences and instincts based on this scenario.
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL: QUESTIONS */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center min-h-screen md:min-h-0 md:h-screen md:overflow-y-auto">
                <div className="max-w-xl mx-auto w-full">

                    <div className="mb-8">
                        <span className="text-xs font-bold tracking-widest text-blue-500 uppercase">Step {currentStep + 1} of {groups.length}</span>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-2">{currentGroup.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{currentGroup.instruction}</p>
                    </div>

                    <div className="space-y-8 animate-fadeIn">
                        {/* RENDER SLIDER GROUP */}
                        {currentGroup.type === "slider_group" && (currentGroup.items as SliderItem[])?.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-800 dark:text-gray-200 font-semibold mb-6">{item.text}</p>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                                        <span>Disagree</span>
                                        <span>Agree</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => handleSliderChange(item.id, val)}
                                                className={`w-12 h-12 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center
                                            ${answers[item.id] === val
                                                        ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                    }`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* RENDER MCQ GROUP */}
                        {currentGroup.type === "mcq_group" && (currentGroup.items as McqItem[])?.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-800 dark:text-gray-200 font-semibold mb-4">{item.question}</p>
                                <div className="flex flex-col gap-3">
                                    {item.options?.map((opt) => (
                                        <label
                                            key={opt}
                                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
                                        ${answers[item.id] === opt
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                        ${answers[item.id] === opt ? "border-blue-600" : "border-gray-400"}`}>
                                                {answers[item.id] === opt && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                            </div>
                                            <input
                                                type="radio"
                                                name={item.id}
                                                value={opt}
                                                checked={answers[item.id] === opt}
                                                onChange={() => handleMcqChange(item.id, opt)}
                                                className="hidden"
                                            />
                                            <span className={`text-sm ${answers[item.id] === opt ? "text-blue-800 dark:text-blue-300 font-medium" : "text-gray-600 dark:text-gray-300"}`}>
                                                {opt}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* RENDER OPEN ENDED */}
                        {currentGroup.type === "open_ended" && (
                            <div className="bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <textarea
                                    className="w-full p-6 h-64 rounded-xl bg-transparent focus:outline-none resize-none text-gray-700 dark:text-gray-200 text-lg leading-relaxed placeholder-gray-300 dark:placeholder-gray-600"
                                    placeholder={currentGroup.placeholder}
                                    value={answers["freeText"] || ""}
                                    onChange={(e) => handleTextChange("freeText", e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between mt-10">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`px-6 py-3 rounded-xl font-bold transition-colors
                        ${currentStep === 0
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                }`}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!isStepComplete()}
                            className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-300
                        ${!isStepComplete()
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30 hover:-translate-y-1"
                                }`}
                        >
                            {currentStep === groups.length - 1 ? "Finish Assessment" : "Next Step →"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReadingComprehensionTest;
