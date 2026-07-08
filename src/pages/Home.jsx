import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Contact from "../components/Contact";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const target = searchParams.get("scrollTo");
    if (!target) return;
    const scroll = () => {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const timer = setTimeout(scroll, 80);
    setSearchParams({}, { replace: true });
    return () => clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
      <CTA />
      <Contact />
    </>
  );
}