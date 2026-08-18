import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  IdCard,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Mic,
  Presentation,
  Search,
  UserCheck,
  XCircle,
} from 'lucide-react'

import { lookupParticipant } from '#/lib/public-api'
import type { ResourceKind } from '#/lib/sessions-api'
import logoUrl from '#/assets/logo.webp'

const kindIcon: Record<ResourceKind, typeof Link2> = {
  slide: Presentation,
  file: FileText,
  link: Link2,
}

export const Route = createFileRoute('/lookup')({ component: LookupPage })

type Result = Awaited<ReturnType<typeof lookupParticipant>> | null

function LookupPage() {
  const lookup = useServerFn(lookupParticipant)
  const [idCardNo, setIdCardNo] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [failed, setFailed] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setFailed(false)
    setResult(null)
    try {
      setResult(await lookup({ data: { idCardNo, phone } }))
    } catch {
      // Network/server failure is different from "no such participant" — say so,
      // rather than leaving the form looking like nothing happened.
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ivory-50)]">
      <div className="wrap py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest-800)]">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to programme page
        </Link>
      </div>

      <div className="wrap-narrow pb-24">
        <div className="mx-auto max-w-lg">
          <div className="flex flex-col items-center text-center">
            <img src={logoUrl} alt="IIUC crest" className="h-16 w-16 object-contain" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-[var(--crimson-600)]">
              Teachers Development Training 2026
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--charcoal-900)] sm:text-4xl">
              Participant Information
            </h1>
            <p className="mt-3 text-lg text-[var(--charcoal-700)]">
              Enter your Teacher ID and phone number to check your registration, room and attendance status.
            </p>
          </div>

          <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
            <div>
              <label htmlFor="idCardNo" className="field-label">Teacher ID</label>
              <input
                id="idCardNo"
                required
                className="input"
                value={idCardNo}
                onChange={(e) => setIdCardNo(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="field-label">Phone Number</label>
              <input
                id="phone"
                type="tel"
                required
                className="input"
                placeholder="e.g. 01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-forest w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" strokeWidth={2.2} />}
              Check My Information
            </button>
          </form>

          {failed && !loading && (
            <div
              className="mt-6 flex items-start gap-4 rounded-xl border p-5 sm:p-6"
              style={{ borderColor: 'var(--crimson-600)', background: 'rgba(158, 42, 43, 0.06)' }}
            >
              <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--crimson-600)]" strokeWidth={2} />
              <div>
                <p className="text-lg font-extrabold text-[var(--charcoal-900)]">Could not check right now</p>
                <p className="mt-1 text-base text-[var(--charcoal-700)]">
                  Please check your internet connection and try again in a moment.
                </p>
              </div>
            </div>
          )}

          {!loading && result && <ResultPanel result={result} />}
        </div>
      </div>
    </div>
  )
}

function ResultPanel({ result }: { result: NonNullable<Result> }) {
  if (!result.found) {
    return (
      <div
        className="mt-6 flex items-start gap-4 rounded-xl border p-6"
        style={{ borderColor: 'var(--crimson-600)', background: 'rgba(158, 42, 43, 0.06)' }}
      >
        <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--crimson-600)]" strokeWidth={2} />
        <div>
          <p className="text-lg font-extrabold text-[var(--charcoal-900)]">No matching record found</p>
          <p className="mt-1 text-base text-[var(--charcoal-700)]">
            Please double-check your Teacher ID and phone number. If the problem continues, contact your
            Departmental Chairman or the IASWD coordination office.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card mt-6 p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--crimson-600)]">Record Found</p>
      <h2 className="mt-2 text-2xl font-extrabold text-[var(--charcoal-900)]">{result.name}</h2>
      <p className="text-base text-[var(--charcoal-700)]">
        {[result.designation, result.department].filter(Boolean).join(' · ') || '—'}
      </p>

      <div className="mt-6 border-t border-[var(--hairline)] pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)]">
            <IdCard className="h-5 w-5 text-[var(--forest-800)]" strokeWidth={1.8} />
          </span>
          <p className="text-sm font-bold text-[var(--charcoal-900)]">Your Details</p>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Detail label="Teacher ID" value={result.idCardNo} />
          <Detail label="Designation" value={result.designation} />
          <Detail label="Department" value={result.department} />
          <Detail label="Phone" value={result.phone} />
          <Detail label="Email" value={result.email} />
          <Detail label="Group Leader" value={result.groupLeader} />
        </dl>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-[var(--hairline)] pt-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)]">
          <BedDouble className="h-5 w-5 text-[var(--forest-800)]" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--charcoal-900)]">Room Assignment</p>
          <p className="text-sm text-[var(--charcoal-700)]">
            {result.roomNumber ? `Room ${result.roomNumber}` : 'Not yet assigned'}
          </p>
        </div>
      </div>

      {result.links.length > 0 && (
        <div className="mt-6 border-t border-[var(--hairline)] pt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)]">
              <MessageCircle className="h-5 w-5 text-[var(--forest-800)]" strokeWidth={1.8} />
            </span>
            <p className="text-sm font-bold text-[var(--charcoal-900)]">Groups & Links</p>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {result.links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-white px-4 py-3 font-semibold text-[var(--forest-800)] hover:border-[var(--forest-800)]"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  {l.label}
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-[var(--hairline)] pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)]">
            <Building2 className="h-5 w-5 text-[var(--forest-800)]" strokeWidth={1.8} />
          </span>
          <p className="text-sm font-bold text-[var(--charcoal-900)]">Attendance</p>
        </div>
        <ul className="mt-4 space-y-2">
          {result.attendance.map((a) => (
            <li key={a.day} className="flex items-center justify-between rounded-lg bg-[var(--ivory-100)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--charcoal-900)]">{a.label}</span>
              {a.status === 'present' && (
                <span className="pill pill-present"><CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} /> Present</span>
              )}
              {a.status === 'absent' && (
                <span className="pill pill-absent"><XCircle className="h-3.5 w-3.5" strokeWidth={2} /> Absent</span>
              )}
              {a.status === null && <span className="pill pill-neutral">Not marked</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-[var(--hairline)] pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)]">
            <CalendarDays className="h-5 w-5 text-[var(--forest-800)]" strokeWidth={1.8} />
          </span>
          <p className="text-sm font-bold text-[var(--charcoal-900)]">Programme Schedule</p>
        </div>

        {result.schedule.every((d) => d.sessions.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--charcoal-500)]">
            The detailed session schedule will be published here before the programme begins.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {result.schedule.map((d) => (
              <div key={d.day}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--crimson-600)]">
                  {d.label}
                </p>
                {d.sessions.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--charcoal-500)]">Not published yet.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {d.sessions.map((s) => (
                      <li key={s.id} className="rounded-lg bg-[var(--ivory-100)] p-4">
                        {(s.startTime || s.endTime) && (
                          <p className="text-sm font-extrabold tabular-nums text-[var(--forest-800)]">
                            {[s.startTime, s.endTime].filter(Boolean).join(' – ')}
                          </p>
                        )}
                        <p className="font-bold text-[var(--charcoal-900)]">{s.title}</p>

                        <div className="mt-1 flex flex-col gap-1 text-sm text-[var(--charcoal-700)] sm:flex-row sm:flex-wrap sm:gap-x-4">
                          {s.place && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={1.8} />
                              {s.place}
                            </span>
                          )}
                          {s.speaker && (
                            <span className="flex items-center gap-1.5">
                              <Mic className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={1.8} />
                              {s.speaker}
                            </span>
                          )}
                          {s.moderator && (
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="h-4 w-4 shrink-0 text-[var(--charcoal-500)]" strokeWidth={1.8} />
                              {s.moderator}
                            </span>
                          )}
                        </div>

                        {s.notes && (
                          <p className="mt-1 text-sm text-[var(--charcoal-500)]">{s.notes}</p>
                        )}

                        {s.resources.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {s.resources.map((r) => {
                              const Icon = kindIcon[r.kind]
                              return (
                                <a
                                  key={r.id}
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-white px-3 text-sm font-semibold text-[var(--forest-800)] hover:border-[var(--forest-800)]"
                                >
                                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                                  {r.label}
                                  <ExternalLink className="h-3 w-3 shrink-0 text-[var(--charcoal-500)]" strokeWidth={2} />
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-[var(--charcoal-500)]">{label}</dt>
      <dd className="break-words text-base text-[var(--charcoal-900)]">{value || '—'}</dd>
    </div>
  )
}
