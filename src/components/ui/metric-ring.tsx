export function MetricRing({
  value,
  max = 100,
  label,
  sublabel,
  size = 120,
}: {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = pct >= 0.7 ? "var(--success)" : pct >= 0.4 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-3xl font-bold"
          style={{ color }}
        >
          {Math.round(value)}
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider muted">{label}</p>
      {sublabel ? <p className="text-center text-[11px] muted">{sublabel}</p> : null}
    </div>
  );
}
