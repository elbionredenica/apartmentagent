"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

interface PreferenceCardProps {
  icon: LucideIcon;
  category: string;
  value: string;
  confirmed?: boolean;
}

export function PreferenceCard({
  icon: Icon,
  category,
  value,
  confirmed = false,
}: PreferenceCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md border border-border animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mt-0.5">
        <Icon size={18} className="text-ink-mid" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
          {category}
        </p>
        <p className="text-sm font-medium text-ink mt-0.5">{value}</p>
      </div>
      {confirmed && (
        <div className="mt-0.5">
          <Check size={16} className="text-success" />
        </div>
      )}
    </div>
  );
}
