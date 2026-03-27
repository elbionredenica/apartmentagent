"use client";

interface QuickReplyChipsProps {
  chips: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function QuickReplyChips({
  chips,
  onSelect,
  disabled,
}: QuickReplyChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full border border-border text-sm text-ink-mid hover:border-ink-mid hover:text-ink transition-colors duration-160 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
