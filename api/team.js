import { randomUUID } from "crypto";
import { getPool, initDb } from "../lib/db.js";

const GRADIENT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-pink-500",
  "from-rose-500 to-red-600",
  "from-amber-400 to-orange-500",
  "from-cyan-500 to-blue-500",
];

function rowToMember(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.member_email,
    role: r.role,
    status: r.status,
    avatar: r.avatar,
    color: r.color,
    isOwner: r.is_owner,
  };
}

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  const email = (req.headers["x-user-email"] || "").toLowerCase().trim();
  const userName = req.headers["x-user-name"] || email.split("@")[0];
  const isAdmin = req.headers["x-user-is-admin"] === "true";

  if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (req.method === "GET") {
    const result = await pool.query(
      "SELECT * FROM team_members WHERE owner_email = $1 ORDER BY is_owner DESC",
      [email]
    );

    if (result.rows.length === 0) {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO team_members (id, owner_email, member_email, name, role, status, avatar, color, is_owner)
         VALUES ($1, $2, $3, $4, $5, 'Active', $6, $7, TRUE)`,
        [id, email, email, userName, isAdmin ? "Administrator" : "Member",
         userName.charAt(0).toUpperCase(), "from-blue-500 to-indigo-600"]
      );
      const fresh = await pool.query(
        "SELECT * FROM team_members WHERE owner_email = $1", [email]
      );
      return res.json({ success: true, team: fresh.rows.map(rowToMember) });
    }

    return res.json({ success: true, team: result.rows.map(rowToMember) });
  }

  if (req.method === "POST") {
    const { memberEmail, memberName, role } = req.body;
    if (!memberEmail?.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email required" });
    }
    const normalMember = memberEmail.toLowerCase();
    const existing = await pool.query(
      "SELECT id FROM team_members WHERE owner_email = $1 AND member_email = $2",
      [email, normalMember]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "This email is already on the team" });
    }
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM team_members WHERE owner_email = $1", [email]
    );
    const colorIndex = parseInt(countResult.rows[0].count) % GRADIENT_COLORS.length;
    const id = randomUUID();
    const displayName = memberName || memberEmail.split("@")[0];
    await pool.query(
      `INSERT INTO team_members (id, owner_email, member_email, name, role, status, avatar, color, is_owner)
       VALUES ($1, $2, $3, $4, $5, 'Pending', $6, $7, FALSE)`,
      [id, email, normalMember, displayName, role || "Editor",
       displayName.charAt(0).toUpperCase(), GRADIENT_COLORS[colorIndex]]
    );
    return res.status(201).json({
      success: true,
      member: { id, name: displayName, email: normalMember, role: role || "Editor",
        status: "Pending", avatar: displayName.charAt(0).toUpperCase(),
        color: GRADIENT_COLORS[colorIndex], isOwner: false },
    });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Member ID required" });
    await pool.query("DELETE FROM team_members WHERE id = $1 AND owner_email = $2", [id, email]);
    return res.json({ success: true });
  }

  if (req.method === "PUT") {
    const { id, role } = req.body;
    if (!id || !role) return res.status(400).json({ success: false, message: "ID and role required" });
    await pool.query(
      "UPDATE team_members SET role = $1 WHERE id = $2 AND owner_email = $3",
      [role, id, email]
    );
    const result = await pool.query(
      "SELECT * FROM team_members WHERE owner_email = $1 ORDER BY is_owner DESC", [email]
    );
    return res.json({ success: true, team: result.rows.map(rowToMember) });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
