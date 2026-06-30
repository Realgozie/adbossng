import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { getPool, initDb } from "./db.js";
import { sendMail } from "./mailer.js";

export async function forgotPasswordHandler(req, res) {
  await initDb();
  const pool = getPool();

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  const normalEmail = email.toLowerCase().trim();

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [normalEmail]);
    const user = result.rows[0];

    if (!user) {
      return res.json({ success: true, message: "If this email is registered, a reset link has been sent." });
    }

    const token = randomBytes(32).toString("hex");
    const expiry = Date.now() + 60 * 60 * 1000;

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE email = $3",
      [token, expiry, normalEmail]
    );

    const baseUrl = process.env.CUSTOM_DOMAIN
      ? `https://${process.env.CUSTOM_DOMAIN}`
      : process.env.REPLIT_DEPLOYMENT_DOMAIN
      ? `https://${process.env.REPLIT_DEPLOYMENT_DOMAIN}`
      : process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

    const resetLink = `${baseUrl}/#/reset-password?token=${token}&email=${encodeURIComponent(normalEmail)}`;

    await sendMail({
      to: normalEmail,
      subject: "Reset your AdBOSS password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
          <h2 style="color:#1e293b;margin-bottom:8px;">Reset your password</h2>
          <p style="color:#475569;">Hi ${user.name},</p>
          <p style="color:#475569;">We received a request to reset your AdBOSS password. Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;margin:24px 0;">Reset Password</a>
          <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
          <p style="color:#94a3b8;font-size:12px;">— The AdBOSS Team</p>
        </div>
      `,
    });

    return res.json({ success: true, message: "If this email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function resetPasswordHandler(req, res) {
  await initDb();
  const pool = getPool();

  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  const normalEmail = email.toLowerCase().trim();

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [normalEmail]);
    const user = result.rows[0];

    if (!user || user.reset_token !== token || !user.reset_expiry || Date.now() > parseInt(user.reset_expiry)) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_expiry = NULL WHERE email = $2",
      [hashed, normalEmail]
    );

    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
