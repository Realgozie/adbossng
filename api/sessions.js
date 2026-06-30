import { randomUUID } from "crypto";
import { getPool, initDb } from "../lib/db.js";

function parseDevice(ua = "") {
  let device = "Unknown Device";
  let type = "desktop";

  if (/iPhone|iPad|iPod/.test(ua)) {
    type = "mobile";
    device = /iPad/.test(ua) ? "Safari on iPad" : "Safari on iPhone";
  } else if (/Android/.test(ua)) {
    type = "mobile";
    device = /Chrome/.test(ua) ? "Chrome on Android" : "Browser on Android";
  } else if (/Windows/.test(ua)) {
    if (/Edg\//.test(ua)) device = "Edge on Windows";
    else if (/Chrome/.test(ua)) device = "Chrome on Windows";
    else if (/Firefox/.test(ua)) device = "Firefox on Windows";
    else device = "Browser on Windows";
  } else if (/Mac OS X/.test(ua)) {
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) device = "Safari on Mac";
    else if (/Chrome/.test(ua)) device = "Chrome on Mac";
    else if (/Firefox/.test(ua)) device = "Firefox on Mac";
    else device = "Browser on Mac";
  } else if (/Linux/.test(ua)) {
    device = /Chrome/.test(ua) ? "Chrome on Linux" : "Browser on Linux";
  }

  return { device, type };
}

export async function createSession(email, ua, ip) {
  await initDb();
  const pool = getPool();
  const { device, type } = parseDevice(ua);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO sessions (id, user_email, device, type, ip, created_at, last_seen)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, email.toLowerCase().trim(), device, type, ip || "Unknown"]
  );

  // Keep only last 5 sessions per user
  await pool.query(
    `DELETE FROM sessions WHERE user_email = $1 AND id NOT IN (
      SELECT id FROM sessions WHERE user_email = $1 ORDER BY created_at DESC LIMIT 5
    )`,
    [email.toLowerCase().trim()]
  );

  return id;
}

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  const email = (req.headers["x-user-email"] || "").toLowerCase().trim();
  const currentSessionId = req.headers["x-session-id"] || "";
  if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (req.method === "GET") {
    const result = await pool.query(
      "SELECT * FROM sessions WHERE user_email = $1 ORDER BY created_at DESC",
      [email]
    );
    const sessions = result.rows.map((s) => ({
      id: s.id,
      device: s.device,
      type: s.type,
      ip: s.ip,
      createdAt: s.created_at,
      lastSeen: s.last_seen,
      isCurrent: s.id === currentSessionId,
    }));
    return res.json({ success: true, sessions });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Session ID required" });
    if (id === currentSessionId) {
      return res.status(400).json({ success: false, message: "Cannot revoke current session" });
    }
    await pool.query("DELETE FROM sessions WHERE id = $1 AND user_email = $2", [id, email]);
    return res.json({ success: true });
  }

  if (req.method === "PUT") {
    const result = await pool.query(
      "DELETE FROM sessions WHERE user_email = $1 AND id != $2",
      [email, currentSessionId]
    );
    return res.json({ success: true, count: result.rowCount });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
