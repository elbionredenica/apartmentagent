"use client";

import { useState } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export function LoginClient() {
  const router = useTransitionRouter();
  const [loading, setLoading] = useState(false);

  async function handleDemoEntry() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/load", { method: "POST" });
      if (!res.ok) throw new Error("Failed to load demo");
      router.push("/chat");
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="bg-white">
      <HeroSection onDemoEntry={handleDemoEntry} loading={loading} />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection onDemoEntry={handleDemoEntry} loading={loading} />
      <Footer />
    </main>
  );
}
