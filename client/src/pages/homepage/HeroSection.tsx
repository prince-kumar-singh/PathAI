import { useNavigate } from "react-router";
import CardContainer from "./Card";
import ProfileCardContainer from "./ProfileCardContainer";
import ExploreButton from "./ExploreButton";
import Footer from "./Footer";

function HeroSection() {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    const token = sessionStorage.getItem("session_token");

    if (token) {
      navigate("/dashboard");
    } else {
      alert("⚠ Please login to explore AI features.");
      navigate("/login");
    }
  };


  return (
    <div id="hero-section" className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <div className="container mx-auto px-6 py-5">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-10">
          {/* Left: Text */}
          <div className="w-full lg:w-6/12">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 lg:p-12 shadow-xl transition-colors duration-500">
              <div className="flex items-center gap-4 mb-4">
                <img src="/Assets/logo1.png" alt="Ascend AI" className="w-[200px] h-[250px] rounded-md" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    ASCEND AI
                  </h1>
                  <p className="text-[13px] md:text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">
                    AI Driven Career Guidance Platform
                  </p>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 text-gray-900 dark:text-white">
                Discover your ideal career path
                <br />
                with <span className="text-indigo-600 dark:text-indigo-400">personalized AI guidance</span>
              </h1>

              <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">Smart recommendations, step-by-step roadmaps, and progress tracking — all tailored to your strengths.</p>

              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={handleExploreClick}
                  className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:scale-105 transition-transform"
                >
                  Get Started
                </button>

                {/* <button
                  onClick={() => window.scrollTo({ top: document.getElementById('offering-section')?.offsetTop ?? 0, behavior: 'smooth' })}
                  className="px-5 py-3 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  Explore Features
                </button> */}

                <div className="ml-4 hidden md:flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">96%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">1.2k+</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="w-full lg:w-6/12 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -left-10 -top-8 w-40 h-40 bg-indigo-100/60 dark:bg-indigo-900/40 rounded-full blur-3xl animate-float"></div>
              <div className="absolute -right-8 -bottom-6 w-56 h-56 bg-sky-100/50 dark:bg-sky-900/40 rounded-full blur-3xl animate-float animation-delay-2000"></div>

              <img src="/Assets/image.png" alt="Illustration" className="w-full h-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700" />
            </div>
          </div>
        </div>

        {/* Cards and other sections below hero */}
        <div className="mt-12">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 transition-colors duration-500">
            <CardContainer />
          </div>
        </div>

        {/* <div className="mt-8">
          <ProfileCardContainer />
        </div> */}

        <div className="flex justify-center mt-8">
          <ExploreButton onClick={handleExploreClick} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default HeroSection;
