import { generateSecret, verify as otpVerify } from "otplib";
import QRCode from "qrcode";
import { getPool, initDb } from "../lib/db.js";
import { createSession } from "./sessions.js";

function buildOtpURI(email, secret) {
  return `otpauth://totp/AdBOSS:${encodeURIComponent(email)}?secret=${secret}&issuer=AdBOSS`;
}

// Allow ±1 time-step (30 s) so deployed servers with minor clock drift still accept valid codes
const VERIFY_OPTS = { epochTolerance: 1 };

async function checkToken(token, secret) {
  const result = await otpVerify({ token: String(token).trim(), secret, ...VERIFY_OPTS });
  return result === true || result?.valid === true;
}

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  const email = (req.headers["x-user-email"] || "").toLowerCase().trim();
  if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

  const action = req._action || req.path?.split("/").pop();

  if (action === "setup") {
    try {
      const secret = generateSecret();
      const otpauth = buildOtpURI(email, secret);
      const qrDataUrl = await QRCode.toDataURL(otpauth);

      await pool.query(
        "UPDATE users SET two_factor_pending = $1 WHERE email = $2",
        [secret, email]
      );

      return res.json({ success: true, secret, qrCode: qrDataUrl });
    } catch (err) {
      console.error("2FA setup error:", err);
      return res.status(500).json({ success: false, message: "Failed to set up 2FA" });
    }
  }

  if (action === "verify") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required" });

    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];

      if (!user?.two_factor_pending) {
        return res.status(400).json({ success: false, message: "No pending 2FA setup. Please restart setup." });
      }

      const isValid = await checkToken(code, user.two_factor_pending);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
      }

      await pool.query(
        `UPDATE users SET two_factor_secret = $1, two_factor_enabled = TRUE, two_factor_pending = NULL
         WHERE email = $2`,
        [user.two_factor_pending, email]
      );

      return res.json({ success: true, message: "2FA enabled successfully!" });
    } catch (err) {
      console.error("2FA verify error:", err);
      return res.status(500).json({ success: false, message: "Verification failed" });
    }
  }

  if (action === "disable") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Current 2FA code required" });

    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];

      if (!user?.two_factor_enabled || !user?.two_factor_secret) {
        return res.status(400).json({ success: false, message: "2FA is not enabled" });
      }

      const isValid = await checkToken(code, user.two_factor_secret);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid code. 2FA not disabled." });
      }

      await pool.query(
        "UPDATE users SET two_factor_secret = NULL, two_factor_enabled = FALSE, two_factor_pending = NULL WHERE email = $1",
        [email]
      );

      return res.json({ success: true, message: "2FA disabled." });
    } catch (err) {
      console.error("2FA disable error:", err);
      return res.status(500).json({ success: false, message: "Failed to disable 2FA" });
    }
  }

  if (action === "check") {
    const { code, loginEmail } = req.body;
    const targetEmail = (loginEmail || email).toLowerCase().trim();

    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [targetEmail]);
      const user = result.rows[0];

      if (!user?.two_factor_enabled || !user?.two_factor_secret) {
        return res.status(400).json({ success: false, message: "2FA not enabled for this account" });
      }

      const isValid = await checkToken(code, user.two_factor_secret);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
      }

      const ua = req.headers["user-agent"] || "";
      const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "Unknown";
      const sessionId = await createSession(targetEmail, ua, ip);

      const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      const isAdmin = adminEmail ? targetEmail === adminEmail : user.is_admin;

      return res.json({
        success: true,
        user: { name: user.name, email: user.email, isAdmin },
        sessionId,
      });
    } catch (err) {
      console.error("2FA check error:", err);
      return res.status(500).json({ success: false, message: "Verification failed" });
    }
  }

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT two_factor_enabled FROM users WHERE email = $1", [email]
      );
      const enabled = result.rows[0]?.two_factor_enabled || false;
      return res.json({ success: true, enabled });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to check 2FA status" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
