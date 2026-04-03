import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { User, MesoSavings, Character } from '../types'
import MesoProgress from '../components/MesoProgress'

export default function Player() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<User | null>(null)
  const [meso, setMeso] = useState<MesoSavings | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
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
    const [profileRes, mesoRes, charsRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('meso_savings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('characters').select('*').eq('user_id', userId).order('is_main', { ascending: false }).order('created_at'),
    ])
    setProfile(profileRes.data ?? null)
    setMeso(mesoRes.data ?? null)
    setCharacters(charsRes.data ?? [])
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

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>
  if (!profile) return <p className="text-slate-500 text-sm">Player not found.</p>

  return (
    <div className="max-w-2xl">
      {/* Profile header */}
      <div className="flex items-start justify-between mb-6">
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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">Meso Savings</h2>
          {isOwn && (
            <button
              onClick={openMesoModal}
              className="text-xs text-teal-400 hover:text-teal-300"
            >
              Edit
            </button>
          )}
        </div>
        {meso ? (
          <MesoProgress amount={meso.amount} goal={meso.goal} />
        ) : (
          <p className="text-slate-500 text-sm">
            {isOwn ? 'No meso recorded yet.' : 'This player hasn\'t set meso savings.'}
          </p>
        )}
      </div>

      {/* Characters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-white font-semibold text-sm mb-3">Characters</h2>
        {characters.length === 0 ? (
          <p className="text-slate-500 text-sm">No characters yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {characters.map(char => (
              <div key={char.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-medium">{char.name}</span>
                    {char.is_main && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700">MAIN</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{char.class} · Lv {char.level}</p>
                </div>
                <button
                  onClick={() => navigate(`/characters/${char.id}`)}
                  className="text-xs text-teal-400 hover:text-teal-300 shrink-0"
                >
                  Gear →
                </button>
              </div>
            ))}
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
