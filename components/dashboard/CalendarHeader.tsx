"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", opts);
  const endStr = end.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${startStr} - ${endStr}`;
}

export function CalendarHeader({
  weekStart,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border">
      <h2 className="text-lg font-semibold text-ink">
        {formatWeekRange(weekStart)}
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm text-ink-mid border border-border rounded-md hover:border-ink-mid transition-colors duration-160 cursor-pointer"
        >
          Today
        </button>
        <button
          onClick={onPrev}
          className="p-1.5 rounded-md hover:bg-off-white transition-colors duration-160 cursor-pointer"
        >
          <ChevronLeft size={20} className="text-ink-mid" />
        </button>
        <button
          onClick={onNext}
          className="p-1.5 rounded-md hover:bg-off-white transition-colors duration-160 cursor-pointer"
        >
          <ChevronRight size={20} className="text-ink-mid" />
        </button>
      </div>
    </div>
  );
}
