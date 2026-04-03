import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { User, MesoSavings, Character, GearSlot, BossDrop } from '../types'
import MesoProgress from '../components/MesoProgress'

const TIER_ORDER: Record<string, number> = {
  Legendary: 5, Unique: 4, Epic: 3, Rare: 2, None: 1,
}
const TIER_COLORS: Record<string, string> = {
  Legendary: 'text-amber-400 bg-amber-900/40 border-amber-700',
  Unique: 'text-purple-400 bg-purple-900/40 border-purple-700',
  Epic: 'text-blue-400 bg-blue-900/40 border-blue-700',
  Rare: 'text-green-400 bg-green-900/40 border-green-700',
}

export default function Player() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<User | null>(null)
  const [meso, setMeso] = useState<MesoSavings | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [gearSlots, setGearSlots] = useState<GearSlot[]>([])
  const [drops, setDrops] = useState<BossDrop[]>([])
  const [loading, setLoading] = useState(true)

  const [showMesoModal, setShowMesoModal] = useState(false)
  const [mesoForm, setMesoForm] = useState({ amount: '', goal: '' })
  const [savingMeso, setSavingMeso] = useState(false)

  const isOwn = currentUser?.id === userId

  useEffect(() => {
    fetchData()
  }, [userId])

  async function fetchData() {
    setLoading(true)
    const [profileRes, mesoRes, charsRes, dropsRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('meso_savings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('characters').select('*').eq('user_id', userId).order('is_main', { ascending: false }).order('created_at'),
      supabase.from('boss_drops').select('*').eq('user_id', userId).order('dropped_at', { ascending: false }),
    ])

    const chars = charsRes.data ?? []
    setProfile(profileRes.data ?? null)
    setMeso(mesoRes.data ?? null)
    setCharacters(chars)
    setDrops(dropsRes.data ?? [])

    if (chars.length > 0) {
      const charIds = chars.map(c => c.id)
      const { data: gear } = await supabase
        .from('gear_slots')
        .select('*')
        .in('character_id', charIds)
      setGearSlots(gear ?? [])
    } else {
      setGearSlots([])
    }

    setLoading(false)
  }

  function openMesoModal() {
    setMesoForm({
      amount: meso ? String(meso.amount) : '',
      goal: meso?.goal ? String(meso.goal) : '',
    })
    setShowMesoModal(true)
  }

  async function handleSaveMeso() {
    const amount = parseInt(mesoForm.amount)
    if (isNaN(amount) || amount < 0) {
      toast.error('Enter a valid meso amount')
      return
    }
    const goal = mesoForm.goal ? parseInt(mesoForm.goal) : null
    if (mesoForm.goal && (isNaN(goal!) || goal! <= 0)) {
      toast.error('Enter a valid goal amount')
      return
    }
    setSavingMeso(true)
    const { error } = await supabase
      .from('meso_savings')
      .upsert({ user_id: userId, amount, goal: goal ?? null })
    if (error) {
      toast.error('Failed to save meso')
    } else {
      toast.success('Meso savings updated')
      setShowMesoModal(false)
      fetchData()
    }
    setSavingMeso(false)
  }

  // --- Computed gear stats ---
  const mainChar = characters.find(c => c.is_main) ?? characters[0] ?? null
  const mainGear = mainChar ? gearSlots.filter(g => g.character_id === mainChar.id) : []
  const totalStars = mainGear.reduce((sum, g) => sum + (g.stars || 0), 0)
  const avgFlame = mainGear.length > 0
    ? Math.round(mainGear.reduce((sum, g) => sum + (g.flame_score || 0), 0) / mainGear.length)
    : 0
  const tierCounts = gearSlots.reduce<Record<string, number>>((acc, g) => {
    if (g.potential_tier && g.potential_tier !== 'None') {
      acc[g.potential_tier] = (acc[g.potential_tier] || 0) + 1
    }
    return acc
  }, {})
  const sortedTiers = Object.entries(tierCounts).sort(
    (a, b) => (TIER_ORDER[b[0]] || 0) - (TIER_ORDER[a[0]] || 0)
  )

  // --- Computed drop stats ---
  const pitchedCount = drops.filter(d => d.pitched).length
  const bossCounts = drops.reduce<Record<string, number>>((acc, d) => {
    acc[d.boss] = (acc[d.boss] || 0) + 1
    return acc
  }, {})
  const topBoss = Object.entries(bossCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const recentDrops = drops.slice(0, 5)

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>
  if (!profile) return <p className="text-slate-500 text-sm">Player not found.</p>

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.ign}</h1>
          <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
            profile.role === 'admin'
              ? 'bg-amber-900 text-amber-300 border border-amber-700'
              : 'bg-slate-700 text-slate-400'
          }`}>
            {profile.role}
          </span>
        </div>
      </div>

      {/* Meso Savings */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">Meso Savings</h2>
          {isOwn && (
            <button onClick={openMesoModal} className="text-xs text-teal-400 hover:text-teal-300">
              Edit
            </button>
          )}
        </div>
        {meso ? (
          <MesoProgress amount={meso.amount} goal={meso.goal} />
        ) : (
          <p className="text-slate-500 text-sm">
            {isOwn ? 'No meso recorded yet.' : "This player hasn't set meso savings."}
          </p>
        )}
      </div>

      {/* Gear Overview */}
      {characters.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Gear Overview</h2>
            {mainChar && (
              <span className="text-xs text-slate-400">
                {mainChar.name} · {mainChar.class}
              </span>
            )}
          </div>

          {mainGear.length === 0 ? (
            <p className="text-slate-500 text-sm">No gear data recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {/* Star + Flame stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Total Stars</p>
                  <p className="text-white text-xl font-bold">
                    {totalStars}
                    <span className="text-amber-400 text-sm ml-1">★</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">across {mainGear.length} gear slots</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Avg Flame Score</p>
                  <p className="text-white text-xl font-bold">{avgFlame}</p>
                  <p className="text-slate-500 text-xs mt-0.5">per slot (main char)</p>
                </div>
              </div>

              {/* Potential tier distribution */}
              {sortedTiers.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs mb-2">Potential Tiers (all characters)</p>
                  <div className="flex flex-wrap gap-2">
                    {sortedTiers.map(([tier, count]) => (
                      <span
                        key={tier}
                        className={`text-xs px-2 py-0.5 rounded border font-medium ${TIER_COLORS[tier] ?? 'text-slate-400 bg-slate-700 border-slate-600'}`}
                      >
                        {tier} × {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Boss Drop Stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Boss Drops</h2>

        {drops.length === 0 ? (
          <p className="text-slate-500 text-sm">No drops logged yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-white text-lg font-bold">{drops.length}</p>
                <p className="text-slate-400 text-xs mt-0.5">Total Logged</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-teal-400 text-lg font-bold">{pitchedCount}</p>
                <p className="text-slate-400 text-xs mt-0.5">Pitched</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-white text-lg font-bold">{drops.length - pitchedCount}</p>
                <p className="text-slate-400 text-xs mt-0.5">Kept</p>
              </div>
            </div>

            {topBoss && (
              <p className="text-slate-400 text-xs">
                Most runs: <span className="text-white font-medium">{topBoss}</span>
                <span className="text-slate-500 ml-1">({bossCounts[topBoss]}×)</span>
              </p>
            )}

            {/* Recent drops */}
            <div>
              <p className="text-slate-400 text-xs mb-2">Recent Drops</p>
              <div className="space-y-1.5">
                {recentDrops.map(drop => (
                  <div
                    key={drop.id}
                    className="flex items-center justify-between text-sm bg-slate-900 rounded-md px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {drop.pitched && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700 shrink-0">
                          PITCHED
                        </span>
                      )}
                      <span className="text-white truncate">{drop.item}</span>
                      <span className="text-slate-500 text-xs shrink-0">· {drop.boss}</span>
                    </div>
                    <span className="text-slate-500 text-xs shrink-0 ml-2">
                      {format(new Date(drop.dropped_at), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
              {drops.length > 5 && (
                <button
                  onClick={() => navigate('/drops')}
                  className="text-xs text-teal-400 hover:text-teal-300 mt-2"
                >
                  View all {drops.length} drops →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Characters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-white font-semibold text-sm mb-3">Characters</h2>
        {characters.length === 0 ? (
          <p className="text-slate-500 text-sm">No characters yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {characters.map(char => {
              const charStars = gearSlots
                .filter(g => g.character_id === char.id)
                .reduce((sum, g) => sum + (g.stars || 0), 0)
              const hasGear = gearSlots.some(g => g.character_id === char.id)
              return (
                <div
                  key={char.id}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-sm font-medium">{char.name}</span>
                      {char.is_main && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700">
                          MAIN
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{char.class} · Lv {char.level}</p>
                    {hasGear && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        <span className="text-amber-400">★</span> {charStars} stars
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/characters/${char.id}`)}
                    className="text-xs text-teal-400 hover:text-teal-300 shrink-0"
                  >
                    Gear →
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Meso Modal */}
      {showMesoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-white font-semibold text-lg mb-4">Edit Meso Savings</h2>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Current Amount (meso)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  value={mesoForm.amount}
                  onChange={e => setMesoForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 5000000000"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Goal (optional)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  value={mesoForm.goal}
                  onChange={e => setMesoForm(f => ({ ...f, goal: e.target.value }))}
                  placeholder="e.g. 10000000000"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowMesoModal(false)}
                className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeso}
                disabled={savingMeso}
                className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md"
              >
                {savingMeso ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
