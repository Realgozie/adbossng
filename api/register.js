import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { getPool, initDb } from "../lib/db.js";
import { sendMail } from "../lib/mailer.js";

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  let { name, email, password } = req.body;
  email = email.toLowerCase().trim();
  password = password.trim();

  try {
    const existing = await pool.query("SELECT email FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const isFirstUser = parseInt(countResult.rows[0].count) === 0;

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO users (email, name, password, is_verified, verify_token, joined_at, is_admin)
       VALUES ($1, $2, $3, FALSE, $4, NOW(), $5)`,
      [email, name, hashedPassword, verifyToken, isFirstUser]
    );

    const baseUrl = process.env.CUSTOM_DOMAIN
      ? `https://${process.env.CUSTOM_DOMAIN}`
      : process.env.REPLIT_DEPLOYMENT_DOMAIN
      ? `https://${process.env.REPLIT_DEPLOYMENT_DOMAIN}`
      : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

    const verifyLink = `${baseUrl}/api/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: "Confirm your AdBOSS account",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <div style="background:#2563eb;border-radius:12px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:20px;">✦</span>
            </div>
            <h1 style="margin:0;color:#1e293b;font-size:22px;">AdBOSS</h1>
          </div>
          <h2 style="color:#1e293b;">Welcome, ${name}! 🎉</h2>
          <p style="color:#475569;">Thanks for signing up. Please confirm your email address to activate your account.</p>
          <a href="${verifyLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;margin:24px 0;">Verify my email</a>
          <p style="color:#94a3b8;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#94a3b8;font-size:12px;">— The AdBOSS Team</p>
        </div>
      `,
    });

    console.log("User registered:", email, isFirstUser ? "(admin)" : "");
    return res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      emailSent: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    });
  } catch (err) {
    console.error("Error in /api/register:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
