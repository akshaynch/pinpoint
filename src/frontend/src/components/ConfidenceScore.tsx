import { cn } from "@/lib/utils";

interface ConfidenceScoreProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceScore({
  score,
  showLabel = true,
  size = "md",
}: ConfidenceScoreProps) {
  const getColorClass = (s: number) => {
    if (s < 40) return "text-red-400";
    if (s < 70) return "text-amber-400";
    return "text-emerald-400";
  };

  const getBarColor = (s: number) => {
    if (s < 40) return "bg-red-500";
    if (s < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getLabel = (s: number) => {
    if (s < 40) return "Low";
    if (s < 70) return "Medium";
    return "High";
  };

  const getBgColor = (s: number) => {
    if (s < 40) return "bg-red-500/10 border-red-500/30";
    if (s < 70) return "bg-amber-500/10 border-amber-500/30";
    return "bg-emerald-500/10 border-emerald-500/30";
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono font-semibold text-xs",
          getBgColor(score),
          getColorClass(score),
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", getBarColor(score))} />
        {score}%
      </span>
    );
  }

  return (
    <div className={cn("space-y-1.5", sizeClasses[size])}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-mono text-xs">
            Confidence
          </span>
          <span className={cn("font-mono font-bold", getColorClass(score))}>
            {score}% — {getLabel(score)}
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getBarColor(score),
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
