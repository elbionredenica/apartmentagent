"use client";

import { Phone, ClipboardCheck, CalendarCheck } from "lucide-react";
import { AnimateOnScroll } from "./AnimateOnScroll";

const features = [
  {
    icon: Phone,
    title: "Calls Every Listing",
    description:
      "Our AI agent phones landlords and agencies, so you never have to play phone tag again.",
  },
  {
    icon: ClipboardCheck,
    title: "Asks Your Questions",
    description:
      "Pets allowed? Parking included? Laundry in-unit? It asks exactly what matters to you.",
  },
  {
    icon: CalendarCheck,
    title: "Books Only the Best",
    description:
      "Only schedules viewings for apartments that pass your filters — no more wasted Saturdays.",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-off-white py-20 px-6 md:px-20">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll className="text-center mb-12">
          <h2 className="text-xl font-bold text-ink mb-3">
            Everything you hate about apartment hunting, automated
          </h2>
          <p className="text-base text-ink-mid max-w-xl mx-auto">
            Set your criteria once and let the agent do the rest.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <AnimateOnScroll key={feature.title} delay={i * 0.1}>
              <div className="bg-white rounded-xl border border-border p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={22} className="text-accent" />
                </div>
                <h3 className="text-md font-semibold text-ink mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-ink-mid leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
