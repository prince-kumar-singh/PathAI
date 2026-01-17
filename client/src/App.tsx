import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { Homepage } from "./pages/HomePage";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import BigFiveTest from "./pages/BigFiveTest";
import BigFiveResultsPage from "./pages/BigFiveResultsPage";
import RiasecTest from "./pages/RiasecTest";
import RiasecResultsPage from "./pages/RiasecResultsPage";
import ReadingComprehensionTest from "./pages/ReadingComprehensionTest";
import OnboardingFlow from "./pages/phase2/OnboardingFlow";
import RoadmapPreview from "./pages/phase2/RoadmapPreview";
import DailyTaskPlayer from "./pages/phase2/DailyTaskPlayer";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./pages/homepage/Navbar";

/* ✅ Layout component to control Navbar visibility */
function AppLayout() {
  const location = useLocation();

  // ❌ Routes where Navbar should be hidden
  const hideNavbarRoutes = ["/big-five-test", "/riasec-test", "/reading-comprehension-test", "/onboarding"];
  const isRoadmapPreview = location.pathname.includes("/preview");
  const isDailyPlayer = location.pathname.includes("/day/");
  const hideNavbar = hideNavbarRoutes.includes(location.pathname) || isRoadmapPreview || isDailyPlayer;

  return (
    <>
      {/* ✅ Show Navbar only when not on test pages */}
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 🔥 Test Pages (No Navbar) */}
        <Route path="/big-five-test" element={<BigFiveTest />} />
        <Route path="/big-five-results" element={<BigFiveResultsPage />} />
        <Route path="/riasec-test" element={<RiasecTest />} />
        <Route path="/riasec-results" element={<RiasecResultsPage />} />
        <Route path="/reading-comprehension-test" element={<ReadingComprehensionTest />} />

        {/* 🚀 Phase 2 Routes */}
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/roadmap/:roadmapId/preview" element={<RoadmapPreview />} />
        <Route path="/roadmap/:roadmapId/day/:dayNumber" element={<DailyTaskPlayer />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
