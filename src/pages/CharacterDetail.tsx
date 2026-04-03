import { useParams } from 'react-router-dom'

export default function CharacterDetail() {
  const { id } = useParams()
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Character Gear</h1>
      <p className="text-slate-500 text-sm">Character: {id} — Coming soon (Phase 1)</p>
    </div>
  )
}
