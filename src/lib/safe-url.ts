/**
 * These URLs get rendered as `href`s, so anything other than http(s) — most
 * importantly `javascript:` — must be rejected before it reaches the database.
 */
export function assertSafeUrl(raw: string) {
  const trimmed = raw.trim()
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Enter a full link starting with http:// or https://')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// links are allowed.')
  }
  return parsed.toString()
}
