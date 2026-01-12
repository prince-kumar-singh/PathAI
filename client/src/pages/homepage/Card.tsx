// FULL COMPONENT — Card + CardContainer
import { useState } from "react";

// ------------------ CARD COMPONENT ------------------
interface CardProps {
  title: string;
  content: string;
  backContent?: string;
  gradient: "blue-green" | "green-blue";
}

function Card({ title, content, backContent, gradient }: CardProps) {
  const [flipped, setFlipped] = useState(false);

  const gradientClass =
    gradient === "blue-green"
      ? "bg-gradient-to-br from-blue-500 via-blue-600 to-green-500"
      : "bg-gradient-to-br from-green-500 via-blue-600 to-blue-500";

  const toggle = () => setFlipped((prev) => !prev);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className={`ascend-flip-card ${gradientClass} rounded-2xl shadow-lg border border-gray-200`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-pressed={flipped}
        className={`ascend-flip-card-inner ${flipped ? "is-flipped" : ""}`}
      >
        {/* FRONT — Only Title */}
        <div className="ascend-flip-card-face ascend-flip-card-front p-6">
          <div className="bg-white/80 rounded-xl p-6 h-[200px] flex flex-col justify-center items-center">
            <h3 className="text-xl font-bold text-gray-900 text-center">
              {title}
            </h3>
          </div>
        </div>

        {/* BACK — Only Content */}
        <div className="ascend-flip-card-face ascend-flip-card-back p-6">
          <div className="bg-white/90 rounded-xl p-6 h-full flex flex-col justify-center items-center">
            <p className="text-gray-700 text-center text-lg leading-relaxed">
              {backContent ?? content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ CARD CONTAINER ------------------
function CardContainer() {
  return (
    <div
      id="offering-section"
      className="container mx-auto px-4 py-10"
    >
      <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text mb-8">
        What does our AI platform offer?
      </h2>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="AI-Based Career Assessment"
          content="Our AI analyzes your interests, aptitude and academic profile to identify suitable career options tailored to your strengths and long-term goals."
          gradient="blue-green"
        />

        <Card
          title="Roadmap & Skill Guidance"
          content="Step-by-step personalized guidance on which skills, certifications, courses, or projects to pursue for your target career."
          gradient="green-blue"
        />

        <Card
          title="Placement & Higher Studies Support"
          content="AI-driven suggestions for placements, exams, scholarships, and the best higher education paths based on your profile."
          gradient="blue-green"
        />

        <Card
          title="Continuous Progress Tracking"
          content="Monitor your readiness score, receive improvement suggestions, and access analytics to make smart career decisions."
          gradient="green-blue"
        />
      </div>
    </div>
  );
}

export default CardContainer;
