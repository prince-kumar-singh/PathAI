import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  scores: Record<string, number>;
}

// Trait metadata with descriptions
const traitInfo: Record<string, { name: string; description: string; emoji: string }> = {
  E_score: {
    name: "Extraversion",
    description: "Energy, positive emotions, sociability, and tendency to seek stimulation in the company of others",
    emoji: "🎉"
  },
  N_score: {
    name: "Neuroticism",
    description: "Tendency to experience negative emotions like anxiety, anger, or depression",
    emoji: "😰"
  },
  A_score: {
    name: "Agreeableness",
    description: "Compassion, cooperation, trustworthiness, and concern for social harmony",
    emoji: "🤝"
  },
  C_score: {
    name: "Conscientiousness",
    description: "Organization, dependability, self-discipline, and achievement orientation",
    emoji: "📋"
  },
  O_score: {
    name: "Openness to Experience",
    description: "Intellectual curiosity, creativity, preference for novelty and variety",
    emoji: "🎨"
  }
};

// Get interpretation label based on score
const getInterpretation = (score: number): { label: string; color: string } => {
  if (score >= 0.7) return { label: "High", color: "text-green-600 dark:text-green-400" };
  if (score >= 0.4) return { label: "Moderate", color: "text-blue-600 dark:text-blue-400" };
  return { label: "Low", color: "text-orange-600 dark:text-orange-400" };
};

const BigFiveResult: React.FC<Props> = ({ scores }) => {
  const navigate = useNavigate();
  const entries = Object.entries(scores);

  // Calculate average personality profile
  const avgScore = entries.reduce((sum, [_, value]) => sum + value, 0) / entries.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 p-6 bg-gradient-to-br from-[#eaf7ff] to-[#f0fcf4] dark:from-gray-900 dark:to-gray-800 relative">

      {/* Blurred Background Accents */}
      <div className="absolute left-6 top-10 w-72 h-72 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute right-6 bottom-10 w-96 h-96 bg-green-200 rounded-full opacity-30 blur-3xl"></div>

      {/* Heading */}
      <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 z-10">
        🎉 Your Big Five Personality Profile
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mb-10 z-10">
        Based on the IPIP-50 assessment, here are your OCEAN personality scores.
        Each trait is measured on a scale from 0 (low) to 1 (high).
      </p>

      {/* Overall Score Summary */}
      <div className="w-full max-w-6xl mb-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Overall Profile Score</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average across all five dimensions</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
              {Math.round(avgScore * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="w-full max-w-6xl grid md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
        {entries.map(([trait, value]) => {
          const percent = Math.round(value * 100);
          const info = traitInfo[trait];
          const interpretation = getInterpretation(value);

          return (
            <div
              key={trait}
              className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 hover:scale-[1.02] transition-transform duration-300"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{info?.emoji || "📊"}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {info?.name || trait.toUpperCase()}
                  </h3>
                  <span className={`text-sm font-semibold ${interpretation.color}`}>
                    {interpretation.label}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {info?.description || "Personality trait measurement"}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-lg text-gray-700 dark:text-gray-200">{percent}%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{value.toFixed(2)}/1.00</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-12 z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-200 dark:bg-gray-700 dark:text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:scale-[1.05] transition-transform"
        >
          ← Back to Dashboard
        </button>

        <button
          onClick={() => navigate("/riasec-test")}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:scale-[1.05] transition-transform"
        >
          Continue to RIASEC Test →
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl max-w-4xl z-10">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
          <strong>Note:</strong> These results are based on the Big Five (OCEAN) personality model
          and provide insights into your behavioral tendencies. Complete the RIASEC test next
          to discover your career interests and get personalized career recommendations.
        </p>
      </div>
    </div>
  );
};

export default BigFiveResult;
