"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Tone = "default" | "primary" | "success" | "danger";

const TONE_COLOR: Record<Tone, string> = {
  default: "var(--foreground)",
  primary: "var(--primary)",
  success: "var(--success)",
  danger: "var(--danger)",
};

/**
 * Square icon-only button with a label tooltip on hover/focus. The tooltip is
 * portalled to <body> so table or card overflow never clips it.
 */
export function IconButton({
  label,
  icon,
  onClick,
  tone = "default",
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
}) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const color = TONE_COLOR[tone];

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTip({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setTip(null);
          onClick();
        }}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setTip(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setTip(null)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
          color,
        }}
      >
        {icon}
      </button>
      {tip && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium shadow-lg"
              style={{ left: tip.x, top: tip.y - 6, background: "#0f172a", color: "#f8fafc" }}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
