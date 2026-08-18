/** Content-area placeholder while an admin route's loader runs. */
export function AdminSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-5 w-48 rounded bg-[var(--ivory-200)]" />
        <div className="h-11 w-40 rounded-full bg-[var(--ivory-200)]" />
      </div>
      <div className="card mt-6 overflow-hidden">
        <div className="h-12 bg-[var(--ivory-200)]" />
        <div className="divide-y divide-[var(--hairline)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="h-4 w-6 rounded bg-[var(--ivory-200)]" />
              <div className="h-4 flex-1 rounded bg-[var(--ivory-200)]" />
              <div className="hidden h-4 w-40 rounded bg-[var(--ivory-200)] sm:block" />
              <div className="hidden h-4 w-24 rounded bg-[var(--ivory-200)] md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
