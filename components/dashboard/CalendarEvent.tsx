"use client";

import type { Viewing } from "@/types";

interface CalendarEventProps {
  viewing: Viewing;
  onClick: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CalendarEvent({ viewing, onClick }: CalendarEventProps) {
  return (
    <button
      onClick={onClick}
      className="absolute left-0.5 right-0.5 bg-accent-light border border-accent/20 rounded-md px-2 py-1 text-left overflow-hidden hover:shadow-sm transition-shadow duration-160 cursor-pointer"
      style={{
        // Positioned by parent grid
      }}
    >
      <p className="text-xs font-medium text-accent truncate">
        {viewing.address ?? "Viewing"}
      </p>
      <p className="text-xs text-ink-mid truncate">
        {formatTime(viewing.scheduledAt)}
      </p>
      {viewing.propertyManager && (
        <p className="text-xs text-ink-muted truncate">
          {viewing.propertyManager}
        </p>
      )}
    </button>
  );
}
