import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

export default function Guild() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .order('role')
      .order('ign')
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load members')
        else setMembers(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Guild Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">Click a member to view their profile and gear.</p>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-slate-500 text-sm">No members found.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => navigate(`/player/${member.id}`)}
              className="text-left bg-slate-800 border border-slate-700 hover:border-teal-700 rounded-lg px-4 py-3 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-semibold group-hover:text-teal-300 transition-colors">
                  {member.ign}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  member.role === 'admin'
                    ? 'bg-amber-900 text-amber-300 border border-amber-700'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {member.role}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">{member.email}</p>
            </button>
          ))}
        </div>
      )}

      <p className="text-slate-600 text-xs mt-8">Full stat cards and leaderboard coming in Phase 2.</p>
    </div>
  )
}
