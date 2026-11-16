"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  /** Show an optional text box, e.g. a rejection reason. */
  reasonLabel?: string;
};

type ConfirmResult = { confirmed: boolean; reason?: string };

type Pending = ConfirmOptions & { resolve: (result: ConfirmResult) => void };

/**
 * Promise-based confirmation modal:
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title: "Suspend broker?" })).confirmed) return;
 * Render {dialog} once in the page.
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<ConfirmResult>((resolve) => {
        pendingRef.current?.resolve({ confirmed: false });
        const next = { ...options, resolve };
        pendingRef.current = next;
        setPending(next);
      }),
    []
  );

  const close = useCallback((result: ConfirmResult) => {
    pendingRef.current?.resolve(result);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const dialog = pending ? (
    <ConfirmDialog key={pending.title} options={pending} onClose={close} />
  ) : null;

  return { confirm, dialog };
}

function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions;
  onClose: (result: ConfirmResult) => void;
}) {
  const [reason, setReason] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const danger = options.tone === "danger";
  const color = danger ? "var(--danger)" : "var(--primary)";

  useEffect(() => {
    if (!options.reasonLabel) confirmRef.current?.focus();
  }, [options.reasonLabel]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose({ confirmed: false });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="sidebar-backdrop absolute inset-0 bg-black/40" onClick={() => onClose({ confirmed: false })} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={options.title}
        className="panel-elevated animate-fade-in relative w-full max-w-md p-5"
      >
        <div className="flex gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
          >
            {danger ? <AlertTriangle size={18} /> : <Info size={18} />}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold">{options.title}</h3>
            {options.description ? <div className="text-sm muted">{options.description}</div> : null}
          </div>
        </div>
        {options.reasonLabel ? (
          <label className="mt-4 block space-y-1.5">
            <span className="text-xs font-medium muted">{options.reasonLabel}</span>
            <textarea
              autoFocus
              className="input min-h-20 w-full"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => onClose({ confirmed: false })}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className={danger ? "rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" : "btn-primary"}
            style={danger ? { background: "var(--danger)" } : undefined}
            onClick={() => onClose({ confirmed: true, reason: reason.trim() || undefined })}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
