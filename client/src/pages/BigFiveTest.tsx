import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MCQEngine from "../components/MCQEngine";
import bigFiveQuestions from "../data/question";
import BigFiveResult from "../components/BigFiveResult";
import type { Answer } from "../types/mcq";

const BigFiveTest: React.FC = () => {
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get API base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const handleFinish = async (answers: Answer[]) => {
    try {
      setLoading(true);
      setError(null);

      // 🔹 Build responses object
      const responses: Record<string, number> = {};
      answers.forEach((a) => (responses[a.id] = a.answer));

      // 🔹 Validate all questions have answers (1-5)
      const invalidAnswers = answers.filter(a => !a.answer || a.answer < 1 || a.answer > 5);
      if (invalidAnswers.length > 0) {
        setError(`Some questions have invalid answers. Please review your responses.`);
        setLoading(false);
        return;
      }

      console.log("Submitting responses:", { count: answers.length, responses });

      // 🔹 Call backend API
      const res = await fetch(`${API_BASE_URL}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ responses }),
      });

      const data = await res.json();

      // 🔹 Handle API errors
      if (!res.ok) {
        const errorMessage = data.message || data.error || "Failed to calculate scores";
        console.error("API Error:", data);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // 🔹 Validate response structure
      if (!data.scores || typeof data.scores !== 'object') {
        setError("Received invalid response from server. Please try again.");
        setLoading(false);
        return;
      }

      // 🔹 Success - show results
      setResult(data.scores);
      setLoading(false);

    } catch (err) {
      console.error("Big Five Test Error:", err);
      setError(
        err instanceof Error
          ? `Network error: ${err.message}`
          : "An unexpected error occurred. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  // 🔹 Reset test and clear localStorage
  const handleReset = () => {
    if (confirm("Are you sure you want to restart the test? All progress will be lost.")) {
      localStorage.removeItem("mcq_progress_BIG_FIVE");
      window.location.reload();
    }
  };

  // If test completed → show results
  if (result) return <BigFiveResult scores={result} />;

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-start items-center px-6 py-4
      bg-gradient-to-br from-[#e3f2fd] via-[#eefdf3] to-[#e7edff]
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500"
    >
      {/* Back Button */}
      <div className="w-full max-w-6xl flex justify-between items-center mt-4">
        <button
          onClick={() => navigate("/dashboard")}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white/80 dark:hover:bg-gray-700/80 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>←</span> Back to Dashboard
        </button>

        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold transition-colors bg-orange-50 dark:bg-orange-900/20 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/40 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Reset Test
        </button>
      </div>

      {/* Heading Section */}
      <div className="text-center mt-6 max-w-3xl animate-fadeIn">
        <h1
          className="text-4xl md:text-6xl font-black 
          bg-gradient-to-r from-blue-600 to-green-600 
          text-transparent bg-clip-text drop-shadow-sm tracking-tight"
        >
          Big Five Personality Test
        </h1>

        <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-relaxed font-medium">
          Understand your personality across five core domains —
          <span className="font-bold text-blue-700 dark:text-blue-400"> Openness</span>,
          <span className="font-bold text-green-700 dark:text-green-400"> Conscientiousness</span>,
          <span className="font-bold text-blue-700 dark:text-blue-400"> Extraversion</span>,
          <span className="font-bold text-green-700 dark:text-green-400"> Agreeableness</span>, and
          <span className="font-bold text-blue-700 dark:text-blue-400"> Neuroticism</span>.
          <br />
          Answer each question honestly to receive accurate AI-driven insights.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-3xl mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-xl animate-fadeIn">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">Error</h3>
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Calculating Your Personality Profile...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing your responses using AI-powered OCEAN model
            </p>
          </div>
        </div>
      )}

      {/* MCQ Test Section */}
      <div className="w-full flex justify-center mt-8 mb-4">
        <div className="w-full max-w-3xl">
          <MCQEngine
            mcqs={bigFiveQuestions}
            phase="BIG_FIVE"
            onFinish={handleFinish}
          />
        </div>
      </div>
    </div>
  );
};

export default BigFiveTest;
