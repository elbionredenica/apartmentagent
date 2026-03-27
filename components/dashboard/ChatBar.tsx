"use client";

import { useState } from "react";
import type { ListingCard } from "@/types";
import { MessageSquare, X } from "lucide-react";

interface ChatBarProps {
  listings: ListingCard[];
}

export function ChatBar({ listings }: ChatBarProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCalls = listings.filter((l) =>
    ["prescreening", "deepscreening", "queued_for_prescreen", "queued_for_deepscreen"].includes(
      l.status
    )
  ).length;

  const booked = listings.filter((l) => l.status === "booked").length;
  const unreachable = listings.filter(
    (l) => l.status === "voicemail_pending"
  ).length;

  const isDone = activeCalls === 0 && listings.length > 0;

  const statusText = isDone
    ? `Done \u00b7 ${booked} viewing${booked !== 1 ? "s" : ""} booked${
        unreachable > 0
          ? ` \u00b7 ${unreachable} listing${unreachable !== 1 ? "s" : ""} couldn't be reached`
          : ""
      }`
    : `Agent is working \u00b7 ${activeCalls} call${activeCalls !== 1 ? "s" : ""} remaining \u00b7 Refine criteria?`;

  return (
    <>
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-border px-6 flex items-center gap-3 hover:bg-off-white transition-colors duration-160 z-40 cursor-pointer"
      >
        <MessageSquare size={16} className="text-accent shrink-0" />
        <span className="text-sm text-ink-mid">{statusText}</span>
      </button>

      {/* Expanded overlay */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-ink">
              Chat with Agent
            </h2>
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-md hover:bg-off-white transition-colors duration-160 cursor-pointer"
            >
              <X size={20} className="text-ink-mid" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-ink-muted">
              Chat overlay — coming in full integration
            </p>
          </div>
        </div>
      )}
    </>
  );
}
