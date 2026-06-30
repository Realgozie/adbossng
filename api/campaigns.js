import { randomUUID } from "crypto";
import { getPool, initDb } from "./db.js";

function rowToCampaign(r) {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    budget: r.budget,
    budgetNum: parseFloat(r.budget_num) || 0,
    leads: r.leads,
    targetLeads: r.target_leads,
    conv: r.conv,
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    userEmail: r.user_email,
  };
}

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  const email = (req.headers["x-user-email"] || "").toLowerCase().trim();
  if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (req.method === "GET") {
    const result = await pool.query(
      "SELECT * FROM campaigns WHERE user_email = $1 ORDER BY created_at DESC",
      [email]
    );
    return res.json({ success: true, campaigns: result.rows.map(rowToCampaign) });
  }

  if (req.method === "POST") {
    const { name, budget, targetLeads, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Campaign name is required" });

    const budgetNum = parseFloat((budget || "0").replace(/[^0-9.]/g, "")) || 0;
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO campaigns (id, user_email, name, status, budget, budget_num, leads, target_leads, conv, description, created_at)
       VALUES ($1, $2, $3, 'Draft', $4, $5, 0, $6, '0%', $7, NOW())
       RETURNING *`,
      [id, email, name, budget || "$0", budgetNum, parseInt(targetLeads) || 0, description || ""]
    );
    return res.status(201).json({ success: true, campaign: rowToCampaign(result.rows[0]) });
  }

  if (req.method === "PUT") {
    const cid = req.body.id;
    if (!cid) return res.status(400).json({ success: false, message: "Campaign ID required" });

    const existing = await pool.query(
      "SELECT * FROM campaigns WHERE id = $1 AND user_email = $2",
      [cid, email]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const current = existing.rows[0];
    const { name, status, budget, leads, targetLeads, description } = req.body;

    const newLeads = leads !== undefined ? parseInt(leads) : current.leads;
    const newTarget = targetLeads !== undefined ? parseInt(targetLeads) : current.target_leads;
    const conv = newLeads > 0 && newTarget > 0
      ? ((newLeads / newTarget) * 100).toFixed(1) + "%"
      : current.conv;
    const budgetNum = budget
      ? parseFloat(budget.replace(/[^0-9.]/g, "")) || 0
      : parseFloat(current.budget_num);

    const result = await pool.query(
      `UPDATE campaigns SET
        name = $1, status = $2, budget = $3, budget_num = $4,
        leads = $5, target_leads = $6, conv = $7, description = $8, updated_at = NOW()
       WHERE id = $9 AND user_email = $10 RETURNING *`,
      [
        name || current.name,
        status || current.status,
        budget || current.budget,
        budgetNum,
        newLeads,
        newTarget,
        conv,
        description !== undefined ? description : current.description,
        cid,
        email,
      ]
    );
    return res.json({ success: true, campaign: rowToCampaign(result.rows[0]) });
  }

  if (req.method === "DELETE") {
    const cid = req.body.id;
    if (!cid) return res.status(400).json({ success: false, message: "Campaign ID required" });
    await pool.query("DELETE FROM campaigns WHERE id = $1 AND user_email = $2", [cid, email]);
    return res.json({ success: true });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
