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
          Try the demo — set your preferences and watch the agent work.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onDemoEntry} disabled={loading}>
            <span className="flex items-center gap-2">
              {loading ? "Loading..." : "Try the Demo"}
              {!loading && <ArrowRight size={16} />}
            </span>
          </Button>
          <div className="relative group">
            <Button variant="secondary" disabled>
              Continue with Auth0
            </Button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-muted whitespace-nowrap">
              Coming soon
            </div>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
