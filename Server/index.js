import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";

import { connectDb } from "./config/db.js";
import connectRedis from "./config/redisClient.js";
import authRoute from "./route/AuthRoute.js";
import roadmapRoute from "./route/phase2/RoadmapRoute.js";
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

// -------------------------------------------------------------------
// 📌 Big Five API Proxy & Save
// -------------------------------------------------------------------
app.post("/api/score", async (req, res) => {
  try {
    const response = await fetch("https://ocean-scoring-api.onrender.com/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    const token = req.cookies.session_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SCERET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (user) {
          await Score.findOneAndUpdate(
            { userId },
            { userId, fullname: user.fullname, bigFive: data.scores },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.warn("Failed to save Big Five score (Invalid Token):", err.message);
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: "Big Five API forwarding failed" });
  }
}); 

// -------------------------------------------------------------------
// 📌 RIASEC API Proxy Route
// -------------------------------------------------------------------
app.post("/api/riasec-score", async (req, res) => {
  try {
    const response = await fetch("https://riasec-scoring-api.onrender.com/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SCERET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Score.findOneAndUpdate(
      { userId },
      { userId, fullname: user.fullname, riasec: data.scores },
      { upsert: true, new: true }
    );

    res.json(data);
  } catch (error) {
    console.error("Backend Error (RIASEC):", error);
    res.status(500).json({ error: "RIASEC API forwarding failed" });
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
