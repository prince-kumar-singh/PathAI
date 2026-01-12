import  { useState, useEffect } from "react";

interface Option {
  value: number;
  label: string;
}

interface MCQ {
  id: string;
  trait: string;
  question: string;
  options: Option[]; // ⬅ Updated (not string[])
}

interface MCQComponentProps {
  mcqs: MCQ[];
  phase: "BIG_FIVE" | "RIASEC";
}

const MCQComponent = ({ mcqs, phase }: MCQComponentProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ id: string; answer: number }[]>([]);
  const [bigFiveResult, setBigFiveResult] = useState<any | null>(null);
  const [riasecResult, setRiasecResult] = useState<any | null>(null);

  const currentMCQ = mcqs[currentIndex];

  useEffect(() => {
    const previous = answers.find((a) => a.id === currentMCQ.id);
    setSelectedOption(previous?.answer || null);
  }, [currentIndex]);

  const saveAnswer = (answer: number) => {
    setAnswers((prev) => {
      const updated = [...prev];
      const i = updated.findIndex((a) => a.id === currentMCQ.id);
      if (i >= 0) updated[i] = { id: currentMCQ.id, answer };
      else updated.push({ id: currentMCQ.id, answer });
      return updated;
    });
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    saveAnswer(selectedOption);
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishTest();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const finishTest = async () => {
    const responses = answers.reduce((acc, curr) => {
      acc[curr.id] = curr.answer;
      return acc;
    }, {} as Record<string, number>);

    const payload = { responses };

    try {
      const url =
        phase === "BIG_FIVE"
          ? "http://localhost:8000/api/score"
          : "http://localhost:8000/api/riasec-score";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      phase === "BIG_FIVE" ? setBigFiveResult(data) : setRiasecResult(data);
    } catch (err) {
      console.error("Error submitting:", err);
      alert("Something went wrong!");
    }
  };

  // 🎉 Big Five Result
  if (bigFiveResult) {
    const scores = bigFiveResult?.scores || {};

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#e3f2fd] via-[#f1fcf3] to-[#e6e9fc] text-center p-6 relative overflow-hidden">

        {/* Floating Background */}
        <div className="absolute w-72 h-72 bg-blue-300 rounded-full opacity-30 blur-3xl top-10 left-2 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-green-300 rounded-full opacity-30 blur-3xl bottom-10 right-2 animate-pulse"></div>

        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text mb-6 animate-fadeIn">
          🎉 Your Big Five Personality Scores
        </h2>

        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mt-4">
          {Object.entries(scores).map(([trait, score], idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-green-50 to-blue-50 px-8 py-6 w-56 rounded-2xl shadow-xl border-2 border-gray-700 hover:scale-[1.07] hover:shadow-2xl transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {trait.replace("_score", "").toUpperCase()}
              </h3>
              <div className="w-full h-3 bg-gray-300 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-600"
                  style={{ width: `${(score as number) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-lg font-semibold text-gray-700">
                {(score as number * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.location.href = "/riasec-test"}
          className="mt-10 bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:scale-[1.05] hover:shadow-xl transition-all"
        >
          🚀 Start RIASEC Test
        </button>
      </div>
    );
  }

  // 🎯 RIASEC Result
  if (riasecResult) {
  const scores = riasecResult?.scores || {};

  // Sort scores to show top traits
  const sortedTraits = Object.entries(scores)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3); // Get Top 3

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#e3f2fd] via-[#f1fcf3] to-[#e6e9fc] text-center p-6 relative overflow-hidden">

      {/* Floating Background */}
      <div className="absolute w-72 h-72 bg-blue-300 rounded-full opacity-30 blur-3xl top-10 left-2 animate-pulse"></div>
      <div className="absolute w-80 h-80 bg-green-300 rounded-full opacity-30 blur-3xl bottom-10 right-2 animate-pulse"></div>

      <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text mb-6 animate-fadeIn">
        🎯 Your RIASEC Career Personality Results
      </h2>

      {/* Card Layout */}
      <div className="flex flex-wrap justify-center gap-6 max-w-5xl mt-4">
        {Object.entries(scores).map(([trait, score], idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-green-50 to-blue-50 px-8 py-6 w-56 rounded-2xl shadow-xl border-2 border-gray-600
                       hover:scale-[1.07] hover:shadow-2xl transition-all duration-300"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {trait.toUpperCase()}
            </h3>
            <div className="w-full h-3 bg-gray-300 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-600"
                style={{ width: `${score * 20}%` }} // Since RIASEC raw scores are 0-8 or 8*5 etc.
              ></div>
            </div>
            <p className="mt-2 text-lg font-semibold text-gray-700">
              {score.toFixed(1)} / 8
            </p>
          </div>
        ))}
      </div>

      {/* Highlight Top 3 Traits */}
      <div className="mt-10 p-6 bg-white/80 rounded-2xl shadow-lg max-w-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🌟 Top Personality Matches</h3>
        {sortedTraits.map(([trait, score], i) => (
          <p key={i} className="text-lg font-semibold">
            {i + 1}. <span className="text-blue-600">{trait.toUpperCase()}</span> – {score.toFixed(1)} / 8
          </p>
        ))}
      </div>

      <button
        onClick={() => window.location.href = "/career-recommendations"}
        className="mt-10 bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:scale-[1.05] hover:shadow-xl transition-all duration-300"
      >
        🚀 Get Career Recommendations
      </button>
    </div>
  );
}


  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-br from-[#e3f2fd] via-[#f1fcf3] to-[#e6e9fc] relative overflow-hidden">

      {/* Floating Bubbles */}
      <div className="absolute w-72 h-72 bg-blue-300 rounded-full opacity-30 blur-3xl top-10 left-2 animate-pulse"></div>
      <div className="absolute w-80 h-80 bg-green-300 rounded-full opacity-30 blur-3xl bottom-10 right-2 animate-pulse"></div>

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">
        {phase === "BIG_FIVE" ? "Big Five Personality Test" : "RIASEC Career Test"}
      </h1>

      {/* Progress Bar */}
      <div className="w-full max-w-xl text-center mb-6">
        <div className="flex justify-between text-gray-700 text-sm mb-1">
          <span>Question {currentIndex + 1}</span>
          <span>{mcqs.length}</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full max-w-xl bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-gray-400">
        <h3 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text">
          {currentMCQ.question}
        </h3>

        <div className="flex flex-col gap-3">
          {currentMCQ.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm cursor-pointer transition-all duration-300 ${
                selectedOption === option.value
                  ? "bg-gradient-to-r from-green-500 to-blue-600 text-white scale-[1.02]"
                  : "hover:bg-gray-100 bg-white"
              }`}
            >
              <input
                type="radio"
                value={option.value}
                checked={selectedOption === option.value}
                onChange={() => setSelectedOption(option.value)}
                className="w-5 h-5 accent-blue-500"
              />
              <span>{option.value} – {option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`w-1/2 py-3 rounded-xl text-lg font-bold ${
              currentIndex === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 hover:scale-[1.03]"
            }`}
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className={`w-1/2 py-3 rounded-xl text-lg font-bold ${
              selectedOption !== null
                ? "bg-gradient-to-r from-green-500 to-blue-600 text-white hover:scale-[1.03] hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {currentIndex + 1 === mcqs.length ? "Finish Test" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCQComponent;
