// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  MegaphoneIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "./dashboard/Sidebar";
import Home from "./dashboard/Home";
import Settings from "./dashboard/Settings";
import Campaigns from "./dashboard/Campaigns";
import Messages from "./dashboard/Messages";
import { About } from "./Legal";
import { useTheme } from "../context/ThemeContext";

const mobileNavItems = [
  { id: "overview", name: "Home", icon: Squares2X2Icon },
  { id: "campaigns", name: "Campaigns", icon: MegaphoneIcon },
  { id: "messages", name: "Messages", icon: EnvelopeIcon },
  { id: "settings", name: "Settings", icon: Cog6ToothIcon },
];

function notifsKey(email) {
  return `notifs_${(email || "").toLowerCase()}`;
}

function loadNotifs(email) {
  if (!email) return [];
  try {
    const raw = localStorage.getItem(notifsKey(email));
    if (raw) return JSON.parse(raw);
  } catch {}
  // First time: welcome notification only
  const welcome = [
    {
      id: Date.now(),
      title: "Welcome to AdBOSS! Create your first campaign to get started.",
      time: "just now",
      color: "bg-blue-500",
      read: false,
    },
  ];
  localStorage.setItem(notifsKey(email), JSON.stringify(welcome));
  return welcome;
}

function saveNotifs(email, notifs) {
  if (!email) return;
  localStorage.setItem(notifsKey(email), JSON.stringify(notifs));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => loadNotifs(user?.email));
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const unreadMessages = React.useMemo(() => {
    try {
      const key = `adboss_messages_${(user?.email || "guest").toLowerCase()}`;
      const stored = localStorage.getItem(key);
      if (!stored) return 1; // welcome message is unread by default
      const msgs = JSON.parse(stored);
      return Array.isArray(msgs) ? msgs.filter((m) => m.unread).length : 0;
    } catch {
      return 0;
    }
  }, [activeTab, user?.email]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-10 bg-white dark:bg-slate-900 shadow-xl rounded-3xl max-w-md border border-slate-100 dark:border-slate-800 w-full"
        >
          <div className="h-16 w-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">You need to be logged in to access the marketing dashboard.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Login to AdBOSS
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={switchTab} onLogout={() => setShowLogoutModal(true)} user={user} unreadMessages={unreadMessages} />

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 lg:hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-black text-lg">AdBOSS</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {[
                  { id: "overview", name: "Overview", icon: Squares2X2Icon },
                  { id: "campaigns", name: "Campaigns", icon: MegaphoneIcon },
                  { id: "messages", name: "Messages", icon: EnvelopeIcon, badge: unreadMessages },
                  { id: "settings", name: "Settings", icon: Cog6ToothIcon },
                  { id: "about", name: "About AdBoss", icon: InformationCircleIcon },
                ].map((item) => (
                  <button key={item.id} onClick={() => switchTab(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                      activeTab === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="px-3 py-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-slate-800/60">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{user.name}</p>
                    <p className="text-slate-500 text-[10px] truncate">{user.email}</p>
                  </div>
                </div>
                <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-semibold text-sm">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="relative hidden md:block">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns, messages..."
                className="w-72 pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {dark ? <SunIcon className="h-5 w-5 text-amber-400" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => setNotifs((prev) => { const updated = prev.map((n) => ({ ...n, read: true })); saveNotifs(user?.email, updated); return updated; })}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-80 overflow-y-auto">
                        {notifs.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => setNotifs((prev) => { const updated = prev.map((x) => x.id === n.id ? { ...x, read: true } : x); saveNotifs(user?.email, updated); return updated; })}
                            className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}
                          >
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-slate-300 dark:bg-slate-700" : n.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold leading-snug ${n.read ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
                                {n.title}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{n.time}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => { switchTab("messages"); setNotifOpen(false); }}
                          className="w-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline text-center"
                        >
                          View all messages →
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
            <button onClick={() => switchTab("settings")} className="flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-2 py-1.5 transition-colors cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && <Home key="overview" user={user} setActiveTab={switchTab} />}
            {activeTab === "campaigns" && <Campaigns key="campaigns" user={user} />}
            {activeTab === "messages" && <Messages key="messages" user={user} />}
            {activeTab === "settings" && <Settings key="settings" user={user} onUserUpdate={handleUserUpdate} />}
            {activeTab === "about" && <About key="about" onGetStarted={() => switchTab("campaigns")} />}
          </AnimatePresence>
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.15 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowRightOnRectangleIcon className="h-7 w-7 text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Sign out?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                You'll need to log back in to access your dashboard.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-2 transition-colors duration-300">
        {mobileNavItems.map((item) => (
          <button key={item.id} onClick={() => switchTab(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-1 ${
              activeTab === item.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-bold">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
