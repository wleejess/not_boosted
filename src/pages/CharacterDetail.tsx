import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { GEAR_SLOTS } from '../types'
import type { Character, GearSlot, PotentialTier } from '../types'
import StarDisplay from '../components/StarDisplay'
import PotentialBadge from '../components/PotentialBadge'

const POTENTIAL_TIERS: PotentialTier[] = ['None', 'Rare', 'Epic', 'Unique', 'Legendary']

type GearSlotMap = Record<string, GearSlot>

function slotsToMap(slots: GearSlot[]): GearSlotMap {
  return Object.fromEntries(slots.map(s => [s.slot_name, s]))
}

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [character, setCharacter] = useState<Character | null>(null)
  const [slots, setSlots] = useState<GearSlotMap>({})
  const [draft, setDraft] = useState<GearSlotMap>({})
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (!editing) return
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [editing, dirty])

  async function fetchData() {
    setLoading(true)
    const [charRes, slotsRes] = await Promise.all([
      supabase.from('characters').select('*').eq('id', id).single(),
      supabase.from('gear_slots').select('*').eq('character_id', id),
    ])
    if (charRes.error || !charRes.data) {
      toast.error('Character not found')
      navigate('/characters')
      return
    }
    setCharacter(charRes.data)
    const map = slotsToMap(slotsRes.data ?? [])
    setSlots(map)
    setDraft(map)
    setLoading(false)
  }

  function startEdit() {
    setDraft({ ...slots })
    setEditing(true)
    setDirty(false)
  }

  function cancelEdit() {
    setDraft({ ...slots })
    setEditing(false)
    setDirty(false)
  }

  function updateDraft(slotName: string, field: keyof GearSlot, value: string | number) {
    setDraft(prev => ({
      ...prev,
      [slotName]: { ...prev[slotName], [field]: value },
    }))
    setDirty(true)
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    const updates = Object.values(draft).map(slot => ({
      id: slot.id,
      character_id: slot.character_id,
      slot_name: slot.slot_name,
      stars: slot.stars,
      flame_score: slot.flame_score,
      potential_tier: slot.potential_tier,
      potential_line1: slot.potential_line1,
      potential_line2: slot.potential_line2,
      potential_line3: slot.potential_line3,
    }))
    const { error } = await supabase.from('gear_slots').upsert(updates)
    if (error) {
      toast.error('Failed to save gear')
    } else {
      setSlots(draft)
      setEditing(false)
      setDirty(false)
      toast.success('Gear saved')
    }
    setSaving(false)
  }, [draft])

  const canEdit = user && character && (user.id === character.user_id || user.role === 'admin')

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading…</p>
  }

  if (!character) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <button
            onClick={() => {
              if (dirty && !confirm('You have unsaved changes. Leave anyway?')) return
              navigate('/characters')
            }}
            className="text-slate-500 hover:text-slate-300 text-sm mb-2 inline-flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">{character.name}</h1>
          <p className="text-slate-400 text-sm">{character.class} · Lv {character.level}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2 shrink-0 mt-6">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="px-3 py-1.5 text-sm text-white bg-slate-700 hover:bg-slate-600 rounded-md"
              >
                Edit Gear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gear Grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GEAR_SLOTS.map(slotName => {
          const slot = editing ? draft[slotName] : slots[slotName]
          if (!slot) {
            return (
              <div key={slotName} className="bg-slate-800 border border-slate-700 rounded-lg p-3 opacity-40">
                <p className="text-slate-500 text-xs font-medium">{slotName}</p>
                <p className="text-slate-600 text-xs mt-1">No data</p>
              </div>
            )
          }

          return (
            <div key={slotName} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-slate-400 text-xs font-medium mb-2">{slotName}</p>

              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-slate-500 text-[10px]">Stars</label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                        value={slot.stars}
                        onChange={e => updateDraft(slotName, 'stars', Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-slate-500 text-[10px]">Flame</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                        value={slot.flame_score}
                        onChange={e => updateDraft(slotName, 'flame_score', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px]">Potential Tier</label>
                    <select
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                      value={slot.potential_tier}
                      onChange={e => updateDraft(slotName, 'potential_tier', e.target.value)}
                    >
                      {POTENTIAL_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {(['potential_line1', 'potential_line2', 'potential_line3'] as const).map((line, i) => (
                    <input
                      key={line}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                      value={slot[line]}
                      onChange={e => updateDraft(slotName, line, e.target.value)}
                      placeholder={`Line ${i + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <StarDisplay stars={slot.stars} size="sm" />
                    {slot.flame_score > 0 && (
                      <span className="text-emerald-400 text-[10px]">🔥 {slot.flame_score}</span>
                    )}
                  </div>
                  <PotentialBadge tier={slot.potential_tier} size="sm" />
                  {(slot.potential_line1 || slot.potential_line2 || slot.potential_line3) && (
                    <div className="space-y-0.5 mt-1">
                      {[slot.potential_line1, slot.potential_line2, slot.potential_line3]
                        .filter(Boolean)
                        .map((line, i) => (
                          <p key={i} className="text-slate-400 text-[10px] leading-tight">{line}</p>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
