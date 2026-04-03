import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { User, Character, GearSlot, MesoSavings, BossDrop } from '../types'

function formatMeso(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}b`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}m`
  return n.toLocaleString()
}

interface MemberStats {
  user: User
  mainChar: Character | null
  totalStars: number
  meso: number | null
  dropCount: number
  pitchedCount: number
}

export default function Guild() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<MemberStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [usersRes, charsRes, mesoRes, dropsRes] = await Promise.all([
      supabase.from('users').select('*').order('role').order('ign'),
      supabase.from('characters').select('*').order('is_main', { ascending: false }).order('created_at'),
      supabase.from('meso_savings').select('*'),
      supabase.from('boss_drops').select('id, user_id, pitched'),
    ])

    if (usersRes.error) { toast.error('Failed to load members'); setLoading(false); return }

    const users: User[] = usersRes.data ?? []
    const chars: Character[] = charsRes.data ?? []
    const mesoRows: MesoSavings[] = mesoRes.data ?? []
    const drops: Pick<BossDrop, 'id' | 'user_id' | 'pitched'>[] = dropsRes.data ?? []

    // Fetch gear slots for all characters
    let gearSlots: GearSlot[] = []
    if (chars.length > 0) {
      const charIds = chars.map(c => c.id)
      const { data } = await supabase.from('gear_slots').select('character_id, stars').in('character_id', charIds)
      gearSlots = (data ?? []) as unknown as GearSlot[]
    }

    // Build per-member stats
    const mesoMap = Object.fromEntries(mesoRows.map(m => [m.user_id, m.amount]))
    const memberStats: MemberStats[] = users.map(user => {
      const userChars = chars.filter(c => c.user_id === user.id)
      const mainChar = userChars.find(c => c.is_main) ?? userChars[0] ?? null
      const mainGear = mainChar ? gearSlots.filter(g => g.character_id === mainChar.id) : []
      const totalStars = mainGear.reduce((sum, g) => sum + (g.stars || 0), 0)
      const userDrops = drops.filter(d => d.user_id === user.id)
      return {
        user,
        mainChar,
        totalStars,
        meso: mesoMap[user.id] ?? null,
        dropCount: userDrops.length,
        pitchedCount: userDrops.filter(d => d.pitched).length,
      }
    })

    setStats(memberStats)
    setLoading(false)
  }

  // Guild-wide aggregates
  const totalMeso = stats.reduce((sum, s) => sum + (s.meso ?? 0), 0)
  const totalDrops = stats.reduce((sum, s) => sum + s.dropCount, 0)
  const totalPitched = stats.reduce((sum, s) => sum + s.pitchedCount, 0)
  const pitchedPct = totalDrops > 0 ? Math.round((totalPitched / totalDrops) * 100) : 0

  // Leaderboards (top 5 each)
  const byStars = [...stats].sort((a, b) => b.totalStars - a.totalStars).slice(0, 5)
  const byMeso = [...stats].filter(s => s.meso !== null).sort((a, b) => (b.meso ?? 0) - (a.meso ?? 0)).slice(0, 5)
  const byDrops = [...stats].filter(s => s.dropCount > 0).sort((a, b) => b.dropCount - a.dropCount).slice(0, 5)

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Guild Dashboard</h1>
        <p className="text-slate-400 text-sm">JJV — {stats.length} members</p>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <>
          {/* Guild-wide stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-white text-2xl font-bold">{formatMeso(totalMeso)}</p>
              <p className="text-slate-400 text-xs mt-1">Total Meso Saved</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-white text-2xl font-bold">{totalDrops}</p>
              <p className="text-slate-400 text-xs mt-1">Drops Logged</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-teal-400 text-2xl font-bold">{pitchedPct}%</p>
              <p className="text-slate-400 text-xs mt-1">Pitched to Guild</p>
            </div>
          </div>

          {/* Leaderboards */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-3">Leaderboards</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Stars */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">
                  Stars <span className="text-amber-400">★</span>
                </p>
                {byStars.length === 0 ? (
                  <p className="text-slate-500 text-xs">No data yet.</p>
                ) : (
                  <ol className="space-y-2">
                    {byStars.map((s, i) => (
                      <li key={s.user.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-bold w-4 shrink-0 ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {i + 1}
                          </span>
                          <button
                            onClick={() => navigate(`/player/${s.user.id}`)}
                            className="text-sm text-white hover:text-teal-300 truncate text-left"
                          >
                            {s.user.ign}
                          </button>
                        </div>
                        <span className="text-white text-sm font-semibold shrink-0">{s.totalStars}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Meso */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Meso</p>
                {byMeso.length === 0 ? (
                  <p className="text-slate-500 text-xs">No data yet.</p>
                ) : (
                  <ol className="space-y-2">
                    {byMeso.map((s, i) => (
                      <li key={s.user.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-bold w-4 shrink-0 ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {i + 1}
                          </span>
                          <button
                            onClick={() => navigate(`/player/${s.user.id}`)}
                            className="text-sm text-white hover:text-teal-300 truncate text-left"
                          >
                            {s.user.ign}
                          </button>
                        </div>
                        <span className="text-white text-sm font-semibold shrink-0">
                          {formatMeso(s.meso!)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Drops */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Drops</p>
                {byDrops.length === 0 ? (
                  <p className="text-slate-500 text-xs">No data yet.</p>
                ) : (
                  <ol className="space-y-2">
                    {byDrops.map((s, i) => (
                      <li key={s.user.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-bold w-4 shrink-0 ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {i + 1}
                          </span>
                          <button
                            onClick={() => navigate(`/player/${s.user.id}`)}
                            className="text-sm text-white hover:text-teal-300 truncate text-left"
                          >
                            {s.user.ign}
                          </button>
                        </div>
                        <span className="text-white text-sm font-semibold shrink-0">{s.dropCount}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* Member cards */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-3">Members</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map(s => (
                <button
                  key={s.user.id}
                  onClick={() => navigate(`/player/${s.user.id}`)}
                  className="text-left bg-slate-800 border border-slate-700 hover:border-teal-700 rounded-lg px-4 py-3 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-white font-semibold group-hover:text-teal-300 transition-colors">
                      {s.user.ign}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                      s.user.role === 'admin'
                        ? 'bg-amber-900 text-amber-300 border border-amber-700'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {s.user.role}
                    </span>
                  </div>

                  {s.mainChar ? (
                    <p className="text-slate-400 text-xs">
                      {s.mainChar.name} · {s.mainChar.class} · Lv {s.mainChar.level}
                    </p>
                  ) : (
                    <p className="text-slate-600 text-xs">No characters yet</p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {s.totalStars > 0 && (
                      <span className="text-xs text-slate-300">
                        <span className="text-amber-400">★</span> {s.totalStars}
                      </span>
                    )}
                    {s.meso !== null && (
                      <span className="text-xs text-slate-300">{formatMeso(s.meso)} meso</span>
                    )}
                    {s.dropCount > 0 && (
                      <span className="text-xs text-slate-500">{s.dropCount} drops</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
