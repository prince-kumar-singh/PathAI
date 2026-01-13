import React, { useEffect, useState } from "react";
import type { MCQ, Answer } from "../types/mcq";

interface Props {
  mcqs: MCQ[];
  phase: "BIG_FIVE" | "RIASEC";
  onFinish: (answers: Answer[]) => void;
}

const MCQEngine: React.FC<Props> = ({ mcqs, phase, onFinish }) => {
  // 1️⃣ Lazy initialization from LocalStorage
  const [index, setIndex] = useState(() => {
    const saved = localStorage.getItem(`mcq_progress_${phase}`);
    console.log(`[MCQEngine] Loading index for ${phase}:`, saved);
    if (saved) {
      try {
        const { index: savedIndex } = JSON.parse(saved);
        if (typeof savedIndex === "number") {
          console.log(`[MCQEngine] Restored index: ${savedIndex}`);
          return savedIndex;
        }
      } catch (e) {
        console.error("Failed to load index", e);
      }
    }
    return 0;
  });

  const [answers, setAnswers] = useState<Answer[]>(() => {
    const saved = localStorage.getItem(`mcq_progress_${phase}`);
    if (saved) {
      try {
        const { answers: savedAnswers } = JSON.parse(saved);
        if (Array.isArray(savedAnswers)) {
          console.log(`[MCQEngine] Restored answers:`, savedAnswers);
          return savedAnswers;
        }
      } catch (e) {
        console.error("Failed to load answers", e);
      }
    }
    return [];
  });

  const [selected, setSelected] = useState<number | null>(null);

  // 2️⃣ Save progress to LocalStorage whenever state changes
  useEffect(() => {
    console.log(`[MCQEngine] Saving progress for ${phase}:`, index, answers);
    localStorage.setItem(
      `mcq_progress_${phase}`,
      JSON.stringify({ index, answers })
    );
  }, [index, answers, phase]);

  const current = mcqs[index];

  useEffect(() => {
    const prev = answers.find((a) => a.id === current.id);
    setSelected(prev ? prev.answer : null);
  }, [current.id, answers]);

  const saveAnswer = (value: number) => {
    const updated = [...answers];
    const existingIndex = updated.findIndex((a) => a.id === current.id);

    if (existingIndex >= 0) {
      updated[existingIndex].answer = value;
    } else {
      updated.push({ id: current.id, answer: value });
    }

    setAnswers(updated);
    return updated;
  };

  const goToNextQuestion = () => {
    if (index + 1 >= mcqs.length) return;
    setIndex((prev) => prev + 1);
  };

  const handleSelect = (value: number) => {
    setSelected(value);
    saveAnswer(value);

    if (index + 1 < mcqs.length) {
      setTimeout(() => {
        goToNextQuestion();
      }, 150);
    }
  };

  const handleSubmit = () => {
    // Get the updated answers array (includes the current selection)
    let finalAnswers = answers;
    if (selected !== null) {
      finalAnswers = saveAnswer(selected);
    }

    // 🔹 Don't submit if not all questions answered
    if (finalAnswers.length < mcqs.length) {
      alert(`Please answer all ${mcqs.length} questions. You've answered ${finalAnswers.length}.`);
      return;
    }

    // Clear progress on finish
    localStorage.removeItem(`mcq_progress_${phase}`);

    // Call onFinish immediately - parent component handles loading state
    onFinish(finalAnswers);
  };

  // Calculate progress
  const answeredCount = answers.length;
  const allAnswered = answeredCount === mcqs.length;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#e3f2fd] via-[#eefdf3] to-[#e7edff] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-500">

      {/* Background blur circles */}
      <div className="absolute left-10 top-20 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute right-10 bottom-20 w-96 h-96 bg-green-300/20 dark:bg-green-500/10 rounded-full blur-3xl pointer-events-none animate-float animation-delay-2000" />

      <div className="w-full max-w-3xl z-10">

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 px-1">
            <span>Question {index + 1}</span>
            <span className={answeredCount < mcqs.length ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}>
              {answeredCount}/{mcqs.length} answered
            </span>
          </div>

          <div className="h-3 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner border border-white/60 dark:border-gray-600/60">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${((index + 1) / mcqs.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 dark:border-gray-700/60 animate-scaleUp">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 leading-snug">
            {current.question}
          </h2>

          <div className="flex flex-col gap-4">
            {current.options.map((opt) => {
              const isSelected = selected === opt.value;

              return (
                <div
                  key={`${current.id}-${opt.value}`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelect(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(opt.value);
                    }
                  }}
                  className={`group flex items-center gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-out
                    ${isSelected
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-transparent shadow-lg shadow-blue-500/20 scale-[1.02] translate-x-1"
                      : "bg-white/80 dark:bg-gray-700/50 border-transparent hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-gray-600/50 hover:shadow-md hover:-translate-y-0.5"
                    }
                  `}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300
                      ${isSelected
                        ? "border-white bg-white/20"
                        : "border-gray-300 dark:border-gray-500 group-hover:border-blue-400 bg-white dark:bg-gray-600"
                      }
                    `}
                  >
                    {isSelected && <div className="w-3 h-3 rounded-full bg-white shadow-sm" />}
                  </div>

                  <span className={`text-lg font-medium transition-colors duration-300 ${isSelected ? "text-white" : "text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300"}`}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          {index + 1 === mcqs.length && (
            <div>
              {!allAnswered && (
                <div className="mt-6 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-xl">
                  <p className="text-sm text-orange-800 dark:text-orange-300 text-center">
                    ⚠️ Please answer all {mcqs.length} questions before submitting.
                    <span className="font-bold"> {answeredCount}/{mcqs.length} completed</span>
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg tracking-wide
                transition-all duration-300 ease-out
                ${allAnswered
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  }`}
              >
                {allAnswered ? "Complete Assessment ✓" : `Answer All Questions (${answeredCount}/${mcqs.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCQEngine;
