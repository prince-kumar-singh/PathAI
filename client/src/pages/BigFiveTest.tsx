import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MCQEngine from "../components/MCQEngine";
import bigFiveQuestions from "../data/question";
import BigFiveResult from "../components/BigFiveResult";
import type { Answer } from "../types/mcq";

const BigFiveTest: React.FC = () => {
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const navigate = useNavigate();

  const handleFinish = async (answers: Answer[]) => {
    const responses: Record<string, number> = {};
    answers.forEach((a) => (responses[a.id] = a.answer));
  
    const res = await fetch("http://localhost:8000/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ responses }),
    });

    const data = await res.json();
    setResult(data.scores);
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
      <div className="w-full max-w-6xl flex justify-start mt-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white/80 dark:hover:bg-gray-700/80 backdrop-blur-sm"
        >
          <span>←</span> Back to Dashboard
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
