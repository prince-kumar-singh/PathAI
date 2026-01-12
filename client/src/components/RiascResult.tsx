import React from "react";

interface Props {
  scores: Record<string, number>;
}

const RiasecResult: React.FC<Props> = ({ scores }) => {
  const entries = Object.entries(scores);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-32 p-6 bg-gradient-to-br from-[#fff7ec] to-[#f0fbff] dark:from-gray-900 dark:to-gray-800 relative">

      {/* Blurred Background Accents */}
      <div className="absolute left-6 top-10 w-72 h-72 bg-yellow-200 rounded-full opacity-30 blur-3xl"></div>
      <div className="absolute right-6 bottom-10 w-96 h-96 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>

      <h2 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 z-10">
        Thank you for Giving the RIASEC Test📌

      </h2>
      <h2 className="text-4xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 z-10">

        Your RIASEC Career Interest Scores
      </h2>

      <div className="w-full max-w-6xl grid md:grid-cols-2 lg:grid-cols-3 gap-8 z-10">
        {entries.map(([trait, rawScore]) => {
          const value = typeof rawScore === "number" ? rawScore : Number(rawScore);
          const percent = Math.round((value / 1) * 100); // RIASEC uses 1–5 scale

          return (
            <div
              key={trait}
              className="p-6 bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border-2 border-gray-700 dark:border-gray-600 hover:scale-[1.05] transition-transform duration-300"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{trait.toUpperCase()}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">RIASEC Dimension</p>

              {/* Progress Bar */}
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-blue-600"
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
          onClick={() => alert("Navigate to Reading Comprehension Test")}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:scale-[1.05] transition-transform"
        >
          Move To Reading Comprehension Test
        </button>
      </div>
    </div>
  );
};

export default RiasecResult;
