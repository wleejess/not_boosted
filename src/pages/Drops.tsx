import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BOSSES } from '../types'
import type { BossDrop, Character, User } from '../types'
import DropFeedCard from '../components/DropFeedCard'
import ConfirmModal from '../components/ConfirmModal'

interface EnrichedDrop extends BossDrop {
  character_name?: string
  user_ign?: string
}

interface AddDropForm {
  character_id: string
  boss: string
  item: string
  pitched: boolean
  dropped_at: string
}

const EMPTY_FORM: AddDropForm = {
  character_id: '',
  boss: BOSSES[0],
  item: '',
  pitched: false,
  dropped_at: format(new Date(), 'yyyy-MM-dd'),
}

export default function Drops() {
  const { user } = useAuth()

  const [drops, setDrops] = useState<EnrichedDrop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [myChars, setMyChars] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  const [filterPlayer, setFilterPlayer] = useState('')
  const [filterBoss, setFilterBoss] = useState('')
  const [filterPitched, setFilterPitched] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<AddDropForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EnrichedDrop | null>(null)

  useEffect(() => {
    fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const [dropsRes, usersRes, charsRes] = await Promise.all([
      supabase.from('boss_drops').select('*').order('dropped_at', { ascending: false }),
      supabase.from('users').select('id, ign, email, role, created_at'),
      user ? supabase.from('characters').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ])

    if (dropsRes.error) {
      toast.error('Failed to load drops')
    }

    const userMap = Object.fromEntries((usersRes.data ?? []).map((u: User) => [u.id, u]))
    const charMap: Record<string, Character> = {}
    ;(dropsRes.data ?? []).forEach(() => {}) // just need the map below

    // Build char map from all characters by fetching once
    const allCharIds = [...new Set((dropsRes.data ?? []).map((d: BossDrop) => d.character_id).filter(Boolean))]
    if (allCharIds.length > 0) {
      const { data } = await supabase.from('characters').select('id, name').in('id', allCharIds)
      ;(data ?? []).forEach((c: { id: string; name: string }) => {
        charMap[c.id] = c as Character
      })
    }

    const enriched: EnrichedDrop[] = (dropsRes.data ?? []).map((d: BossDrop) => ({
      ...d,
      character_name: charMap[d.character_id]?.name,
      user_ign: userMap[d.user_id]?.ign,
    }))

    setDrops(enriched)
    setUsers(usersRes.data ?? [])
    setMyChars((charsRes as { data: Character[] }).data ?? [])
    setLoading(false)
  }

  const filtered = drops.filter(d => {
    if (filterPlayer && d.user_id !== filterPlayer) return false
    if (filterBoss && d.boss !== filterBoss) return false
    if (filterPitched && !d.pitched) return false
    return true
  })

  function openAdd() {
    setForm({ ...EMPTY_FORM, dropped_at: format(new Date(), 'yyyy-MM-dd') })
    setShowModal(true)
  }

  async function handleAdd() {
    if (!form.item.trim()) {
      toast.error('Item name is required')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('boss_drops').insert({
      user_id: user!.id,
      character_id: form.character_id || null,
      boss: form.boss,
      item: form.item.trim(),
      pitched: form.pitched,
      dropped_at: form.dropped_at,
    })
    if (error) {
      toast.error('Failed to log drop')
    } else {
      toast.success('Drop logged')
      setShowModal(false)
      fetchAll()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('boss_drops').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Failed to delete drop')
    else {
      toast.success('Drop deleted')
      setDrops(prev => prev.filter(d => d.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Boss Drop Log</h1>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          + Log Drop
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-teal-500"
          value={filterPlayer}
          onChange={e => setFilterPlayer(e.target.value)}
        >
          <option value="">All Players</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.ign}</option>)}
        </select>
        <select
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-teal-500"
          value={filterBoss}
          onChange={e => setFilterBoss(e.target.value)}
        >
          <option value="">All Bosses</option>
          {BOSSES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            className="accent-amber-500"
            checked={filterPitched}
            onChange={e => setFilterPitched(e.target.checked)}
          />
          Pitched only
        </label>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">No drops found.</p>
          <p className="text-sm mt-1">{drops.length > 0 ? 'Try adjusting filters.' : 'Log your first drop!'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(drop => (
            <DropFeedCard
              key={drop.id}
              drop={drop}
              canDelete={!!(user && (user.id === drop.user_id || user.role === 'admin'))}
              onDelete={id => setDeleteTarget(drops.find(d => d.id === id) ?? null)}
            />
          ))}
        </div>
      )}

      {/* Add Drop Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-white font-semibold text-lg mb-4">Log Drop</h2>
            <div className="space-y-3">
              {myChars.length > 0 && (
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Character</label>
                  <select
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    value={form.character_id}
                    onChange={e => setForm(f => ({ ...f, character_id: e.target.value }))}
                  >
                    <option value="">— select character —</option>
                    {myChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-slate-400 text-xs block mb-1">Boss</label>
                <select
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  value={form.boss}
                  onChange={e => setForm(f => ({ ...f, boss: e.target.value }))}
                >
                  {BOSSES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Item</label>
                <input
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  value={form.item}
                  onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                  placeholder="e.g. Arcane Umbra Bow"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  value={form.dropped_at}
                  onChange={e => setForm(f => ({ ...f, dropped_at: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  checked={form.pitched}
                  onChange={e => setForm(f => ({ ...f, pitched: e.target.checked }))}
                />
                <span className="text-slate-300 text-sm">Pitched drop</span>
              </label>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md"
              >
                {saving ? 'Logging…' : 'Log Drop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Drop"
          message={`Remove "${deleteTarget.item}" from ${deleteTarget.boss}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
