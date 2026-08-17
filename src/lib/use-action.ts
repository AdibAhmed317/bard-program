import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'

/**
 * Runs a server function as a mutation: tracks pending state, catches errors so a
 * failed write surfaces instead of silently doing nothing, and refreshes route
 * loader data on success.
 *
 * Replaces the `await fn(); await router.invalidate()` boilerplate that was
 * repeated across every admin page (and which left buttons live during the
 * request, so a double-click fired the mutation twice).
 */
export function useAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(...args: TArgs): Promise<TResult | undefined> {
    if (pending) return undefined
    setPending(true)
    setError(null)
    try {
      const result = await fn(...args)
      await router.invalidate()
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error, clearError: () => setError(null) }
}
