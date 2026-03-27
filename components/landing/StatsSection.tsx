"use client";

import { AnimateOnScroll } from "./AnimateOnScroll";

const stats = [
  { value: "120+", label: "Hours saved per search" },
  { value: "85%", label: "Bad viewings eliminated" },
  { value: "30s", label: "Average setup time" },
];

export function StatsSection() {
  return (
    <section className="bg-accent py-14 px-6 md:px-20">
      <AnimateOnScroll>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-around gap-8 md:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-[40px] font-bold text-white leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </section>
  );
}
