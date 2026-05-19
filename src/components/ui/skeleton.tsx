export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function StatCardSkeleton() {
  return (
    <article className="panel-elevated p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </article>
  );
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <article className="panel p-5 space-y-3">
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </article>
  );
}
