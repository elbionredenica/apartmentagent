export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-off-white px-4 py-3 rounded-lg rounded-tl-sm flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
