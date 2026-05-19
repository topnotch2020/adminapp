export function MiniBarChart({
  data,
  valueKey,
  labelKey,
  color = "var(--primary)",
}: {
  data: Record<string, string | number>[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const max = Math.max(...data.map((row) => Number(row[valueKey]) || 0), 1);

  return (
    <ul className="space-y-3">
      {data.map((row) => {
        const value = Number(row[valueKey]) || 0;
        const percent = Math.round((value / max) * 100);
        return (
          <li key={String(row[labelKey])}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate pr-2">{String(row[labelKey])}</span>
              <span className="muted shrink-0">{value}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
