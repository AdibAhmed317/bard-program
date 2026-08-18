import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'

export type ActionResult<T> = { ok: true; data: T } | { ok: false }

/**
 * Runs a server function as a mutation: tracks pending state, catches errors so a
 * failed write surfaces instead of silently doing nothing, and refreshes route
 * loader data on success.
 *
 * `run` returns a discriminated result rather than the raw value — most of these
 * server functions return void, so a bare `undefined` return can't distinguish
 * "succeeded, returned nothing" from "failed", and callers were treating every
 * successful write as a failure (forms never reset).
 */
export function useAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(...args: TArgs): Promise<ActionResult<TResult>> {
    if (pending) return { ok: false }
    setPending(true)
    setError(null)
    try {
      const data = await fn(...args)
      await router.invalidate()
      return { ok: true, data }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      return { ok: false }
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error, clearError: () => setError(null) }
}
