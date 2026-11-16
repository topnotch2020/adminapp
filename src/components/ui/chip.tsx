import type { Tone } from "@/lib/labels";
import type { ReactNode } from "react";

const TONE_COLOR: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  primary: "var(--primary)",
  info: "#0284c7",
  neutral: "var(--muted)",
};

/** Small rounded label with a coloured dot, e.g. status or listing type. */
export function Chip({
  tone = "neutral",
  children,
  icon,
  dot = true,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  dot?: boolean;
  title?: string;
}) {
  const color = TONE_COLOR[tone];
  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      {icon ? icon : dot ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
      {children}
    </span>
  );
}
