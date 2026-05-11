interface CircularMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularCompletenessMeter({
  score,
  size = 140,
  strokeWidth = 10,
}: CircularMeterProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s < 25) return "#dc2626";
    if (s < 50) return "#d97706";
    if (s < 75) return "#2563eb";
    return "#16a34a";
  };

  const color = getColor(clamped);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--clr-muted, #e9ecef)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-3xl font-bold tabular-nums transition-colors duration-500"
          style={{ color }}
        >
          {clamped}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--clr-muted-foreground, #868e96)" }}>
          Complete
        </span>
      </div>
    </div>
  );
}
