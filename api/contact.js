import { sendMail } from "../lib/mailer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body || {};
  if (!name?.trim() || !email?.includes("@") || !message?.trim()) {
    return res.status(400).json({ success: false, message: "Please fill in all required fields." });
  }

  const subjectLine = subject?.trim()
    ? `[AdBOSS Contact] ${subject.trim()}`
    : `[AdBOSS Contact] Message from ${name.trim()}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <div style="background:#2563eb;border-radius:12px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:20px;">✦</span>
        </div>
        <h1 style="margin:0;color:#1e293b;font-size:22px;">AdBOSS</h1>
      </div>
      <h2 style="color:#1e293b;margin-bottom:4px;">New Contact Message</h2>
      <p style="color:#64748b;font-size:13px;margin-bottom:24px;">Someone submitted the contact form on your website.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 16px;font-weight:bold;color:#475569;width:100px;font-size:13px;">Name</td>
          <td style="padding:12px 16px;color:#1e293b;font-size:14px;">${name}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 16px;font-weight:bold;color:#475569;font-size:13px;">Email</td>
          <td style="padding:12px 16px;font-size:14px;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td>
        </tr>
        ${subject ? `<tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 16px;font-weight:bold;color:#475569;font-size:13px;">Subject</td>
          <td style="padding:12px 16px;color:#1e293b;font-size:14px;">${subject}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 16px;font-weight:bold;color:#475569;vertical-align:top;font-size:13px;">Message</td>
          <td style="padding:12px 16px;color:#1e293b;font-size:14px;white-space:pre-wrap;">${message}</td>
        </tr>
      </table>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Reply directly to this email to respond to ${name}.</p>
    </div>
  `;

  const sent = await sendMail({
    to: "info.adboss@gmail.com",
    subject: subjectLine,
    html,
    replyTo: email,
  });

  if (sent) {
    return res.json({ success: true, message: "Message sent!" });
  } else {
    return res.status(503).json({
      success: false,
      message: "Email service not configured. Please email us directly at info.adboss@gmail.com",
    });
  }
}
