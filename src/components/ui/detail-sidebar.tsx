"use client";

import { ReactNode } from "react";

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
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      <aside
        className={`fixed right-0 top-0 z-40 h-screen w-full ${widthClassName} overflow-y-auto border-l p-5`}
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {subtitle ? <p className="text-sm muted">{subtitle}</p> : null}
          </div>
          <button className="btn-secondary !py-1" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
