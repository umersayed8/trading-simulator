/* ─── Skeleton loader primitives ───────────────────────────────────────────── */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

// ─── Trade page skeleton ─────────────────────────────────────────────────────

export function TradeSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Tips banner */}
      <div className="card flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Stock cards grid */}
      <div className="card space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)' }}>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-24 mt-2" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stock detail skeleton (chart + order panel) ──────────────────────────────

export function StockDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Chart area */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card space-y-4">
          {/* Stock header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-4 w-28 ml-auto" />
            </div>
          </div>
          {/* Period pills */}
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-12 rounded-lg" />
            ))}
          </div>
          {/* Chart */}
          <Skeleton className="w-full rounded-xl" style={{ height: 320 }} />
        </div>
        {/* Stats row */}
        <div className="card grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
      {/* Order panel */}
      <div className="card space-y-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Dashboard skeleton ────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
