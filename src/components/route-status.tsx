import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react'

/** Shown by the router while a route loader is still running (see defaultPendingMs). */
export function RoutePending() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--forest-800)]" strokeWidth={2} />
        <p className="text-sm font-semibold text-[var(--charcoal-500)]">Loading…</p>
      </div>
    </div>
  )
}

/** Shown when a route loader throws, with a retry that re-runs the loader. */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-[var(--crimson-600)]" strokeWidth={1.8} />
      <h1 className="text-2xl font-extrabold text-[var(--charcoal-900)]">Something went wrong</h1>
      <p className="max-w-md text-base text-[var(--charcoal-700)]">
        {error instanceof Error ? error.message : 'This page could not be loaded.'}
      </p>
      <button type="button" className="btn btn-forest" onClick={() => void router.invalidate()}>
        <RotateCcw className="h-4 w-4" strokeWidth={2} />
        Try again
      </button>
    </div>
  )
}
