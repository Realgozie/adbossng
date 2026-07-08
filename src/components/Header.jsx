// src/components/Header.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hideHeaderRoutes = ["/dashboard"];
  if (hideHeaderRoutes.includes(location.pathname)) return null;

  const navLinks = [
    { label: "Features", to: "/?scrollTo=features" },
    { label: "Testimonials", to: "/?scrollTo=testimonials" },
    { label: "Pricing", to: "/pricing" },
    { label: "About", to: "/about" },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-slate-800/30 px-4 py-3 flex justify-between items-center transition-colors duration-300 relative z-40">
      <Link to="/" className="text-2xl font-black text-blue-600">
        AdBOSS
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {l.label}
          </Link>
        ))}
        <Link
          to="/login"
          className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
        >
          Get Started
        </Link>
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          {dark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
      </nav>

      {/* Mobile controls */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          {dark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-lg md:hidden z-50 px-4 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors">Login</Link>
          <Link to="/register" onClick={() => setMobileOpen(false)} className="mt-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all text-center">
            Get Started Free
          </Link>
        </div>
      )}
    </header>
  );
}
