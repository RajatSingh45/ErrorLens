import { OAuth2Client } from "google-auth-library";
import pool from "../config/db.js";
import jwt from "jsonwebtoken"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;

    let user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (user.rows.length === 0) {
      user = await pool.query(
        "INSERT INTO users (email) VALUES ($1) RETURNING *",
        [email],
      );
    }

    const userData = user.rows[0];

    const jwtToken = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token:jwtToken,
      user: userData,
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(500).json({ message: "Auth failed" });
  }
};
