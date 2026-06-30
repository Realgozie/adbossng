import { getPool, initDb } from "../lib/db.js";

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  const email = (req.headers["x-user-email"] || "").toLowerCase().trim();
  if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    if (adminEmail) {
      if (email !== adminEmail) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
    } else {
      const first = await pool.query(
        "SELECT email FROM users ORDER BY joined_at ASC LIMIT 1"
      );
      if (!first.rows.length || first.rows[0].email !== email) {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
    }

    if (req.method === "GET") {
      const firstUser = await pool.query(
        "SELECT email FROM users ORDER BY joined_at ASC LIMIT 1"
      );
      const firstEmail = firstUser.rows[0]?.email;

      const result = await pool.query(
        "SELECT name, email, joined_at, is_verified, is_admin FROM users ORDER BY joined_at ASC"
      );
      const safeUsers = result.rows.map((u) => ({
        name: u.name,
        email: u.email,
        joinedAt: u.joined_at,
        isVerified: u.is_verified,
        isAdmin: adminEmail ? u.email === adminEmail : u.email === firstEmail,
      }));
      return res.json({ success: true, users: safeUsers, total: safeUsers.length });
    }

    return res.status(404).json({ success: false, message: "Not found" });
  } catch (err) {
    console.error("Admin error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
