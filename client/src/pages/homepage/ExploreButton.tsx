import React from "react";

interface ExploreButtonProps {
  onClick: () => void;
}

const ExploreButton = ({ onClick }: ExploreButtonProps) => {
  return (
    <div id="explore" className="flex flex-col items-center text-center px-6 py-10">
      <br />
      <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">
        Your Career Starts Here – Powered by AI
        <br /><br />
      </h2>

      <button
        onClick={onClick}
        className="px-10 py-6 bg-green-600 text-white text-3xl rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg transition duration-300 ease-in-out mb-6 transform hover:scale-105"
      >
        Start Your AI Career Journey
      </button>
      <br />
      <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-2xl">
        Begin by answering a few simple questions about your interests, skills, and goals. Our AI will analyze your profile and suggest personalized career paths, required skills, recommended courses, and growth opportunities.  
        <br /><br />
        Take your first step towards clarity and confidence — your future career is just one click away.
      </p>
    </div>
  );
};

export default ExploreButton;
