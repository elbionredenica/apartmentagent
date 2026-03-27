"use client";

import { SlidersHorizontal, PhoneCall, LayoutDashboard } from "lucide-react";
import { AnimateOnScroll } from "./AnimateOnScroll";

const steps = [
  {
    number: "1",
    icon: SlidersHorizontal,
    title: "Set Your Preferences",
    description:
      "Tell the agent your must-haves, deal-breakers, and nice-to-haves through a quick chat.",
  },
  {
    number: "2",
    icon: PhoneCall,
    title: "Agent Calls Listings",
    description:
      "It phones each listing, asks your specific questions, and records the answers.",
  },
  {
    number: "3",
    icon: LayoutDashboard,
    title: "Review & Book",
    description:
      "See a ranked dashboard of results and book viewings for the ones worth your time.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-6 md:px-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <AnimateOnScroll className="text-center mb-14">
          <h2 className="text-xl font-bold text-ink mb-3">How It Works</h2>
          <p className="text-base text-ink-mid">
            Three steps from search to scheduled viewing.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border" />

          {steps.map((step, i) => (
            <AnimateOnScroll
              key={step.number}
              delay={i * 0.15}
              className="flex flex-col items-center text-center relative"
            >
              {/* Number circle */}
              <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold mb-4 relative z-10">
                {step.number}
              </div>

              <step.icon size={20} className="text-ink-mid mb-3" />

              <h3 className="text-md font-semibold text-ink mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-ink-mid leading-relaxed max-w-xs">
                {step.description}
              </p>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
