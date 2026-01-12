import React from "react";

interface Props {
  scores: Record<string, number>;
}

const BigFiveResult: React.FC<Props> = ({ scores }) => {
  const entries = Object.entries(scores);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-32 p-6 bg-gradient-to-br from-[#eaf7ff] to-[#f0fcf4] dark:from-gray-900 dark:to-gray-800 relative">

      {/* Blurred Background Accents */}
      <div className="absolute left-6 top-10 w-72 h-72 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute right-6 bottom-10 w-96 h-96 bg-green-200 rounded-full opacity-30 blur-3xl"></div>

      {/* Heading */}
      <h2 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 z-10">
        🎉 Your Big Five Personality Scores
      </h2>

      {/* Result Cards */}
      <div className="w-full max-w-6xl grid md:grid-cols-2 lg:grid-cols-3 gap-8 z-10">
        {entries.map(([trait, value]) => {
          const percent = Math.round((value / 1) * 100);

          return (
            <div
              key={trait}
              className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 hover:scale-[1.04] transition-transform duration-300"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{trait.toUpperCase()}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Big Five Personality Trait</p>

              {/* Progress Bar */}
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-600"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{percent}%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{value}/1</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-10 z-10">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-gray-200 dark:bg-gray-700 dark:text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:scale-[1.05] transition-transform"
        >
          ← Back Home
        </button>

        <button
          onClick={() => (window.location.href = "/riasec-test")}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:scale-[1.05] transition-transform"
        >
          Move to RIASEC Test →
        </button>
      </div>
    </div>
  );
};

export default BigFiveResult;
