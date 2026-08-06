// src/components/dashboard/Settings.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { cn } from "../../lib/utils";

const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4",
        enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
      )}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
      />
    </button>
  </div>
);

export default function Settings({ user, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");

  const userRole = user?.isAdmin ? "Administrator" : "Member";

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: "",
    role: userRole,
    timezone: "UTC",
  });

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [notifs, setNotifs] = useState({
    emailCampaign: true, emailLeads: true, emailBilling: true,
    pushAlerts: false, securityAlerts: true,
    weeklyDigest: true, productUpdates: false, marketingTips: true,
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const teamHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-email": user?.email || "",
    "x-user-name": user?.name || "",
    "x-user-is-admin": String(!!user?.isAdmin),
  });

  const fetchTeam = async () => {
    if (!user?.email) return;
    setTeamLoading(true);
    try {
      const res = await fetch("/api/team", { headers: teamHeaders() });
      const data = await res.json();
      if (data.success) setTeamMembers(data.team);
    } catch {
      toast.error("Failed to load team");
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "team") fetchTeam();
  }, [activeTab]);

  const handleSaveProfile = () => {
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.email.includes("@")) return toast.error("Invalid email");
    const updatedUser = { ...user, name: formData.name, email: formData.email };
    if (onUserUpdate) onUserUpdate(updatedUser);
    else localStorage.setItem("user", JSON.stringify(updatedUser));
    toast.success("Profile saved successfully!");
  };

  const handleChangePassword = () => {
    if (!passwords.current) return toast.error("Enter your current password");
    if (passwords.newPass.length < 8) return toast.error("New password must be at least 8 characters");
    if (passwords.newPass !== passwords.confirm) return toast.error("Passwords do not match");
    setPasswords({ current: "", newPass: "", confirm: "" });
    toast.success("Password changed successfully!");
  };

  const handleInvite = async () => {
    if (!inviteEmail.includes("@")) return toast.error("Enter a valid email address");
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: teamHeaders(),
        body: JSON.stringify({ memberEmail: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (data.success) {
        setTeamMembers((prev) => [...prev, data.member]);
        setInviteEmail("");
        toast.success(`${inviteEmail} added to team!`);
      } else {
        toast.error(data.message || "Invite failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (id) => {
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: teamHeaders(),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success("Member removed");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  // ── SESSIONS ──────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const sessionHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-email": user?.email || "",
    "x-session-id": localStorage.getItem("sessionId") || "",
  });

  const fetchSessions = async () => {
    if (!user?.email) return;
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/sessions", { headers: sessionHeaders() });
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  const revokeSession = async (id) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: sessionHeaders(),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success("Session revoked");
      } else {
        toast.error(data.message || "Failed to revoke session");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "PUT",
        headers: sessionHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
        toast.success(`Signed out of ${data.count} other session${data.count !== 1 ? "s" : ""}`);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  // ── TWO-FACTOR AUTH ───────────────────────────────────────────────────
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [setupStep, setSetupStep] = useState(null); // null | "qr" | "verify"
  const [setupQR, setSetupQR] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableInput, setShowDisableInput] = useState(false);

  const twoFAHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-email": user?.email || "",
  });

  const fetch2FAStatus = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/2fa", { headers: twoFAHeaders() });
      const data = await res.json();
      if (data.success) setTwoFactor(data.enabled);
    } catch {}
  };

  const start2FASetup = async () => {
    setTwoFactorLoading(true);
    try {
      const res = await fetch("/api/2fa/setup", { method: "POST", headers: twoFAHeaders() });
      const data = await res.json();
      if (data.success) {
        setSetupQR(data.qrCode);
        setSetupSecret(data.secret);
        setSetupStep("qr");
      } else {
        toast.error(data.message || "Failed to start 2FA setup");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const verify2FASetup = async () => {
    if (setupCode.length !== 6) return toast.error("Enter the 6-digit code");
    setTwoFactorLoading(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: twoFAHeaders(),
        body: JSON.stringify({ code: setupCode }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFactor(true);
        setSetupStep(null);
        setSetupCode("");
        toast.success("2FA enabled successfully!");
      } else {
        toast.error(data.message || "Invalid code");
        setSetupCode("");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const disable2FA = async () => {
    if (disableCode.length !== 6) return toast.error("Enter your current 6-digit code");
    setTwoFactorLoading(true);
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: twoFAHeaders(),
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFactor(false);
        setShowDisableInput(false);
        setDisableCode("");
        toast.success("2FA disabled");
      } else {
        toast.error(data.message || "Invalid code");
        setDisableCode("");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "security") {
      fetchSessions();
      fetch2FAStatus();
    }
  }, [activeTab]);

  // ── REGISTERED USERS ─────────────────────────────────────────────────
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchUsers = async () => {
    if (!user?.isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-user-email": user.email },
      });
      const data = await res.json();
      if (data.success) setRegisteredUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  const tabs = [
    { id: "profile", name: "Account", icon: UserCircleIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "billing", name: "Plan & Billing", icon: CreditCardIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "team", name: "Team Members", icon: UserGroupIcon },
    ...(user?.isAdmin ? [{ id: "users", name: "Registered Users", icon: UsersIcon, adminBadge: true }] : []),
  ];

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400";

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Settings Nav */}
      <div className="w-full lg:w-64 shrink-0">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Settings</h2>
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap shrink-0 lg:w-full",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.name}</span>
              {tab.adminBadge && (
                <span className="ml-auto text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">ADMIN</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >

            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <div>
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-100 shrink-0">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Personal Information</h3>
                      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Update your profile and account details.</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Company</label>
                      <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timezone</label>
                      <select value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className={inputClass}>
                        <option>UTC+1 West Africa Time</option>
                        <option>UTC+0 Greenwich Mean Time</option>
                        <option>UTC-5 Eastern Time</option>
                        <option>UTC-8 Pacific Time</option>
                        <option>UTC+1 Central European Time</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</label>
                      <input type="text" value={formData.role} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setFormData({ name: user?.name || "", email: user?.email || "", company: "AdBOSS Marketing", role: "Administrator", timezone: "UTC+1 West Africa Time" })} className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Reset</button>
                    <button onClick={handleSaveProfile} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div>
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Security Settings</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">Manage your password and account security.</p>
                </div>
                <div className="p-8 space-y-8">
                  <div>
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">Change Password</h4>
                    <div className="space-y-4">
                      {[
                        { key: "current", label: "Current Password", show: showPass.current, toggle: () => setShowPass(p => ({ ...p, current: !p.current })), value: passwords.current, onChange: (v) => setPasswords(p => ({ ...p, current: v })) },
                        { key: "new", label: "New Password", show: showPass.new, toggle: () => setShowPass(p => ({ ...p, new: !p.new })), value: passwords.newPass, onChange: (v) => setPasswords(p => ({ ...p, newPass: v })) },
                        { key: "confirm", label: "Confirm New Password", show: showPass.confirm, toggle: () => setShowPass(p => ({ ...p, confirm: !p.confirm })), value: passwords.confirm, onChange: (v) => setPasswords(p => ({ ...p, confirm: v })) },
                      ].map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{field.label}</label>
                          <div className="relative">
                            <input
                              type={field.show ? "text" : "password"}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="••••••••"
                              className={inputClass + " pr-12"}
                            />
                            <button onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                              {field.show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      {passwords.newPass && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {["Length (8+)", "Uppercase", "Number", "Symbol"].map((req, i) => {
                            const checks = [passwords.newPass.length >= 8, /[A-Z]/.test(passwords.newPass), /[0-9]/.test(passwords.newPass), /[^A-Za-z0-9]/.test(passwords.newPass)];
                            return (
                              <span key={i} className={cn("text-[10px] font-bold px-2 py-1 rounded-full", checks[i] ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                                {checks[i] ? "✓ " : ""}{req}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <button onClick={handleChangePassword} className="mt-2 px-8 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-black text-sm hover:bg-blue-600 transition-all active:scale-95">Update Password</button>
                    </div>
                  </div>

                  {/* ── TWO-FACTOR AUTHENTICATION ── */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">Two-Factor Authentication</h4>

                    {/* Disabled → show enable button */}
                    {!twoFactor && setupStep === null && (
                      <div className="flex items-start justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl shrink-0 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            <ShieldCheckIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">2FA is Disabled</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Add an extra layer of security using your authenticator app.</p>
                          </div>
                        </div>
                        <button
                          onClick={start2FASetup}
                          disabled={twoFactorLoading}
                          className="shrink-0 px-4 py-2 rounded-xl font-black text-xs bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {twoFactorLoading ? "Loading…" : "Enable 2FA"}
                        </button>
                      </div>
                    )}

                    {/* Setup step 1: QR code */}
                    {setupStep === "qr" && (
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <ShieldCheckIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Scan QR Code</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Open Google Authenticator, Authy, or any TOTP app and scan this code.</p>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          {setupQR && <img src={setupQR} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2" />}
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Manual entry code</p>
                          <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 break-all">{setupSecret}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSetupStep("verify")}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95"
                          >
                            I've scanned it →
                          </button>
                          <button
                            onClick={() => { setSetupStep(null); setSetupQR(""); setSetupSecret(""); }}
                            className="px-4 py-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-bold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Setup step 2: verify code */}
                    {setupStep === "verify" && (
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">Enter the 6-digit code</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enter the code shown in your authenticator app to confirm setup.</p>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          value={setupCode}
                          onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full px-4 py-3 text-center text-2xl font-black tracking-[0.4em] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={verify2FASetup}
                            disabled={twoFactorLoading || setupCode.length !== 6}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {twoFactorLoading ? "Verifying…" : "Confirm & Enable"}
                          </button>
                          <button
                            onClick={() => setSetupStep("qr")}
                            className="px-4 py-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-bold transition-colors"
                          >
                            ← Back
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Enabled state */}
                    {twoFactor && (
                      <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <ShieldCheckIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">2FA is Enabled</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Your account is protected with an authenticator app.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDisableInput(!showDisableInput)}
                            className="shrink-0 px-4 py-2 rounded-xl font-black text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-95"
                          >
                            Disable 2FA
                          </button>
                        </div>
                        {showDisableInput && (
                          <div className="border-t border-emerald-100 dark:border-emerald-900/30 pt-3 space-y-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enter your current authenticator code to disable 2FA:</p>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="000000"
                              value={disableCode}
                              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="w-full px-4 py-2.5 text-center text-xl font-black tracking-[0.4em] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={disable2FA}
                              disabled={twoFactorLoading || disableCode.length !== 6}
                              className="w-full py-2 bg-red-600 text-white rounded-xl font-black text-sm hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {twoFactorLoading ? "Disabling…" : "Confirm Disable"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── ACTIVE SESSIONS ── */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Active Sessions</h4>
                      <div className="flex items-center gap-2">
                        {sessions.filter((s) => !s.isCurrent).length > 0 && (
                          <button
                            onClick={revokeAllOtherSessions}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Sign out all others
                          </button>
                        )}
                        <button onClick={fetchSessions} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <ArrowPathIcon className={cn("h-3.5 w-3.5", sessionsLoading && "animate-spin")} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {sessionsLoading ? (
                        <div className="flex justify-center py-6">
                          <ArrowPathIcon className="h-5 w-5 text-slate-400 animate-spin" />
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-sm">No session data yet. Log in again to start tracking sessions.</div>
                      ) : (
                        sessions.map((session) => {
                          const Icon = session.type === "mobile" ? DevicePhoneMobileIcon : ComputerDesktopIcon;
                          const timeAgo = (() => {
                            const diff = Date.now() - new Date(session.lastSeen).getTime();
                            const mins = Math.floor(diff / 60000);
                            if (mins < 2) return "Just now";
                            if (mins < 60) return `${mins} mins ago`;
                            const hrs = Math.floor(mins / 60);
                            if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
                            return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? "s" : ""} ago`;
                          })();

                          return (
                            <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{session.device}</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    {session.ip !== "Unknown" ? `${session.ip} · ` : ""}{timeAgo}
                                  </p>
                                </div>
                              </div>
                              {session.isCurrent ? (
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Active
                                </span>
                              ) : (
                                <button onClick={() => revokeSession(session.id)} className="text-xs font-bold text-red-500 hover:underline">Revoke</button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="border-t border-red-100 dark:border-red-900/30 pt-8">
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                    <div className="p-5 rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Delete Account</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Permanently delete your account and all data.</p>
                      </div>
                      <button onClick={() => toast.error("Please contact support to delete your account.")} className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-xs hover:bg-red-700 transition-all active:scale-95">Delete Account</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BILLING ── */}
            {activeTab === "billing" && (
              <div>
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Plan & Billing</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">Manage your subscription and payment details.</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-200">Current Plan</span>
                      <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full">Pro</span>
                    </div>
                    <div className="text-4xl font-black mb-1">$49<span className="text-lg font-bold text-blue-200">/mo</span></div>
                    <p className="text-blue-200 text-sm font-medium">Next billing: March 12, 2026</p>
                    <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4">
                      {[["Campaigns", "Unlimited"], ["Team seats", "5"], ["Storage", "50GB"]].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                          <p className="text-white font-black text-sm mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => toast.success("Redirecting to billing portal...")} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all group">
                      <p className="font-black text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage Subscription</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Upgrade, downgrade or cancel</p>
                    </button>
                    <button onClick={() => toast.success("Opening payment method editor...")} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-all group">
                      <p className="font-black text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Payment Method</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Visa ending in •••• 4242</p>
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Recent Invoices</h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      {[["Feb 12, 2026", "Pro Plan - Monthly", "$49.00"], ["Jan 12, 2026", "Pro Plan - Monthly", "$49.00"], ["Dec 12, 2025", "Pro Plan - Monthly", "$49.00"]].map(([date, desc, amount]) => (
                        <div key={date} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{desc}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{date}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-slate-900 dark:text-white text-sm">{amount}</span>
                            <button onClick={() => toast.success("Downloading invoice...")} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Download</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div>
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Notification Preferences</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">Choose what updates and alerts you receive.</p>
                </div>
                <div className="p-8 space-y-8">
                  {[
                    {
                      title: "Email Notifications",
                      items: [
                        { key: "emailCampaign", label: "Campaign updates", description: "Get notified when a campaign starts, pauses or ends" },
                        { key: "emailLeads", label: "New leads", description: "Receive an email each time a new lead is captured" },
                        { key: "emailBilling", label: "Billing & invoices", description: "Payment receipts and upcoming renewal reminders" },
                      ]
                    },
                    {
                      title: "Push Notifications",
                      items: [
                        { key: "pushAlerts", label: "Real-time alerts", description: "Instant alerts on your device for critical events" },
                        { key: "securityAlerts", label: "Security alerts", description: "Notify me of new logins and account changes" },
                      ]
                    },
                    {
                      title: "Reports & Digest",
                      items: [
                        { key: "weeklyDigest", label: "Weekly performance digest", description: "A summary of your campaigns sent every Monday" },
                        { key: "productUpdates", label: "Product updates", description: "New features and platform improvements" },
                        { key: "marketingTips", label: "Marketing tips", description: "Best practices and campaign optimization ideas" },
                      ]
                    }
                  ].map((group) => (
                    <div key={group.title}>
                      <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{group.title}</h4>
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/30 dark:bg-slate-800/20 px-5">
                        {group.items.map((item) => (
                          <Toggle
                            key={item.key}
                            enabled={notifs[item.key]}
                            onChange={(val) => setNotifs(n => ({ ...n, [item.key]: val }))}
                            label={item.label}
                            description={item.description}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <button onClick={() => toast.success("Notification preferences saved!")} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95">Save Preferences</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TEAM ── */}
            {activeTab === "team" && (
              <div>
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Team Members</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">
                      {teamLoading ? "Loading…" : `${teamMembers.length} member${teamMembers.length !== 1 ? "s" : ""} on your team`}
                    </p>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                    <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Add Team Member</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white"
                      >
                        <option>Editor</option>
                        <option>Viewer</option>
                        <option>Administrator</option>
                      </select>
                      <button
                        onClick={handleInvite}
                        disabled={inviting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shrink-0 disabled:opacity-60"
                      >
                        <PlusIcon className="h-4 w-4" />
                        {inviting ? "Adding…" : "Add Member"}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {teamLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-10 text-sm text-slate-400 dark:text-slate-500 font-medium">No team members yet.</div>
                    ) : teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              {member.name}
                              {member.email === user?.email && (
                                <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">YOU</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-full",
                            member.status === "Active" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          )}>
                            {member.status}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:block">{member.role}</span>
                          {!member.isOwner && member.email !== user?.email && (
                            <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-5">
                    <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3">Role Permissions</h4>
                    <div className="space-y-2">
                      {[
                        { role: "Administrator", desc: "Full access — manage campaigns, team, billing and settings." },
                        { role: "Editor", desc: "Can create and edit campaigns, view analytics and messages." },
                        { role: "Viewer", desc: "Read-only access to campaigns and analytics dashboards." },
                      ].map((r) => (
                        <div key={r.role} className="flex gap-3 items-start">
                          <CheckCircleIcon className="h-4 w-4 text-blue-400 dark:text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium"><span className="font-black text-slate-800 dark:text-slate-200">{r.role}:</span> {r.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin: Registered Users */}
            {activeTab === "users" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-blue-500" />
                      Registered Users
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                      All accounts registered on your AdBOSS site
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-black px-3 py-1 rounded-full">
                      {registeredUsers.length} total
                    </span>
                    <button onClick={fetchUsers} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <ArrowPathIcon className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : registeredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                    <UsersIcon className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {registeredUsers.map((u, i) => (
                      <div key={u.email} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${i === 0 ? "from-blue-500 to-indigo-600" : "from-slate-400 to-slate-600"} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                              {u.name || "—"}
                              {u.isAdmin && (
                                <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">ADMIN</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 pl-13 sm:pl-0">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${u.isVerified ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
                            {u.isVerified ? "Verified" : "Unverified"}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Unknown"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
