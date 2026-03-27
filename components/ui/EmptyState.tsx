import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon size={32} className="text-border mb-3" />
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}
