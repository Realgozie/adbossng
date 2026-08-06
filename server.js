import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import registerHandler from "./api/register.js";
import contactHandler from "./api/contact.js";
import loginHandler from "./api/login.js";
import campaignsHandler from "./api/campaigns.js";
import adminHandler from "./api/admin.js";
import teamHandler from "./api/team.js";
import sessionsHandler from "./api/sessions.js";
import twoFAHandler from "./api/2fa.js";
import { forgotPasswordHandler, resetPasswordHandler } from "./api/forgot-password.js";
import verifyEmailHandler from "./api/verify-email.js";
import stripeHandler from "./api/stripe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Stripe webhook MUST be registered before express.json() to receive raw Buffer
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
  req._stripeAction = "webhook";
  stripeHandler(req, res);
});

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

// Auth
app.post("/api/register", registerHandler);
app.post("/api/login", loginHandler);
app.get("/api/verify-email", verifyEmailHandler);

// Forgot / Reset password
app.post("/api/forgot-password", forgotPasswordHandler);
app.post("/api/reset-password", resetPasswordHandler);

// Campaigns (per-user)
app.get("/api/campaigns", campaignsHandler);
app.post("/api/campaigns", campaignsHandler);
app.put("/api/campaigns", campaignsHandler);
app.delete("/api/campaigns", campaignsHandler);

// Team (per-user)
app.get("/api/team", teamHandler);
app.post("/api/team", teamHandler);
app.put("/api/team", teamHandler);
app.delete("/api/team", teamHandler);

// Sessions (per-user)
app.get("/api/sessions", sessionsHandler);
app.delete("/api/sessions", sessionsHandler);
app.put("/api/sessions", sessionsHandler);

// Two-Factor Authentication
// Express 4 does NOT catch rejected promises from route callbacks — wrap every
// async handler so unhandled errors always return JSON instead of hanging.
function asyncRoute(action, handler) {
  return (req, res) => {
    req._action = action;
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error(`[2FA ${action} error]`, err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    });
  };
}
app.get("/api/2fa",         asyncRoute("status",  twoFAHandler));
app.post("/api/2fa/setup",  asyncRoute("setup",   twoFAHandler));
app.post("/api/2fa/verify", asyncRoute("verify",  twoFAHandler));
app.post("/api/2fa/disable",asyncRoute("disable", twoFAHandler));
app.post("/api/2fa/check",  asyncRoute("check",   twoFAHandler));

// Contact form
app.post("/api/contact", contactHandler);

// Admin
app.get("/api/admin/users", adminHandler);

// Stripe
app.get("/api/stripe/config", (req, res) => { req._stripeAction = "config"; stripeHandler(req, res); });
app.post("/api/stripe/checkout", (req, res) => { req._stripeAction = "checkout"; stripeHandler(req, res); });
app.get("/api/stripe/subscription", (req, res) => { req._stripeAction = "subscription"; stripeHandler(req, res); });
app.post("/api/stripe/portal", (req, res) => { req._stripeAction = "portal"; stripeHandler(req, res); });

// Serve frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
