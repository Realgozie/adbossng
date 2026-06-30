import nodemailer from "nodemailer";

const configured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const FROM = process.env.EMAIL_USER
  ? `"AdBOSS" <${process.env.EMAIL_USER}>`
  : '"AdBOSS" <noreply@adboss.com>';

export async function sendMail({ to, subject, html, replyTo }) {
  if (!transporter) {
    console.log(`[MAIL SKIPPED — configure EMAIL_USER & EMAIL_PASS] To: ${to} | Subject: ${subject}`);
    return false;
  }
  try {
    const mailOptions = { from: FROM, to, subject, html };
    if (replyTo) mailOptions.replyTo = replyTo;
    await transporter.sendMail(mailOptions);
    console.log(`[MAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error("[MAIL ERROR]", err.message);
    return false;
  }
}

export function isEmailConfigured() {
  return configured;
}
