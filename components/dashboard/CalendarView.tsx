"use client";

import { useState, useMemo } from "react";
import type { Viewing } from "@/types";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarEvent } from "./CalendarEvent";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar as CalendarIcon } from "lucide-react";

interface CalendarViewProps {
  viewings: Viewing[];
  onEventClick: (viewing: Viewing) => void;
}

const HOURS_START = 8;
const HOURS_END = 20;
const HOUR_HEIGHT = 60; // px per hour row
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayHeader(weekStart: Date, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return `${d.getDate()}`;
}

export function CalendarView({ viewings, onEventClick }: CalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);

  // Filter viewings to this week
  const weekViewings = useMemo(() => {
    return viewings.filter((v) => {
      const d = new Date(v.scheduledAt);
      return d >= weekStart && d < weekEnd;
    });
  }, [viewings, weekStart, weekEnd]);

  // Group viewings by day-of-week index (0=Mon)
  const viewingsByDay = useMemo(() => {
    const map: Record<number, Viewing[]> = {};
    for (const v of weekViewings) {
      const d = new Date(v.scheduledAt);
      const day = d.getDay();
      const dayIndex = day === 0 ? 6 : day - 1; // Convert to Mon=0
      if (!map[dayIndex]) map[dayIndex] = [];
      map[dayIndex].push(v);
    }
    return map;
  }, [weekViewings]);

  function handlePrev() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function handleNext() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  function handleToday() {
    setWeekStart(getMonday(new Date()));
  }

  const hours = Array.from(
    { length: HOURS_END - HOURS_START },
    (_, i) => HOURS_START + i
  );

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader
        weekStart={weekStart}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-white z-10">
          <div className="border-r border-border" /> {/* Time gutter */}
          {DAYS.map((day, i) => (
            <div
              key={day}
              className="py-2 text-center border-r border-border last:border-r-0"
            >
              <p className="text-xs font-medium text-ink-muted">{day}</p>
              <p className="text-sm font-semibold text-ink">
                {formatDayHeader(weekStart, i)}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)] relative"
          style={{ height: hours.length * HOUR_HEIGHT }}
        >
          {/* Hour labels + grid lines */}
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="col-span-full grid grid-cols-[60px_repeat(7,1fr)] border-b border-border"
              style={{
                position: "absolute",
                top: i * HOUR_HEIGHT,
                left: 0,
                right: 0,
                height: HOUR_HEIGHT,
              }}
            >
              <div className="border-r border-border pr-2 pt-1 text-right">
                <span className="text-xs text-ink-muted">
                  {hour === 12
                    ? "12 PM"
                    : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`}
                </span>
              </div>
              {DAYS.map((day) => (
                <div key={day} className="border-r border-border last:border-r-0" />
              ))}
            </div>
          ))}

          {/* Events overlay */}
          {DAYS.map((_, dayIndex) => {
            const dayViewings = viewingsByDay[dayIndex] ?? [];
            return dayViewings.map((viewing) => {
              const d = new Date(viewing.scheduledAt);
              const hour = d.getHours() + d.getMinutes() / 60;
              const top = (hour - HOURS_START) * HOUR_HEIGHT;
              const height =
                (viewing.durationMinutes / 60) * HOUR_HEIGHT;

              // Column positioning: skip the 60px time gutter
              const colWidth = `calc((100% - 60px) / 7)`;
              const left = `calc(60px + ${dayIndex} * ${colWidth})`;

              return (
                <div
                  key={viewing.id}
                  className="absolute"
                  style={{
                    top,
                    left,
                    width: colWidth,
                    height,
                    padding: "0 2px",
                  }}
                >
                  <CalendarEvent
                    viewing={viewing}
                    onClick={() => onEventClick(viewing)}
                  />
                </div>
              );
            });
          })}
        </div>

        {weekViewings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <EmptyState
              icon={CalendarIcon}
              message="No viewings booked yet"
            />
          </div>
        )}
      </div>
    </div>
  );
}
