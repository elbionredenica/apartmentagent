interface BadgeProps {
  children: React.ReactNode;
  bgClass?: string;
  textClass?: string;
  className?: string;
}

export function Badge({
  children,
  bgClass = "bg-badge-muted-bg",
  textClass = "text-ink-muted",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass} ${textClass} ${className}`}
    >
      {children}
    </span>
  );
}
