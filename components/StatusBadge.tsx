import type { ListingStatus } from "@/types";
import { mapBackendStatus } from "@/lib/status-map";
import { Badge } from "@/components/ui/Badge";

interface StatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, bgClass, textClass } = mapBackendStatus(status);

  return (
    <Badge bgClass={bgClass} textClass={textClass} className={className}>
      {label}
    </Badge>
  );
}
