import { Circle, CircleDot, ArrowUp } from "lucide-react";

interface Level {
  id: string;
  label: string;
  description: string;
  taskCount: number;
  pointsPerTask: number;
}

const LEVELS: Level[] = [
  { id: "basic", label: "Basic", description: "Essential marketing foundation", taskCount: 42, pointsPerTask: 15 },
  { id: "pro", label: "Pro", description: "Growth-oriented strategies", taskCount: 68, pointsPerTask: 10 },
  { id: "advanced", label: "Advanced", description: "Full marketing maturity", taskCount: 94, pointsPerTask: 5 },
];

interface MarketingLevelSelectorProps {
  selected: string;
  onSelect: (level: string) => void;
}

export default function MarketingLevelSelector({ selected, onSelect }: MarketingLevelSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {LEVELS.map((level) => {
        const isActive = selected === level.id;
        return (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
              isActive
                ? "border-[var(--clr-primary,#0070c4)] bg-[var(--clr-primary,#0070c4)]/5 shadow-sm"
                : "border-surface-200 bg-white hover:border-surface-300"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <CircleDot className="h-5 w-5" style={{ color: "var(--clr-primary, #0070c4)" }} />
                ) : (
                  <Circle className="h-5 w-5 text-surface-400" />
                )}
                <span className={`text-sm font-semibold ${isActive ? "text-surface-900" : "text-surface-700"}`}>
                  {level.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-surface-400">
                <ArrowUp className="h-3 w-3" />
                <span>{level.pointsPerTask}pts</span>
              </div>
            </div>
            <p className="text-xs text-surface-500 ml-7">{level.description}</p>
            <div className="ml-7 flex items-center gap-2">
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--clr-primary, #0070c4)" }}>
                {level.taskCount} tasks
              </span>
              {isActive && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{ backgroundColor: "var(--clr-primary, #0070c4)", color: "var(--clr-primary-foreground, #fff)" }}>
                  Active
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
