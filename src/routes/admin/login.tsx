import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2, Lock } from 'lucide-react'

import { authClient } from '#/lib/auth-client'
import { PasswordField } from '#/components/admin/password-field'
import logoUrl from '#/assets/logo.webp'

export const Route = createFileRoute('/admin/login')({ component: AdminLogin })

function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await authClient.signIn.username({ username, password })
    setLoading(false)
    if (signInError) {
      setError('Invalid username or password.')
      return
    }
    void navigate({ to: '/admin' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--forest-950)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <img src={logoUrl} alt="IIUC crest" className="h-16 w-16 object-contain" />
          <p className="mt-4 text-sm font-bold text-white">International Islamic University Chittagong</p>
          <p className="text-xs text-white/50">Programme Administration</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl bg-[var(--ivory-50)] p-6">
          <div>
            <label htmlFor="username" className="field-label">Username</label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <PasswordField
            id="password"
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />

          {error && <p className="text-sm font-semibold text-[var(--crimson-700)]">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-forest w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" strokeWidth={2} />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
