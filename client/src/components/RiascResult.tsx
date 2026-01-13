import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  scores: Record<string, number>;
  hollandCode?: string;
}

const riasecTraits = {
  R: {
    emoji: "🔧",
    name: "Realistic",
    description: "Practical, hands-on, mechanical skills, working with tools and objects"
  },
  I: {
    emoji: "🔬",
    name: "Investigative",
    description: "Analytical, scientific thinking, research, problem-solving"
  },
  A: {
    emoji: "🎨",
    name: "Artistic",
    description: "Creative, expressive, innovative, artistic expression"
  },
  S: {
    emoji: "🤝",
    name: "Social",
    description: "Helpful, teaching, caring for others, interpersonal skills"
  },
  E: {
    emoji: "💼",
    name: "Enterprising",
    description: "Leadership, persuasion, business, entrepreneurship"
  },
  C: {
    emoji: "📊",
    name: "Conventional",
    description: "Organized, detail-oriented, systematic, clerical work"
  }
};

const RiasecResult: React.FC<Props> = ({ scores, hollandCode }) => {
  const navigate = useNavigate();

  // Calculate overall profile score (average)
  const scoreValues = Object.values(scores).filter(v => typeof v === 'number');
  const overallScore = scoreValues.length > 0
    ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    : 0;
  const overallPercent = Math.round(overallScore * 100);

  // Get interpretation
  const getInterpretation = (score: number) => {
    const percent = score * 100;
    if (percent >= 70) return { label: "High", color: "text-green-600 dark:text-green-400" };
    if (percent >= 40) return { label: "Moderate", color: "text-blue-600 dark:text-blue-400" };
    return { label: "Low", color: "text-orange-600 dark:text-orange-400" };
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-20 p-6 bg-gradient-to-br from-[#eaf7ff] to-[#f0fcf4] dark:from-gray-900 dark:to-gray-800 relative">

      {/* Blurred Background Accents */}
      <div className="absolute left-6 top-10 w-72 h-72 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute right-6 bottom-10 w-96 h-96 bg-green-200 rounded-full opacity-30 blur-3xl"></div>

      {/* Heading */}
      <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-600 z-10">
        🎉 Your RIASEC Career Profile
      </h2>

      {/* Holland Code Display */}
      {hollandCode && (
        <div className="mb-8 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-blue-200 dark:border-blue-700 max-w-2xl w-full mx-auto text-center">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Your Holland Code</p>
          <h3 className="text-6xl font-black bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-3 tracking-tight">
            {hollandCode}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Your top three career interests based on the RIASEC model
          </p>
        </div>
      )}

      {/* Overall Profile Score */}
      <div className="mb-8 z-10 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-auto text-center">
        <p className="text-sm font-bold uppercase tracking-wider opacity-90 mb-1">Overall Career Interest Score</p>
        <p className="text-5xl font-black">{overallPercent}%</p>
        <p className="text-sm opacity-90 mt-2">Average across all RIASEC dimensions</p>
      </div>

      {/* Result Cards */}
      <div className="w-full max-w-6xl grid md:grid-cols-2 lg:grid-cols-3 gap-8 z-10 mb-10">
        {Object.entries(scores).map(([trait, value]) => {
          const traitInfo = riasecTraits[trait as keyof typeof riasecTraits];
          if (!traitInfo) return null;

          const percent = Math.round((value / 1) * 100);
          const interpretation = getInterpretation(value);

          return (
            <div
              key={trait}
              className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 hover:scale-[1.04] transition-transform duration-300"
            >
              {/* Trait Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{traitInfo.emoji}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{traitInfo.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{trait} - RIASEC Dimension</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {traitInfo.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-600 transition-all duration-1000"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{percent}%</span>
                <span className={`text-sm font-bold ${interpretation.color}`}>
                  {interpretation.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational Footer */}
      <div className="max-w-4xl w-full mb-8 p-6 bg-blue-50/80 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg z-10">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>📚</span> About the RIASEC Model
        </h4>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          The RIASEC model (Holland Codes) identifies six personality types that match different career environments.
          Your Holland Code represents your top three interests. Use this insight to explore careers that align with your strengths!
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-200 dark:bg-gray-700 dark:text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:scale-[1.05] transition-transform"
        >
          ← Back to Dashboard
        </button>

        <button
          onClick={() => navigate("/reading-comprehension-test")}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:scale-[1.05] transition-transform"
        >
          Continue to Reading Test →
        </button>
      </div>
    </div>
  );
};

export default RiasecResult;
