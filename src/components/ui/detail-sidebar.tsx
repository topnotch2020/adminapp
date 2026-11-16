"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

type DetailSidebarProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
};

export function DetailSidebar({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClassName = "max-w-2xl",
}: DetailSidebarProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    // Keep the page behind the panel from scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sidebar-backdrop fixed inset-0 z-30 bg-black/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sidebar-panel fixed right-0 top-0 z-40 h-screen w-full ${widthClassName} overflow-y-auto border-l px-5 pb-5 shadow-2xl`}
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div
          className="sticky top-0 z-20 -mx-5 mb-5 flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            {subtitle ? <p className="truncate text-sm muted">{subtitle}</p> : null}
          </div>
          <button className="btn-ghost !p-2" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
