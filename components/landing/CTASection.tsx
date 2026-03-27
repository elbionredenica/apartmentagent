"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimateOnScroll } from "./AnimateOnScroll";

interface CTASectionProps {
  onDemoEntry: () => void;
  loading: boolean;
}

export function CTASection({ onDemoEntry, loading }: CTASectionProps) {
  return (
    <section className="py-20 px-6 md:px-20 bg-white">
      <AnimateOnScroll className="max-w-xl mx-auto text-center">
        <h2 className="text-xl font-bold text-ink mb-4">
          Ready to let AI handle the phone calls?
        </h2>
        <p className="text-base text-ink-mid mb-8">
          Create a real account to save your place, or take the demo path for a quick walkthrough.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/auth/login?screen_hint=signup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 text-base font-semibold text-white transition-all duration-160 hover:bg-accent-dark"
          >
            Sign Up
            <ArrowRight size={16} />
          </a>
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md border-[1.5px] border-border px-6 py-3.5 text-base font-semibold text-ink transition-all duration-160 hover:border-ink-mid"
          >
            Log In
          </a>
          <Button onClick={onDemoEntry} disabled={loading} variant="ghost">
            {loading ? "Loading demo..." : "Try Demo"}
          </Button>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
