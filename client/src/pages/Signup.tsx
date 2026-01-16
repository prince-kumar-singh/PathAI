import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();

  // Form state
  const [fullname, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignup = () => {
    // trigger One Tap prompt if GSI loaded
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.google.accounts.id.prompt();
    } else {
      console.log("Google script not loaded yet");
    }
  };

  // handle credential response from GSI
  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken: response.credential }),
      });

      const result = await res.json();
      console.log("[Google Signup] server response status:", res.status, "body:", result);
      if (res.ok) {
        if (result?.data?.token) sessionStorage.setItem("session_token", result.data.token);
        if (result?.data?.user) sessionStorage.setItem("user", JSON.stringify(result.data.user));
        alert("🎉 Signed up with Google!");
        navigate("/login");
      } else {
        // surface server message for easier debugging
        const msg = result?.message || result?.error || "Google signup failed";
        setError(msg);
        console.warn("Google signup failed:", msg, result);
      }
    } catch (err) {
      console.error("Google signup error", err);
      setError("Unable to contact server for Google signup");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Backend Integration Added
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullname, email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result?.data?.token) {
          sessionStorage.setItem("session_token", result.data.token);
        }
        alert("🚀 Registration successful!");
        navigate("/login");
      } else {
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Server unreachable");
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
        window.google.accounts.id.renderButton(document.getElementById("g_id_signin_signup"), {
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
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: "url('/Assets/ai_career_image.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90 flex flex-col items-center justify-center p-10">
          <h1 className="text-white text-4xl font-bold leading-snug text-center animate-fadeIn">
            Start Your Journey<br />
            with <span className="text-green-400">AI Career Guidance</span>
          </h1>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-2xl px-10 py-12 w-11/12 max-w-md border border-gray-200 dark:border-gray-700 animate-scaleUp transition-colors duration-500">

          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text mb-8">
            Create Your Account 🚀
          </h2>

          {error && (
            <div className="text-red-600 text-center mb-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div className="relative mb-5">
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <label className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all
                peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-green-600 dark:peer-focus:text-green-400 peer-focus:text-xs
                peer-valid:top-[-10px] peer-valid:text-xs peer-valid:!text-green-600 dark:peer-valid:!text-green-400">
                Full Name
              </label>
            </div>

            <div className="relative mb-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <label className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all
                peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-green-600 dark:peer-focus:text-green-400 peer-focus:text-xs
                peer-valid:top-[-10px] peer-valid:text-xs peer-valid:!text-green-600 dark:peer-valid:!text-green-400">
                Email Address
              </label>
            </div>

            <div className="relative mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <label className="absolute left-4 top-2 text-gray-500 dark:text-gray-400 text-sm transition-all
                peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-green-600 dark:peer-focus:text-green-400 peer-focus:text-xs
                peer-valid:top-[-10px] peer-valid:text-xs peer-valid:!text-green-600 dark:peer-valid:!text-green-400">
                Password
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white rounded-lg text-lg font-semibold 
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-blue-600 hover:scale-[1.03] hover:shadow-lg"} transition-transform duration-300`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="flex items-center my-4">
              <div className="border-b border-gray-300 dark:border-gray-600 w-full"></div>
              <span className="px-2 text-gray-500 dark:text-gray-400 text-sm">or</span>
              <div className="border-b border-gray-300 dark:border-gray-600 w-full"></div>
            </div>

            <div id="g_id_signin_signup" className="w-full flex justify-center"></div>
            <div className="w-full mt-3">
              {/* <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full py-3 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition"
              >
                <img src="/Assets/google.png" alt="Google" className="w-6 h-6 mr-2" />
                Sign Up with Google
              </button> */}
            </div>

            <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Login here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
