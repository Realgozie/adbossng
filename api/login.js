import bcrypt from "bcrypt";
import { getPool, initDb } from "./db.js";
import { createSession } from "./sessions.js";

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  let { email, password } = req.body;
  email = email.toLowerCase().trim();
  password = password.trim();

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (user) {
      const valid = await bcrypt.compare(password, user.password);

      if (valid) {
        const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
        const isAdmin = adminEmail ? email === adminEmail : user.is_admin;

        if (user.two_factor_enabled && user.two_factor_secret) {
          console.log("Login requires 2FA for:", email);
          return res.status(200).json({
            success: false,
            requires2FA: true,
            email,
            message: "2FA code required",
          });
        }

        const ua = req.headers["user-agent"] || "";
        const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "Unknown";
        const sessionId = await createSession(email, ua, ip);

        console.log("Login successful for:", email, isAdmin ? "(admin)" : "");
        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: { name: user.name, email: user.email, isAdmin },
          sessionId,
        });
      }
    }

    console.log("Login failed for:", email);
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  } catch (err) {
    console.error("Error in /api/login:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
