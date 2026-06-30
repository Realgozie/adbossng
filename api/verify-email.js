import { getPool, initDb } from "./db.js";

export default async function handler(req, res) {
  await initDb();
  const pool = getPool();

  const { token, email } = req.query;
  if (!token || !email) {
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2 style="color:#ef4444;">Invalid verification link.</h2>
      <a href="/">Go to AdBOSS</a></body></html>`);
  }

  const normalEmail = decodeURIComponent(email).toLowerCase().trim();

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [normalEmail]);
    const user = result.rows[0];

    if (!user || user.verify_token !== token) {
      return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2 style="color:#ef4444;">Invalid or expired verification link.</h2>
        <a href="/">Go to AdBOSS</a></body></html>`);
    }

    if (user.is_verified) {
      return res.redirect("/#/login?verified=already");
    }

    await pool.query(
      "UPDATE users SET is_verified = TRUE, verify_token = NULL WHERE email = $1",
      [normalEmail]
    );

    return res.redirect("/#/login?verified=true");
  } catch (err) {
    console.error("Verify email error:", err);
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2 style="color:#ef4444;">Server error. Please try again.</h2></body></html>`);
  }
}
