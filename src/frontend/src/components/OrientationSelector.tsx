import { cn } from "@/lib/utils";

const ORIENTATIONS = [
  { value: "N", label: "North", symbol: "↑" },
  { value: "NE", label: "North-East", symbol: "↗" },
  { value: "E", label: "East", symbol: "→" },
  { value: "SE", label: "South-East", symbol: "↘" },
  { value: "S", label: "South", symbol: "↓" },
  { value: "SW", label: "South-West", symbol: "↙" },
  { value: "W", label: "West", symbol: "←" },
  { value: "NW", label: "North-West", symbol: "↖" },
];

interface OrientationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function OrientationSelector({
  value,
  onChange,
}: OrientationSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        Building Entrance Direction
      </p>
      <div className="grid grid-cols-4 gap-2">
        {ORIENTATIONS.map(({ value: v, label, symbol }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            title={label}
            className={cn(
              "h-10 rounded-lg border text-sm font-mono font-bold transition-all duration-150 flex items-center justify-center gap-1",
              value === v
                ? "bg-primary/15 border-primary text-primary glow-teal"
                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <span className="text-base leading-none">{symbol}</span>
            <span className="text-xs">{v}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
