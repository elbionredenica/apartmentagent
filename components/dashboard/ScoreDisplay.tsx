interface ScoreDisplayProps {
  label: string;
  score: number;
  maxScore?: number;
}

export function ScoreDisplay({
  label,
  score,
  maxScore = 100,
}: ScoreDisplayProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink-muted w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-off-white rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-ink w-8 text-right">
        {score}
      </span>
    </div>
  );
}
