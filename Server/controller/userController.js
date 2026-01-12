import { ApiError } from "../helper/ApiError.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import User from "../model/userModel.js";
import connectRedis from "../config/redisClient.js";
import { generateToken } from "../helper/token.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { OAuth2Client } from "google-auth-library";

// -----------------------------------------------------
// REGISTER CONTROLLER (fullname, email, password)
// -----------------------------------------------------
export const register = async (req, res) => {
  try {
    let { fullname, email, password } = req.body;
    let photoUrl = null;

    fullname = fullname?.trim();
    email = email?.trim();

    if (!fullname || !email || !password) {
      return res.status(400).json(
        new ApiError(400, "All fields are required", [
          "fullname, email, and password must be provided",
        ])
      );
    }

    if (!validator.isLength(fullname, { min: 3, max: 30 })) {
      return res.status(400).json(
        new ApiError(400, "Invalid Full Name", [
          "Full name must be between 3 and 30 characters",
        ])
      );
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json(
        new ApiError(400, "Invalid Email Address", [
          "Enter a valid email like example@gmail.com",
        ])
      );
    }

    email = validator.normalizeEmail(email);

    if (
      !validator.isStrongPassword(password, {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 0,
      })
    ) {
      return res.status(400).json(
        new ApiError(400, "Weak Password", [
          "Password must be at least 6 characters and contain at least 1 number",
        ])
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json(
        new ApiError(409, "User already exists", [
          "A user with this email already exists",
        ])
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      photoUrl,
    });

    await newUser.save();

    const client = await connectRedis();
    await client.set(
      `user:${newUser._id}`,
      JSON.stringify({
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        photoUrl: newUser.photoUrl,
        createdAt: new Date(),
      })
    );

    const token = generateToken(newUser._id);
    console.log("Generated Token:", token);

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: false, // Set true in production (HTTPS)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { user: newUser, token },
        "User registered successfully"
      )
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Registration failed", [error.message])
    );
  }
};

// -----------------------------------------------------
// LOGIN CONTROLLER (email, password)
// -----------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(
        new ApiError(400, "All fields are required", [
          "email and password must be provided",
        ])
      );
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json(
        new ApiError(404, "User not found", [
          "No user found with this email",
        ])
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
      return res.status(401).json(
        new ApiError(401, "Invalid credentials", ["Incorrect password"])
      );
    }

    const token =  await generateToken(existingUser._id);
    console.log("Generated Token:", token);

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const client = await connectRedis();
    await client.set(
      `user:${existingUser._id}`,
      JSON.stringify({
        id: existingUser._id,
        fullname: existingUser.fullname,
        email: existingUser.email,
        lastLogin: new Date(),
      })
    );

    return res.status(200).json(
      new ApiResponse(200, { user: existingUser, token }, "Login successful")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Login failed", [error.message])
    );
  }
};

// -----------------------------------------------------
// LOGOUT CONTROLLER
// -----------------------------------------------------
export const logout = async (req, res) => {
  try {
    res.clearCookie("session_token");
    return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
  } catch (error) {
    return res.status(500).json(
      new ApiError(500, "Logout failed", [error.message])
    );
  }
};

// -----------------------------------------------------
// GOOGLE OAUTH (verify ID token, create/update user)
// -----------------------------------------------------
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json(new ApiError(400, "Missing idToken", ["idToken is required"]));
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json(new ApiError(500, "Google client ID not configured", ["Set GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID in .env"]));
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json(new ApiError(400, "Invalid Google token", ["Unable to read token payload"]));
    }

    const email = payload.email;
    const fullname = payload.name || "";
    const photoUrl = payload.picture || null;

    let user = await User.findOne({ email });

    if (!user) {
      // create new user (no password)
      user = new User({ fullname, email, password: null, photoUrl });
      await user.save();
    } else {
      // update photo or name if changed
      let changed = false;
      if (photoUrl && user.photoUrl !== photoUrl) {
        user.photoUrl = photoUrl;
        changed = true;
      }
      if (fullname && user.fullname !== fullname) {
        user.fullname = fullname;
        changed = true;
      }
      if (changed) await user.save();
    }

    const token = await generateToken(user._id);

    res.cookie("session_token", token, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const clientRedis = await connectRedis();
    await clientRedis.set(
      `user:${user._id}`,
      JSON.stringify({ id: user._id, fullname: user.fullname, email: user.email, photoUrl: user.photoUrl })
    );

    return res.status(200).json(new ApiResponse(200, { user, token }, "Google login successful"));
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json(new ApiError(500, "Google authentication failed", [error.message]));
  }
};
