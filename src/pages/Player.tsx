import { useParams } from 'react-router-dom'

export default function Player() {
  const { userId } = useParams()
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Player Profile</h1>
      <p className="text-slate-500 text-sm">User: {userId} — Coming soon (Phase 2)</p>
    </div>
  )
}
