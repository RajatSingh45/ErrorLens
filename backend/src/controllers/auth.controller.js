import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import jwt from "jsonwebtoken"

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Check if user already exists
    let user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    user = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword],
    );

    const userData = user.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set HttpOnly cookie
    res.cookie("authToken", token,cookieOptions);

    res.status(201).json({
      success: true,
      user: userData,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    let user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userData = user.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set HttpOnly cookie
    res.cookie("authToken", token,cookieOptions);

    // Return user without password
    const { password: _, ...userWithoutPassword } = userData;

    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.log("login error:",err.message)
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Logout failed" });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await pool.query("SELECT id, email FROM users WHERE id=$1", [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user: user.rows[0],
    });
  } catch (err) {
    console.error("Get user error:", err.message);
    res.status(500).json({ message: "Failed to get user" });
  }
};
