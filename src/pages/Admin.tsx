import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { User, Character, MesoSavings } from '../types'
import { BOSSES } from '../types'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

interface DropRow {
  key: string
  date: string
  userId: string
  characterId: string
  boss: string
  item: string
  pitched: boolean
}

function newRow(): DropRow {
  return {
    key: crypto.randomUUID(),
    date: todayStr(),
    userId: '',
    characterId: '',
    boss: '',
    item: '',
    pitched: false,
  }
}

export default function Admin() {
  const [members, setMembers] = useState<User[]>([])
  const [allChars, setAllChars] = useState<Character[]>([])
  const [allMeso, setAllMeso] = useState<MesoSavings[]>([])
  const [loading, setLoading] = useState(true)

  // Bulk drops
  const [rows, setRows] = useState<DropRow[]>([newRow()])
  const [submittingDrops, setSubmittingDrops] = useState(false)

  // Meso override
  const [mesoUserId, setMesoUserId] = useState('')
  const [mesoAmount, setMesoAmount] = useState('')
  const [mesoGoal, setMesoGoal] = useState('')
  const [savingMeso, setSavingMeso] = useState(false)

  useEffect(() => {
    async function fetchAll() {
      const [usersRes, charsRes, mesoRes] = await Promise.all([
        supabase.from('users').select('*').order('ign'),
        supabase.from('characters').select('*').order('is_main', { ascending: false }).order('name'),
        supabase.from('meso_savings').select('*'),
      ])
      setMembers(usersRes.data ?? [])
      setAllChars(charsRes.data ?? [])
      setAllMeso(mesoRes.data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  // --- Drop rows ---
  function updateRow(key: string, patch: Partial<DropRow>) {
    setRows(rs => rs.map(r => r.key === key ? { ...r, ...patch } : r))
  }

  function addRow() {
    setRows(rs => [...rs, newRow()])
  }

  function removeRow(key: string) {
    if (rows.length === 1) return
    setRows(rs => rs.filter(r => r.key !== key))
  }

  const validRows = rows.filter(r => r.userId && r.boss && r.item.trim() && r.date)

  async function submitDrops() {
    if (validRows.length === 0) {
      toast.error('Fill in at least one complete row (member, boss, item, date)')
      return
    }
    const skipped = rows.length - validRows.length
    setSubmittingDrops(true)
    const inserts = validRows.map(r => ({
      user_id: r.userId,
      character_id: r.characterId || null,
      boss: r.boss,
      item: r.item.trim(),
      pitched: r.pitched,
      dropped_at: r.date,
    }))
    const { error } = await supabase.from('boss_drops').insert(inserts)
    if (error) {
      toast.error('Failed to insert drops')
    } else {
      toast.success(
        `${validRows.length} drop${validRows.length !== 1 ? 's' : ''} inserted` +
        (skipped > 0 ? ` (${skipped} incomplete row${skipped !== 1 ? 's' : ''} skipped)` : '')
      )
      setRows([newRow()])
    }
    setSubmittingDrops(false)
  }

  // --- Meso override ---
  function handleMesoMemberChange(userId: string) {
    setMesoUserId(userId)
    const existing = allMeso.find(m => m.user_id === userId)
    setMesoAmount(existing ? String(existing.amount) : '')
    setMesoGoal(existing?.goal ? String(existing.goal) : '')
  }

  async function saveMeso() {
    if (!mesoUserId) { toast.error('Select a member'); return }
    const amount = parseInt(mesoAmount)
    if (isNaN(amount) || amount < 0) { toast.error('Enter a valid meso amount'); return }
    const goal = mesoGoal ? parseInt(mesoGoal) : null
    if (mesoGoal && (isNaN(goal!) || goal! <= 0)) { toast.error('Enter a valid goal'); return }
    setSavingMeso(true)
    const { error } = await supabase
      .from('meso_savings')
      .upsert({ user_id: mesoUserId, amount, goal: goal ?? null })
    if (error) {
      toast.error('Failed to save meso')
    } else {
      toast.success('Meso saved')
      setAllMeso(prev => [
        ...prev.filter(m => m.user_id !== mesoUserId),
        { user_id: mesoUserId, amount, goal: goal ?? null } as MesoSavings,
      ])
    }
    setSavingMeso(false)
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-slate-400 text-sm">Bulk entry and overrides for guild data.</p>
      </div>

      {/* Bulk Drop Entry */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">Bulk Drop Entry</h2>
          <span className="text-slate-500 text-xs">{rows.length} row{rows.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2.5">Date</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2.5">Member</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2.5">Character</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2.5">Boss</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2.5">Item</th>
                <th className="text-center text-slate-400 text-xs font-medium px-3 py-2.5">Pitched</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const memberChars = allChars.filter(c => c.user_id === row.userId)
                return (
                  <tr key={row.key} className="border-b border-slate-700/50 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => updateRow(row.key, { date: e.target.value })}
                        className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500 w-32"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.userId}
                        onChange={e => updateRow(row.key, { userId: e.target.value, characterId: '' })}
                        className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500"
                      >
                        <option value="">— member —</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.ign}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.characterId}
                        onChange={e => updateRow(row.key, { characterId: e.target.value })}
                        disabled={!row.userId}
                        className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-40"
                      >
                        <option value="">— none —</option>
                        {memberChars.map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.is_main ? ' ★' : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.boss}
                        onChange={e => updateRow(row.key, { boss: e.target.value })}
                        className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500"
                      >
                        <option value="">— boss —</option>
                        {BOSSES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.item}
                        onChange={e => updateRow(row.key, { item: e.target.value })}
                        placeholder="item name"
                        className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500 w-36"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.pitched}
                        onChange={e => updateRow(row.key, { pitched: e.target.checked })}
                        className="accent-teal-500 w-4 h-4"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length === 1}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-30 text-xs leading-none"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3">
          <button onClick={addRow} className="text-xs text-teal-400 hover:text-teal-300">
            + Add row
          </button>
          <button
            onClick={submitDrops}
            disabled={submittingDrops || validRows.length === 0}
            className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md"
          >
            {submittingDrops ? 'Inserting…' : `Insert ${validRows.length} drop${validRows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </section>

      {/* Meso Override */}
      <section>
        <h2 className="text-white font-semibold text-sm mb-3">Meso Override</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 max-w-sm">
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Member</label>
              <select
                value={mesoUserId}
                onChange={e => handleMesoMemberChange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="">— select member —</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.ign}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Amount (meso)</label>
              <input
                type="number"
                min={0}
                value={mesoAmount}
                onChange={e => setMesoAmount(e.target.value)}
                placeholder="e.g. 5000000000"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Goal (optional)</label>
              <input
                type="number"
                min={0}
                value={mesoGoal}
                onChange={e => setMesoGoal(e.target.value)}
                placeholder="e.g. 10000000000"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={saveMeso}
              disabled={savingMeso || !mesoUserId}
              className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md"
            >
              {savingMeso ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
