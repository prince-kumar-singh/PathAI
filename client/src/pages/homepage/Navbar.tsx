import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import logo1 from "../../../public/Assets/logo1.png";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const [sticky, setSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(!!sessionStorage.getItem("session_token"));
  }, []);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 5);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API Error:", error);
    }

    sessionStorage.removeItem("session_token");
    setIsLoggedIn(false);
    alert("Logged out successfully!");
    navigate("/");
    window.location.reload();
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b
      ${sticky
          ? "bg-[#E9F3FF] dark:bg-gray-900/90 backdrop-blur-xl shadow-md border-gray-200 dark:border-gray-800"
          : "bg-[#E9F3FF] dark:bg-gray-900/50 backdrop-blur-lg border-transparent"
        }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">

        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo1} alt="Ascend AI Logo" className="h-[70px]" />
          <div className="leading-tight">
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              ASCEND AI
            </h1>
            <p className="text-[13px] md:text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">
              AI Driven Career Guidance Platform
            </p>
          </div>
        </div>

        {/* DESKTOP BUTTONS */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/50 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="px-5 py-2 text-[15px] font-semibold border border-blue-500 rounded-lg 
                bg-white/40 backdrop-blur-lg dark:bg-gray-800/50 dark:text-white
                hover:bg-blue-500 hover:text-white hover:scale-105 
                transition-all duration-300 shadow-sm"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-5 py-2 text-[15px] font-semibold rounded-lg 
                bg-gradient-to-r from-blue-500 to-green-500 text-white 
                hover:from-green-500 hover:to-blue-500 hover:scale-105 
                transition-all duration-300 shadow-md"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="px-5 py-2 text-[15px] font-semibold rounded-lg 
                bg-gradient-to-r from-blue-500 to-green-500 text-white 
                hover:from-green-500 hover:to-blue-500 hover:scale-105 
                transition-all duration-300 shadow-md"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-[15px] font-semibold rounded-lg 
                bg-gradient-to-r from-red-500 to-red-600 text-white 
                hover:scale-105 transition-all duration-300 shadow-md"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={toggleMenu}
          className="lg:hidden p-2 rounded-md bg-white/40 backdrop-blur-md shadow-sm"
        >
          <svg
            className="h-7 w-7 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={
                menuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="lg:hidden bg-[#E9F3FF]/80 backdrop-blur-xl shadow-md border-t">
          <div className="flex flex-col gap-3 p-4">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-center border rounded-lg bg-white/50 backdrop-blur-lg 
                  hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="px-4 py-2 text-center rounded-lg bg-gradient-to-r from-blue-500 to-green-500 text-white 
                  hover:from-green-500 hover:to-blue-500 transition duration-300 shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-center rounded-lg 
                  bg-gradient-to-r from-blue-500 to-green-500 text-white 
                  hover:from-green-500 hover:to-blue-500 transition duration-300 shadow-sm"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-center rounded-lg 
                  bg-gradient-to-r from-red-500 to-red-600 text-white 
                  hover:scale-105 transition duration-300 shadow-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
