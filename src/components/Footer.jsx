// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-2xl font-black text-blue-400 mb-3 block">AdBOSS</Link>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-5">
              The modern marketing platform for SaaS founders, agencies, and growth teams.
            </p>
            <div className="flex gap-3">
              <a href="mailto:info.adboss@gmail.com" className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Email us">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
              <a href="https://x.com/adbossng?s=21" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all" title="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/solomon-nwapa-96a540269?trk=contact-info" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all" title="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-5">Product</h4>
            <ul className="space-y-3">
              {[
                { label: "Features", to: "/?scrollTo=features" },
                { label: "Pricing", to: "/pricing" },
                { label: "Dashboard", to: "/dashboard" },
                { label: "Register", to: "/register" },
                { label: "Login", to: "/login" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", to: "/about" },
                { label: "Testimonials", to: "/?scrollTo=testimonials" },
                { label: "Contact", to: "/?scrollTo=contact" },
                { label: "Support", to: "/?scrollTo=contact" },
              ].map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <a href={l.href} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">{l.label}</a>
                  ) : (
                    <Link to={l.to} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-5">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms of Service", to: "/terms" },
                { label: "Cookie Policy", to: "/privacy#cookies" },
                { label: "GDPR", to: "/privacy#gdpr" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-3 bg-slate-800 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Contact</p>
              <a href="mailto:info.adboss@gmail.com" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors break-all">
                info.adboss@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs font-medium">
            &copy; {year} AdBOSS. All rights reserved. Built with ❤️ for marketers worldwide.
          </p>
          <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link to="/about" className="hover:text-slate-300 transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
