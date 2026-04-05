import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { GEAR_SLOTS } from '../types'
import type { Character } from '../types'
import ConfirmModal from '../components/ConfirmModal'
import CharacterSprite from '../components/CharacterSprite'
import Skeleton from '../components/Skeleton'
import { fetchCharacterFromNexon } from '../lib/mapleApi'

interface CharacterForm {
  name: string
  class: string
  level: string
  is_main: boolean
}

const EMPTY_FORM: CharacterForm = { name: '', class: '', level: '', is_main: false }

export default function Characters() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CharacterForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null)
  const [lookupImgUrl, setLookupImgUrl] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchCharacters()
  }, [user])

  async function fetchCharacters() {
    setLoading(true)
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_main', { ascending: false })
      .order('created_at')
    if (error) toast.error('Failed to load characters')
    else setCharacters(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setLookupImgUrl(null)
    setShowModal(true)
  }

  function openEdit(char: Character) {
    setEditingId(char.id)
    setForm({ name: char.name, class: char.class, level: String(char.level), is_main: char.is_main })
    setLookupImgUrl(char.character_img_url ?? null)
    setShowModal(true)
  }

  async function handleLookup() {
    if (!form.name.trim()) return
    setLooking(true)
    const result = await fetchCharacterFromNexon(form.name.trim())
    if (result) {
      setForm(f => ({ ...f, class: result.jobName, level: String(result.level) }))
      setLookupImgUrl(result.characterImgURL)
      toast.success(`Found ${form.name.trim()} — Lv ${result.level} ${result.jobName}`)
    } else {
      toast.error('Character not found on rankings — fill in manually')
    }
    setLooking(false)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.class.trim() || !form.level) {
      toast.error('Please fill in all fields')
      return
    }
    const level = parseInt(form.level)
    if (isNaN(level) || level < 1 || level > 300) {
      toast.error('Level must be between 1 and 300')
      return
    }
    setSaving(true)

    if (editingId) {
      const { error } = await supabase
        .from('characters')
        .update({ name: form.name.trim(), class: form.class.trim(), level, is_main: form.is_main, character_img_url: lookupImgUrl })
        .eq('id', editingId)
      if (error) toast.error('Failed to save character')
      else {
        toast.success('Character updated')
        setShowModal(false)
        fetchCharacters()
      }
    } else {
      const { data, error } = await supabase
        .from('characters')
        .insert({ user_id: user!.id, name: form.name.trim(), class: form.class.trim(), level, is_main: form.is_main, character_img_url: lookupImgUrl })
        .select()
        .single()
      if (error || !data) {
        toast.error('Failed to create character')
      } else {
        const slots = GEAR_SLOTS.map(slot => ({
          character_id: data.id,
          slot_name: slot,
          stars: 0,
          flame_score: 0,
          potential_tier: 'None' as const,
          potential_line1: '',
          potential_line2: '',
          potential_line3: '',
        }))
        await supabase.from('gear_slots').insert(slots)
        toast.success('Character created')
        setShowModal(false)
        fetchCharacters()
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('characters').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Failed to delete character')
    else {
      toast.success('Character deleted')
      setCharacters(prev => prev.filter(c => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Characters</h1>
          <p className="text-slate-400 text-sm mt-0.5">{user?.ign}</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          + Add Character
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-400 text-lg">No characters yet.</p>
          <p className="text-slate-500 text-sm">Add your first character to begin tracking your journey.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map(char => (
            <div
              key={char.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <CharacterSprite characterClass={char.class} size="sm" imgUrl={char.character_img_url} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{char.name}</span>
                      {char.is_main && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700">
                          MAIN
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">{char.class} · Lv {char.level}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(char)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(char)}
                    className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <button
                onClick={() => navigate(`/characters/${char.id}`)}
                className="w-full text-xs text-teal-400 hover:text-teal-300 border border-slate-700 hover:border-teal-800 rounded py-1.5 transition-colors"
              >
                View Gear →
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-white font-semibold text-lg mb-4">
              {editingId ? 'Edit Character' : 'Add Character'}
            </h2>

            <div className="flex gap-4 mb-5">
              {/* Live sprite preview */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <CharacterSprite
                  characterClass={form.class || 'warrior'}

                  size="md"
                  imgUrl={lookupImgUrl}
                />
                <span className="text-slate-500 text-[10px]">preview</span>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Character Name</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleLookup()}
                      placeholder="e.g. SkywiredBow"
                    />
                    <button
                      type="button"
                      onClick={handleLookup}
                      disabled={looking || !form.name.trim()}
                      className="px-3 py-2 text-xs font-medium bg-slate-600 hover:bg-slate-500 disabled:opacity-40 text-white rounded-md transition-colors shrink-0"
                    >
                      {looking ? '…' : 'Look up'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Class</label>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    value={form.class}
                    onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
                    placeholder="e.g. Bowmaster"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Level</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    placeholder="1–300"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_main: !f.is_main }))}
              className="flex items-center justify-between w-full mb-5"
            >
              <span className="text-slate-300 text-sm">Main character</span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.is_main ? 'bg-teal-600' : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_main ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Character"
          message={`Delete "${deleteTarget.name}"? This will also remove all gear data.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
