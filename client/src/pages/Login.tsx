import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    // fallback: prompt the Google One Tap / button if available
    // this will trigger the google accounts prompt if the script is loaded
    // if not loaded, user can still use the rendered button
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // show prompt (One Tap) — safe fallback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.google.accounts.id.prompt();
    } else {
      console.log("Google script not loaded yet");
    }
  };

  // Callback invoked by Google Identity Services when a credential is returned
  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken: response.credential }),
      });

      const result = await res.json();
      if (res.ok) {
        if (result?.data?.token) sessionStorage.setItem("session_token", result.data.token);
        if (result?.data?.user) sessionStorage.setItem("user", JSON.stringify(result.data.user));
        alert("🎉 Logged in with Google!");
        navigate("/");
      } else {
        setError(result.message || "Google login failed");
      }
    } catch (err) {
      console.error("Google login error", err);
      setError("Unable to contact server for Google login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important for cookies
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log("Login Response:", result);

      if (response.ok) {
        // 🎯 Store token
        if (result?.data?.token) {
          sessionStorage.setItem("session_token", result.data.token);
        }

        // 🎯 Store user data if needed
        if (result?.data?.user) {
          sessionStorage.setItem("user", JSON.stringify(result.data.user));
        }

        alert("🎉 Login Successful!");
        navigate("/");
        // window.location.reload(); // Refresh page to update navbar
      } else {
        setError(result.message || "Invalid Credentials");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError("⚠ Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // load Google Identity Services script and render button
  React.useEffect(() => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    console.log("[Auth Debug] VITE_GOOGLE_CLIENT_ID:", clientId);
    console.log("[Auth Debug] origin:", window.location.origin);
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID not set in environment - Google Sign-In will not initialize.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        // render the Google button into the container
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.google.accounts.id.renderButton(document.getElementById("g_id_signin"), {
          theme: "outline",
          size: "large",
          width: "100%",
        });
      }
    };

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      {/* Left - AI Background */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: "url('/Assets/ai_career_image.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90 flex flex-col items-center justify-center p-10">
          <h1 className="text-white text-4xl font-bold leading-snug text-center animate-fadeIn">
            Unlock Your Future<br />
            with <span className="text-green-400">AI-Powered Career Guidance</span>
          </h1>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-2xl px-10 py-12 w-11/12 max-w-md border border-gray-200 dark:border-gray-700 animate-scaleUp transition-colors duration-500">

          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text mb-8">
            Welcome Back 👋
          </h2>

          {error && (
            <div className="text-red-600 text-center text-sm font-medium mb-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="relative mb-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <label className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-green-600 dark:peer-focus:text-green-400 peer-focus:text-xs peer-valid:top-[-10px] peer-valid:text-xs peer-valid:!text-green-600 dark:peer-valid:!text-green-400">
                Email Address
              </label>
            </div>

            {/* Password */}
            <div className="relative mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <label className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-green-600 dark:peer-focus:text-green-400 peer-focus:text-xs peer-valid:top-[-10px] peer-valid:text-xs peer-valid:!text-green-600 dark:peer-valid:!text-green-400">
                Password
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white rounded-lg text-lg font-semibold transition-transform duration-300 ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-blue-600 hover:scale-[1.03] hover:shadow-lg"
                }`}
            >
              {loading ? "Logging In..." : "Login"}
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="border-b border-gray-300 dark:border-gray-600 w-full"></div>
              <span className="px-2 text-gray-500 dark:text-gray-400 text-sm">or</span>
              <div className="border-b border-gray-300 dark:border-gray-600 w-full"></div>
            </div>

            {/* Google Login (GSI renders into this div) */}
            <div id="g_id_signin" className="w-full flex justify-center"></div>
            <div className="w-full mt-3">
              {/* <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition"
              >
                <img src="/Assets/google.png" alt="Google" className="w-6 h-6 mr-2" />
                Continue with Google
              </button> */}
            </div>

            <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
              Don't have an account?{" "}
              <a href="/signup" className="text-green-600 dark:text-green-400 font-semibold hover:underline">
                Create one
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


