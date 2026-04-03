import { format } from 'date-fns'
import type { BossDrop } from '../types'

interface Props {
  drop: BossDrop & { character_name?: string; user_ign?: string }
  canDelete: boolean
  onDelete: (id: string) => void
}

export default function DropFeedCard({ drop, canDelete, onDelete }: Props) {
  const isPitched = drop.pitched

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg bg-slate-800 border ${isPitched ? 'border-amber-500' : 'border-slate-700'}`}>
      {isPitched && (
        <span className="text-amber-400 text-lg mt-0.5">★</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm truncate">{drop.item}</span>
          {isPitched && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-600">
              PITCHED
            </span>
          )}
        </div>
        <div className="text-slate-400 text-xs mt-0.5 space-x-1">
          <span>{drop.boss}</span>
          <span className="text-slate-600">·</span>
          {drop.character_name && <span>{drop.character_name}</span>}
          {drop.user_ign && <span className="text-slate-500">({drop.user_ign})</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-slate-500 text-xs">
          {format(new Date(drop.dropped_at), 'MMM d')}
        </span>
        {canDelete && (
          <button
            onClick={() => onDelete(drop.id)}
            className="text-slate-500 hover:text-red-400 text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
