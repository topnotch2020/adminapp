import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <section>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] muted">{eyebrow}</p>
        ) : null}
        <h2 className="panel-title mt-1">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm muted">{description}</p> : null}
      </section>
      {actions ? <aside className="flex flex-wrap items-center gap-2">{actions}</aside> : null}
    </header>
  );
}
