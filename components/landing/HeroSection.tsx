"use client";

import { motion } from "motion/react";
import {
  Home,
  ChevronDown,
  ArrowRight,
  Phone,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeroSectionProps {
  onDemoEntry: () => void;
  loading: boolean;
}

export function HeroSection({ onDemoEntry, loading }: HeroSectionProps) {
  function scrollToHowItWorks() {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="min-h-screen flex items-center bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-20 w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center py-20">
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-light text-accent text-sm font-medium mb-6">
            AI-Powered Apartment Search
          </span>

          <h1 className="text-2xl md:text-[42px] font-bold text-ink leading-tight mb-5">
            Stop wasting weekends on bad apartment viewings
          </h1>

          <p className="text-md text-ink-mid leading-relaxed mb-8 max-w-lg">
            Scout calls listings for you, asks your deal-breaker
            questions, and only books viewings that actually match what you need.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/auth/login?screen_hint=signup"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 text-base font-semibold text-white transition-all duration-160 hover:bg-accent-dark"
            >
              Sign Up with Auth0
              <ArrowRight size={16} />
            </a>
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md border-[1.5px] border-border px-6 py-3.5 text-base font-semibold text-ink transition-all duration-160 hover:border-ink-mid"
            >
              Log In
            </a>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <Button onClick={onDemoEntry} disabled={loading} variant="ghost">
              <span className="flex items-center gap-2">
                {loading ? "Loading demo..." : "Try Demo Instead"}
              </span>
            </Button>
            <Button variant="secondary" onClick={scrollToHowItWorks}>
              See How It Works
            </Button>
          </div>
        </motion.div>

        {/* Right column — mock call card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="hidden md:block"
        >
          <div className="bg-white rounded-xl border border-border shadow-lg p-6 max-w-sm ml-auto">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
                <Phone size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Agent Call in Progress</p>
                <p className="text-xs text-ink-muted">1847 Mission St — 2BR/1BA</p>
              </div>
            </div>

            {/* Mock transcript lines */}
            <div className="space-y-3">
              <TranscriptLine role="agent" text="Hi, I'm calling about the 2-bedroom on Mission St. Is it still available?" />
              <TranscriptLine role="landlord" text="Yes it is! We have showings this weekend." />
              <TranscriptLine role="agent" text="Great. Does the unit allow small dogs under 25 lbs?" />
              <TranscriptLine role="landlord" text="We do allow dogs with a pet deposit." />
              <TranscriptLine role="agent" text="Perfect. Is there in-unit laundry?" />
            </div>

            {/* Extracted info */}
            <div className="mt-5 pt-4 border-t border-border space-y-2">
              <ExtractedItem label="Pets allowed" check />
              <ExtractedItem label="Pet deposit required" check />
              <ExtractedItem label="Availability confirmed" check />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <ChevronDown size={24} className="text-ink-muted" />
      </motion.div>
    </section>
  );
}

function TranscriptLine({ role, text }: { role: "agent" | "landlord"; text: string }) {
  const isAgent = role === "agent";
  return (
    <div className={`flex gap-2 ${isAgent ? "" : "flex-row-reverse"}`}>
      <div
        className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
          isAgent
            ? "bg-accent-light text-ink"
            : "bg-off-white text-ink"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function ExtractedItem({ label, check }: { label: string; check?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-mid">
      {check && <CheckCircle size={14} className="text-success" />}
      {label}
    </div>
  );
}
