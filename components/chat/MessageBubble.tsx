import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAgent = message.role === "agent";

  return (
    <div
      className={`flex ${isAgent ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-lg text-base leading-relaxed ${
          isAgent
            ? "bg-off-white text-ink rounded-tl-sm"
            : "bg-accent-light text-ink rounded-tr-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
