import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, BedDouble, Building2, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react'

import { lookupParticipant } from '#/lib/public-api'
import logoUrl from '#/assets/logo.webp'

export const Route = createFileRoute('/lookup')({ component: LookupPage })

type Result = Awaited<ReturnType<typeof lookupParticipant>> | null

function LookupPage() {
  const [idCardNo, setIdCardNo] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [submitted, setSubmitted] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSubmitted(true)
    try {
      const res = await lookupParticipant({ data: { idCardNo, phone } })
      setResult(res)
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

          {submitted && !loading && result && <ResultPanel result={result} />}
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
    </div>
  )
}
