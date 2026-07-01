import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const verified = params.get("verified");
  const registered = params.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [pending2FAEmail, setPending2FAEmail] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");

  // 5-minute inactivity timeout — redirect to home
  useEffect(() => {
    const TIMEOUT = 5 * 60 * 1000;
    let timer = setTimeout(() => navigate("/"), TIMEOUT);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => navigate("/"), TIMEOUT);
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.sessionId) localStorage.setItem("sessionId", data.sessionId);
        navigate("/dashboard");
      } else if (data.requires2FA) {
        setPending2FAEmail(data.email);
        setRequires2FA(true);
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (totpCode.replace(/\s/g, "").length !== 6) return setTotpError("Enter the 6-digit code from your authenticator app.");
    setTotpLoading(true);
    setTotpError("");
    try {
      const res = await fetch("/api/2fa/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode.replace(/\s/g, ""), loginEmail: pending2FAEmail }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.sessionId) localStorage.setItem("sessionId", data.sessionId);
        navigate("/dashboard");
      } else {
        setTotpError(data.message || "Invalid code.");
        setTotpCode("");
      }
    } catch {
      setTotpError("Something went wrong. Please try again.");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.includes("@")) return;
    setForgotLoading(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSuccess(true);
    } catch {
      setForgotSuccess(true); // Always show success to avoid enumeration
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotSuccess(false);
    setForgotLoading(false);
  };

  // 2FA verification screen
  if (requires2FA) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 dark:from-slate-950 dark:to-slate-900 p-6 transition-colors duration-300">
        <form
          onSubmit={handle2FASubmit}
          className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-transparent dark:border-slate-800"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Two-Factor Auth</h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              Enter the 6-digit code from your authenticator app for<br />
              <span className="font-bold text-slate-600 dark:text-slate-300">{pending2FAEmail}</span>
            </p>
          </div>

          {totpError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold px-4 py-3 rounded-xl border border-red-200 dark:border-red-900">
              {totpError}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full px-4 py-4 text-center text-3xl font-black tracking-[0.4em] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors mb-4"
            autoFocus
            required
          />

          <button
            type="submit"
            disabled={totpLoading || totpCode.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold transition-all disabled:opacity-50 mb-3"
          >
            {totpLoading ? "Verifying…" : "Verify Code"}
          </button>
          <button
            type="button"
            onClick={() => { setRequires2FA(false); setTotpCode(""); setTotpError(""); }}
            className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            ← Back to Login
          </button>
        </form>
      </section>
    );
  }

  return (
    <>
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 dark:from-slate-950 dark:to-slate-900 p-6 transition-colors duration-300">
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-transparent dark:border-slate-800"
        >
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-white">Welcome back</h2>
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm mb-6">Login to your AdBOSS dashboard</p>

          {registered === "true" && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              ✓ Account created! You can now log in.
            </div>
          )}
          {verified === "true" && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              ✓ Email verified! You can now log in.
            </div>
          )}
          {verified === "already" && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
              Your email is already verified. Please log in.
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold px-4 py-3 rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-slate-400 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-2.5 pr-11 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-slate-400 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-all disabled:opacity-60 active:scale-95"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
              Register
            </Link>
          </p>
        </form>
      </section>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeForgot} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-slate-200 dark:border-slate-800">
            {forgotSuccess ? (
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✉️</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Check your inbox</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  If <span className="font-bold text-slate-700 dark:text-slate-300">{forgotEmail}</span> is registered, we sent a reset link to that address.
                </p>
                <button
                  onClick={closeForgot}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Forgot password?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-slate-400 transition-colors"
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-60"
                  >
                    {forgotLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="w-full py-2.5 text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
