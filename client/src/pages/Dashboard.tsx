import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "./homepage/Navbar";

interface Scores {
    fullname: string;
    bigFive: Record<string, number> | null;
    riasec: Record<string, number> | null;
    careerPrediction: any | null;
}

const Dashboard: React.FC = () => {
    const [data, setData] = useState<Scores | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/user-scores", {
                    credentials: "include",
                });

                if (res.status === 401) {
                    alert("Please login to view dashboard");
                    navigate("/login");
                    return;
                }

                const result = await res.json();
                console.log(result);
                setData(result);
            } catch (error) {
                console.error("Error fetching scores:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [navigate]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e3f2fd] via-[#eefdf3] to-[#e7edff] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 font-sans transition-colors duration-500">
            <Navbar />

            <div className="container mx-auto px-4 py-8 mt-20 animate-fadeIn">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-sm mb-2">
                        {getGreeting()}, {data?.fullname || "User"} 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                        Here is your personal assessment dashboard
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto perspective-1000">
                    {/* RIASEC Card */}
                    <div
                        className="relative overflow-hidden rounded-3xl p-8 
            bg-gradient-to-br from-white via-blue-50 to-blue-100
            dark:from-gray-800 dark:via-gray-800 dark:to-blue-900/20
            border-2 border-blue-200/50 dark:border-blue-700/30
            shadow-[0_10px_40px_-10px_rgba(37,99,235,0.3)]
            hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.5)]
            hover:-translate-y-2 hover:scale-[1.02]
            transition-all duration-500 ease-out
            animate-scaleUp group"
                        style={{ animationDelay: "0.1s" }}
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-all duration-500"></div>

                        <div className="relative z-10 flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 drop-shadow-sm">
                                    RIASEC
                                </h2>
                                <p className="text-sm font-bold text-blue-500/80 dark:text-blue-400/80 tracking-wider uppercase mt-2">
                                    Career Interest Profile
                                </p>
                            </div>
                            <div className="text-4xl">🧩</div>
                        </div>

                        {data?.riasec && Object.keys(data.riasec).length > 0 ? (
                            <div className="relative z-10 space-y-6">
                                {Object.entries(data.riasec).map(([trait, score], index) => (
                                    <div key={trait} className="relative">
                                        <div className="flex justify-between mb-2 items-end">
                                            <span className="text-lg font-bold text-gray-700 dark:text-gray-200 capitalize">
                                                {trait}
                                            </span>
                                            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                                                {score}
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/50 dark:bg-gray-700/50 rounded-full h-4 shadow-inner border border-blue-100 dark:border-gray-600">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 h-full rounded-full shadow-[0_2px_10px_rgba(59,130,246,0.4)] relative overflow-hidden"
                                                style={{
                                                    width: `${score * 100}%`,
                                                    transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    transitionDelay: `${index * 100}ms`
                                                }}
                                            >
                                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6 flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate("/riasec-results", { state: { scores: data.riasec } })}
                                        className="w-full px-6 py-3 text-lg font-bold text-white rounded-xl 
                                                bg-gradient-to-r from-blue-600 to-cyan-500 
                                                shadow-[0_4px_14px_rgba(37,99,235,0.4)]
                                                hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)]
                                                hover:-translate-y-1 transition-all"
                                    >
                                        View Full Results
                                    </button>

                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("mcq_progress_RIASEC");
                                            navigate("/riasec-test");
                                        }}
                                        className="w-full px-6 py-2 text-sm font-bold text-blue-600 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-200/80 dark:hover:bg-blue-800/50 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>↺</span> Retake Test
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-6">
                                    Discover your ideal career path today.
                                </p>
                                <button
                                    onClick={() => navigate("/riasec-test")}
                                    className="px-8 py-4 text-lg font-bold rounded-2xl 
                  bg-gradient-to-r from-blue-600 to-cyan-500 text-white 
                  shadow-[0_10px_20px_rgba(37,99,235,0.4)] 
                  hover:shadow-[0_15px_30px_rgba(37,99,235,0.6)] 
                  hover:scale-105 hover:-translate-y-1
                  transition-all duration-300 active:scale-95"
                                >
                                    Start Assessment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Big Five Card */}
                    <div
                        className="relative overflow-hidden rounded-3xl p-8 
            bg-gradient-to-br from-white via-green-50 to-green-100
            dark:from-gray-800 dark:via-gray-800 dark:to-green-900/20
            border-2 border-green-200/50 dark:border-green-700/30
            shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]
            hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)]
            hover:-translate-y-2 hover:scale-[1.02]
            transition-all duration-500 ease-out
            animate-scaleUp group"
                        style={{ animationDelay: "0.2s" }}
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-400/20 rounded-full blur-3xl group-hover:bg-green-400/30 transition-all duration-500"></div>

                        <div className="relative z-10 flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 drop-shadow-sm">
                                    Big Five
                                </h2>
                                <p className="text-sm font-bold text-green-600/80 dark:text-green-400/80 tracking-wider uppercase mt-2">
                                    Personality Traits
                                </p>
                            </div>
                            <div className="text-4xl">🧠</div>
                        </div>

                        {data?.bigFive && Object.keys(data.bigFive).length > 0 ? (
                            <div className="relative z-10 space-y-6">
                                {Object.entries(data.bigFive).map(([trait, score], index) => (
                                    <div key={trait} className="relative">
                                        <div className="flex justify-between mb-2 items-end">
                                            <span className="text-lg font-bold text-gray-700 dark:text-gray-200 capitalize">
                                                {trait}
                                            </span>
                                            <span className="text-lg font-black text-green-600 dark:text-green-400">
                                                {score}
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/50 dark:bg-gray-700/50 rounded-full h-4 shadow-inner border border-green-100 dark:border-gray-600">
                                            <div
                                                className="bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400 h-full rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.4)] relative overflow-hidden"
                                                style={{
                                                    width: `${score * 100}%`,
                                                    transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    transitionDelay: `${index * 100}ms`
                                                }}
                                            >
                                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6 flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate("/big-five-results", { state: { scores: data.bigFive } })}
                                        className="w-full px-6 py-3 text-lg font-bold text-white rounded-xl 
                                                bg-gradient-to-r from-green-600 to-emerald-500 
                                                shadow-[0_4px_14px_rgba(16,185,129,0.4)]
                                                hover:shadow-[0_6px_20px_rgba(16,185,129,0.6)]
                                                hover:-translate-y-1 transition-all"
                                    >
                                        View Full Results
                                    </button>

                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("mcq_progress_BIG_FIVE");
                                            navigate("/big-five-test");
                                        }}
                                        className="w-full px-6 py-2 text-sm font-bold text-green-600 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30 hover:bg-green-200/80 dark:hover:bg-green-800/50 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>↺</span> Retake Test
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-6">
                                    Understand your personality better.
                                </p>
                                <button
                                    onClick={() => navigate("/big-five-test")}
                                    className="px-8 py-4 text-lg font-bold rounded-2xl 
                  bg-gradient-to-r from-green-600 to-emerald-500 text-white 
                  shadow-[0_10px_20px_rgba(16,185,129,0.4)] 
                  hover:shadow-[0_15px_30px_rgba(16,185,129,0.6)] 
                  hover:scale-105 hover:-translate-y-1
                  transition-all duration-300 active:scale-95"
                                >
                                    Start Assessment
                                </button>
                            </div>
                        )}
                    </div>



                    {/* Reading Comprehension Card */}
                    <div
                        className="relative overflow-hidden rounded-3xl p-8 
                bg-gradient-to-br from-white via-purple-50 to-purple-100
                dark:from-gray-800 dark:via-gray-800 dark:to-purple-900/20
                border-2 border-purple-200/50 dark:border-purple-700/30
                shadow-[0_10px_40px_-10px_rgba(147,51,234,0.3)]
                hover:shadow-[0_20px_60px_-15px_rgba(147,51,234,0.5)]
                hover:-translate-y-2 hover:scale-[1.02]
                transition-all duration-500 ease-out
                animate-scaleUp group"
                        style={{ animationDelay: "0.3s" }}
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-all duration-500"></div>

                        <div className="relative z-10 flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-sm">
                                    Reading
                                </h2>
                                <p className="text-sm font-bold text-purple-600/80 dark:text-purple-400/80 tracking-wider uppercase mt-2">
                                    Cognitive Assessment
                                </p>
                            </div>
                            <div className="text-4xl">📚</div>
                        </div>

                        {data?.careerPrediction ? (
                            <div className="relative z-10 space-y-6">
                                <div className="bg-white/60 dark:bg-gray-700/60 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/50">
                                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Recommended Career</p>
                                    <p className="text-xl font-black text-gray-800 dark:text-gray-100 leading-tight">
                                        {data.careerPrediction.recommended_career}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate("/reading-comprehension-test", { state: { result: data.careerPrediction } })}
                                        className="w-full px-6 py-3 text-lg font-bold text-white rounded-xl 
                                                bg-gradient-to-r from-purple-600 to-pink-500 
                                                shadow-[0_4px_14px_rgba(147,51,234,0.4)]
                                                hover:shadow-[0_6px_20px_rgba(147,51,234,0.6)]
                                                hover:-translate-y-1 transition-all"
                                    >
                                        View Full Report
                                    </button>

                                    <button
                                        onClick={() => navigate("/reading-comprehension-test")}
                                        className="w-full px-6 py-2 text-sm font-bold text-purple-600 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-900/30 hover:bg-purple-200/80 dark:hover:bg-purple-800/50 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>↺</span> Retake Assessment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10 text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-6">
                                    Analyze your cognitive processing style.
                                </p>
                                <button
                                    onClick={() => navigate("/reading-comprehension-test")}
                                    className="px-8 py-4 text-lg font-bold rounded-2xl 
                      bg-gradient-to-r from-purple-600 to-pink-500 text-white 
                      shadow-[0_10px_20px_rgba(147,51,234,0.4)] 
                      hover:shadow-[0_15px_30px_rgba(147,51,234,0.6)] 
                      hover:scale-105 hover:-translate-y-1
                      transition-all duration-300 active:scale-95"
                                >
                                    Start Assessment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Phase 2 CTA - Show only when all Phase 1 tests complete */}
                    {data?.careerPrediction && data?.bigFive && data?.riasec && (
                        <div className="md:col-span-2 mt-6 relative overflow-hidden rounded-3xl p-8 
                            bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white
                            shadow-[0_20px_60px_-15px_rgba(99,102,241,0.5)]
                            hover:shadow-[0_25px_70px_-15px_rgba(99,102,241,0.7)]
                            transition-all duration-500 ease-out
                            group">

                            {/* Decorative Background Elements */}
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                                        <span className="text-4xl">🚀</span>
                                        <h2 className="text-3xl md:text-4xl font-black">
                                            Ready for Phase 2?
                                        </h2>
                                    </div>
                                    <p className="text-white/90 text-lg md:text-xl mb-2">
                                        Start your personalized 10-day learning roadmap for
                                    </p>
                                    <p className="text-2xl md:text-3xl font-bold text-yellow-300">
                                        {data.careerPrediction.recommended_career}
                                    </p>
                                    <p className="text-white/80 text-sm mt-2">
                                        ✓ AI-generated daily tasks  ✓ Video tutorials  ✓ Hands-on projects
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate('/onboarding')}
                                        className="px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl 
                                            hover:scale-105 hover:shadow-2xl
                                            transition-all duration-300 active:scale-95
                                            flex items-center gap-2">
                                        <span>Start Learning Path</span>
                                        <span className="text-2xl">→</span>
                                    </button>
                                    <p className="text-white/70 text-xs text-center">
                                        Takes 2 minutes to set up
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
