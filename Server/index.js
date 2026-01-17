import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";

import { connectDb } from "./config/db.js";
import connectRedis from "./config/redisClient.js";
import authRoute from "./route/AuthRoute.js";
import roadmapRoute from "./route/phase2/RoadmapRoute.js";
import taskRoute from "./route/phase2/TaskRoute.js";
import jwt from "jsonwebtoken";
import User from "./model/userModel.js";
import Score from "./model/scoreModel.js";

dotenv.config();

const app = express();

// 🔹 Connect to DB & Redis
connectDb();
connectRedis();

// 🔹 Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------------------------------------------------------
// 📌 Test Route
// -------------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("🚀 Backend up & running!");
});

// 📌 Auth Routes
app.use("/api/v1/auth", authRoute);

// 📌 Phase 2 Routes
app.use("/api/v1/roadmaps", roadmapRoute);
app.use("/api/v1/tasks", taskRoute);

// -------------------------------------------------------------------
// 📌 Big Five API Proxy & Save
// -------------------------------------------------------------------
app.post("/api/score", async (req, res) => {
  try {
    // 🔹 Validate request body
    const { responses } = req.body;

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        error: "Invalid request format",
        message: "Request body must contain 'responses' object"
      });
    }

    // 🔹 Validate that all 50 IPIP items are present
    const requiredKeys = [
      'EXT1', 'EXT2', 'EXT3', 'EXT4', 'EXT5', 'EXT6', 'EXT7', 'EXT8', 'EXT9', 'EXT10',
      'EST1', 'EST2', 'EST3', 'EST4', 'EST5', 'EST6', 'EST7', 'EST8', 'EST9', 'EST10',
      'AGR1', 'AGR2', 'AGR3', 'AGR4', 'AGR5', 'AGR6', 'AGR7', 'AGR8', 'AGR9', 'AGR10',
      'CSN1', 'CSN2', 'CSN3', 'CSN4', 'CSN5', 'CSN6', 'CSN7', 'CSN8', 'CSN9', 'CSN10',
      'OPN1', 'OPN2', 'OPN3', 'OPN4', 'OPN5', 'OPN6', 'OPN7', 'OPN8', 'OPN9', 'OPN10'
    ];

    const missingKeys = requiredKeys.filter(key => !(key in responses));
    if (missingKeys.length > 0) {
      return res.status(400).json({
        error: "Incomplete assessment",
        message: `Missing responses for ${missingKeys.length} questions`,
        missingKeys: missingKeys.slice(0, 5) // Show first 5 missing
      });
    }

    // 🔹 Validate response values (1-5)
    const invalidValues = Object.entries(responses).filter(
      ([key, value]) => typeof value !== 'number' || value < 1 || value > 5
    );

    if (invalidValues.length > 0) {
      return res.status(400).json({
        error: "Invalid response values",
        message: "All responses must be numbers between 1 and 5",
        invalidItems: invalidValues.slice(0, 3).map(([key]) => key)
      });
    }

    // 🔹 Forward to Big Five Scoring API
    const apiUrl = process.env.BIG_FIVE_API_URL || "https://ocean-scoring-api.onrender.com/score";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Big Five API Error:", response.status, errorText);
      return res.status(response.status).json({
        error: "External API error",
        message: "Failed to calculate personality scores",
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }

    const data = await response.json();

    // 🔹 Validate API response structure
    if (!data.scores || typeof data.scores !== 'object') {
      console.error("Invalid API response structure:", data);
      return res.status(502).json({
        error: "Invalid API response",
        message: "Received invalid response from scoring service"
      });
    }

    const { E_score, N_score, A_score, C_score, O_score } = data.scores;

    if ([E_score, N_score, A_score, C_score, O_score].some(score =>
      typeof score !== 'number' || score < 0 || score > 1
    )) {
      console.error("Invalid score values:", data.scores);
      return res.status(502).json({
        error: "Invalid scores",
        message: "Received invalid score values from API"
      });
    }

    // 🔹 Save to database (if authenticated)
    const token = req.cookies.session_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (user) {
          await Score.findOneAndUpdate(
            { userId },
            {
              userId,
              fullname: user.fullname,
              bigFive: {
                E_score,
                N_score,
                A_score,
                C_score,
                O_score
              }
            },
            { upsert: true, new: true }
          );
          console.log(`✅ Big Five scores saved for user: ${user.fullname}`);
        }
      } catch (err) {
        console.warn("Failed to save Big Five score (Invalid Token):", err.message);
        // Continue - don't block response if save fails
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Backend Error (Big Five):", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// -------------------------------------------------------------------
// 📌 RIASEC API Proxy Route (ENHANCED)
// -------------------------------------------------------------------
app.post("/api/riasec-score", async (req, res) => {
  try {
    // 🔹 Validate that all 48 RIASEC items are present
    const requiredKeys = [
      'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8',
      'I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8',
      'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
      'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8',
      'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8',
      'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'
    ];

    const missingKeys = requiredKeys.filter(key => !(key in req.body));
    if (missingKeys.length > 0) {
      return res.status(400).json({
        error: "Incomplete assessment",
        message: `Missing responses for ${missingKeys.length} questions`,
        missingKeys: missingKeys.slice(0, 5)
      });
    }

    // 🔹 Validate response values (1-5)
    const invalidValues = Object.entries(req.body).filter(
      ([key, value]) => typeof value !== 'number' || value < 1 || value > 5
    );

    if (invalidValues.length > 0) {
      return res.status(400).json({
        error: "Invalid response values",
        message: "All responses must be numbers between 1 and 5",
        invalidItems: invalidValues.slice(0, 3).map(([key]) => key)
      });
    }

    // 🔹 Forward to RIASEC Scoring API
    const apiUrl = process.env.RIASEC_API_URL || "https://riasec-scoring-api.onrender.com/score";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RIASEC API Error:", response.status, errorText);
      return res.status(response.status).json({
        error: "External API error",
        message: "Failed to calculate RIASEC scores",
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }

    const data = await response.json();

    // 🔹 Validate API response structure
    if (!data.scores || typeof data.scores !== 'object') {
      console.error("Invalid RIASEC API response structure:", data);
      return res.status(502).json({
        error: "Invalid API response",
        message: "Received invalid response from RIASEC scoring service"
      });
    }

    const { R, I, A, S, E, C } = data.scores;
    const { holland_code } = data;

    // 🔹 Validate score values (0-1) and Holland Code
    if ([R, I, A, S, E, C].some(score =>
      typeof score !== 'number' || score < 0 || score > 1
    )) {
      console.error("Invalid RIASEC score values:", data.scores);
      return res.status(502).json({
        error: "Invalid scores",
        message: "Received invalid RIASEC score values from API"
      });
    }

    if (!holland_code || typeof holland_code !== 'string' || holland_code.length !== 3) {
      console.warn("Invalid Holland Code:", holland_code);
    }

    // 🔹 Save to database (requires authentication)
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SCERET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Score.findOneAndUpdate(
      { userId },
      {
        userId,
        fullname: user.fullname,
        riasec: {
          R,
          I,
          A,
          S,
          E,
          C,
          holland_code: holland_code || null
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ RIASEC scores saved for user: ${user.fullname} (Holland Code: ${holland_code})`);

    res.json(data);
  } catch (error) {
    console.error("Backend Error (RIASEC):", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// -------------------------------------------------------------------
// 📌 Get User Scores Route
// -------------------------------------------------------------------
app.get("/api/user-scores", async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SCERET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    const score = await Score.findOne({ userId });

    res.json({
      fullname: user.fullname,
      bigFive: score?.bigFive || null,
      riasec: score?.riasec || null,
      careerPrediction: score?.careerPrediction || null,
    });
  } catch (error) {
    console.error("Error fetching user scores:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// -------------------------------------------------------------------
// 📌 Career Prediction Route (UPDATED)
// -------------------------------------------------------------------
app.post("/api/predict-career", async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SCERET);
    const userId = decoded.id;

    const scoreDoc = await Score.findOne({ userId });
    if (!scoreDoc || !scoreDoc.riasec || !scoreDoc.bigFive) {
      return res.status(400).json({ error: "Complete RIASEC and Big Five tests first." });
    }

    const { riasec, bigFive } = scoreDoc;
    const readingAnswers = req.body;

    console.log("Debug - Raw Scores from DB:", {
      riasecKeys: Object.keys(riasec || {}),
      bigFiveKeys: Object.keys(bigFive || {}),
      riasec,
      bigFive
    });

    const payload = {
      R: riasec.realistic || riasec.R || 0,
      I: riasec.investigative || riasec.I || 0,
      A: riasec.artistic || riasec.A || 0,
      S: riasec.social || riasec.S || 0,
      E: riasec.enterprising || riasec.E || 0,
      C: riasec.conventional || riasec.C || 0,
      O: bigFive.O_score || bigFive.openness || bigFive.O || 0,
      C2: bigFive.C_score || bigFive.conscientiousness || bigFive.C || 0,
      E2: bigFive.E_score || bigFive.extraversion || bigFive.E || 0,
      A2: bigFive.A_score || bigFive.agreeableness || bigFive.A || 0,
      N: bigFive.N_score || bigFive.neuroticism || bigFive.N || 0,
      ...readingAnswers,
    };

    console.log(payload);

    // ------------------ NEW RENDER FIX START ------------------
    let cookies = "";
    let xsrfToken = "";
    const baseUrl = "https://shiv-fyp-codebase-final-api.onrender.com";
    const predictUrl = `${baseUrl}/predict`;
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // Step 1: Hit /docs or generic page to get cookies (Cloudflare/FastAPI/Streamlit)
    try {
      console.log("Attempting to fetch cookies from /docs...");
      const health = await fetch(`${baseUrl}/docs`, {
        method: "GET",
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        }
      });
      console.log(`Docs Page Status: ${health.status}`);

      // Extensive Cookie Debugging
      // Node-fetch standard way to get multiple headers is health.headers.raw()
      let rawCookies = [];
      if (health.headers.raw) {
        rawCookies = health.headers.raw()['set-cookie'] || [];
      } else {
        // Fallback if raw() isn't available (should be in node-fetch)
        const h = health.headers.get('set-cookie');
        if (h) rawCookies = [h];
      }

      console.log(`Found ${rawCookies.length} Set-Cookie headers`);

      if (rawCookies.length > 0) {
        // Simple join for the Cookie header
        cookies = rawCookies.map(c => c.split(';')[0]).join('; ');
        console.log("Constructed Cookie String:", cookies);

        // Try to find XSRF token specifically
        const tokenMatch = cookies.match(/_xsrf=([^;]+)/) || cookies.match(/xsrf-token=([^;]+)/i);
        if (tokenMatch) {
          xsrfToken = tokenMatch[1];
          console.log("Captured XSRF Token:", xsrfToken);
        }
      }

    } catch (err) {
      console.log("Docs Fetch Failed:", err.message);
    }

    // Step 2: Make the POST request
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": userAgent,
      "Origin": baseUrl,
      "Referer": `${baseUrl}/docs`,
      "Connection": "keep-alive"
    };

    if (cookies) headers["Cookie"] = cookies;
    if (xsrfToken) {
      headers["X-Xsrftoken"] = xsrfToken;
      headers["X-CSRF-Token"] = xsrfToken; // Common variant
    }

    console.log("Sending POST to:", predictUrl);

    const response = await fetch(predictUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    console.log("External API Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Career API Error Body:", errorText);
      return res.status(response.status).json({ error: "Career prediction failed", details: errorText });
    }

    const data = await response.json();

    // Save prediction to DB
    await Score.findOneAndUpdate(
      { userId },
      { careerPrediction: data },
      { new: true }
    );

    return res.json(data);
    // ------------------ NEW RENDER FIX END ------------------

  } catch (error) {
    console.error("Error predicting career:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -------------------------------------------------------------------
// 📌 Start Server
// -------------------------------------------------------------------
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
