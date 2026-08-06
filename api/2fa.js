import { generateSecret, verify as otpVerify } from "otplib";
import QRCode from "qrcode";
import { getPool, initDb } from "../lib/db.js";
import { createSession } from "./sessions.js";

function buildOtpURI(email, secret) {
  return `otpauth://totp/AdBOSS:${encodeURIComponent(email)}?secret=${secret}&issuer=AdBOSS`;
}

// Allow ±1 time-step (30 s) to tolerate server/phone clock drift in production
async function checkToken(token, secret) {
  const result = await otpVerify({ token: String(token).trim(), secret, epochTolerance: 1 });
  return result === true || result?.valid === true;
}

export default async function handler(req, res) {
  const email = (req.headers["x-user-email"] || "").toLowerCase().trim();
  if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

  const action = req._action;

  // ── SETUP ─────────────────────────────────────────────────────────────
  // Generate the secret and QR code independently of the database.
  // The DB write is best-effort; if it fails the user still sees the QR.
  // The secret is returned to the client and re-submitted on verify.
  if (action === "setup") {
    try {
      const secret = generateSecret();
      const otpauth = buildOtpURI(email, secret);
      const qrDataUrl = await QRCode.toDataURL(otpauth);

      // Best-effort: store pending secret so verify can look it up server-side.
      // If this fails we still return the QR — the client will send secret on verify.
      try {
        await initDb();
        const pool = getPool();
        await pool.query(
          "UPDATE users SET two_factor_pending = $1 WHERE email = $2",
          [secret, email]
        );
      } catch (dbErr) {
        console.error("2FA setup DB write failed (non-fatal):", dbErr.message);
      }

      return res.json({ success: true, secret, qrCode: qrDataUrl });
    } catch (err) {
      console.error("2FA setup error:", err);
      return res.status(500).json({ success: false, message: "Failed to generate 2FA setup: " + err.message });
    }
  }

  // ── VERIFY ────────────────────────────────────────────────────────────
  // Accept secret from the request body (client state) as the primary source,
  // falling back to two_factor_pending in the DB.
  if (action === "verify") {
    const { code, secret: clientSecret } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required" });

    try {
      await initDb();
      const pool = getPool();

      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];

      // Prefer the pending secret from DB; fall back to what the client sent
      const pendingSecret = user?.two_factor_pending || clientSecret;
      if (!pendingSecret) {
        return res.status(400).json({ success: false, message: "No pending 2FA setup. Please restart setup." });
      }

      const isValid = await checkToken(code, pendingSecret);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
      }

      await pool.query(
        `UPDATE users SET two_factor_secret = $1, two_factor_enabled = TRUE, two_factor_pending = NULL
         WHERE email = $2`,
        [pendingSecret, email]
      );

      return res.json({ success: true, message: "2FA enabled successfully!" });
    } catch (err) {
      console.error("2FA verify error:", err);
      return res.status(500).json({ success: false, message: "Verification failed: " + err.message });
    }
  }

  // ── DISABLE ───────────────────────────────────────────────────────────
  if (action === "disable") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Current 2FA code required" });

    try {
      await initDb();
      const pool = getPool();

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
      return res.status(500).json({ success: false, message: "Failed to disable 2FA: " + err.message });
    }
  }

  // ── CHECK (login-time TOTP validation) ────────────────────────────────
  if (action === "check") {
    const { code, loginEmail } = req.body;
    const targetEmail = (loginEmail || email).toLowerCase().trim();

    try {
      await initDb();
      const pool = getPool();

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
      return res.status(500).json({ success: false, message: "Verification failed: " + err.message });
    }
  }

  // ── STATUS (GET) ──────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      await initDb();
      const pool = getPool();
      const result = await pool.query(
        "SELECT two_factor_enabled FROM users WHERE email = $1", [email]
      );
      const enabled = result.rows[0]?.two_factor_enabled || false;
      return res.json({ success: true, enabled });
    } catch (err) {
      console.error("2FA status error:", err);
      return res.status(500).json({ success: false, message: "Failed to check 2FA status: " + err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
