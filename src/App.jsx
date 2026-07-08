import React from "react";
import { HashRouter as BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import ThankYou from "./pages/ThankYou";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ResetPassword from "./components/ResetPassword";
import GlobalErrorBoundary from "./components/dashboard/ErrorBoundary";
import Pricing from "./components/Pricing";
import CheckoutSuccess from "./components/CheckoutSuccess";
import CheckoutCancel from "./components/CheckoutCancel";
import NotFound from "./components/NotFound";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";

import { PrivacyPolicy, TermsOfService, About } from "./components/Legal";

export default function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster position="top-right" reverseOrder={false} />
        <CookieBanner />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}
