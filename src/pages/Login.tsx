import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Shared with scripts/create-members.mjs — keep in sync
export function ignToEmail(ign: string): string {
  const slug = ign
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')   // strip non-email-safe chars
  return `${slug}@jjv.notboosted`
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [ign, setIgn] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const email = ignToEmail(ign.trim())
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Invalid IGN or password.')
    } else {
      navigate('/guild')
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">NOT BOOSTED</h1>
          <p className="text-slate-400 text-sm mt-1">Track your guild's progression.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">IGN</label>
            <input
              type="text"
              value={ign}
              onChange={e => setIgn(e.target.value)}
              placeholder="Your in-game name"
              required
              autoComplete="username"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold py-2.5 rounded-lg text-sm transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Contact your guild admin to get an account.
        </p>
      </div>
    </div>
  )
}
