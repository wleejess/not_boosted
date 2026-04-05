interface Props {
  amount: number
  goal: number | null
}

function formatMeso(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}b`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}m`
  return n.toLocaleString()
}

export default function MesoProgress({ amount, goal }: Props) {
  const pct = goal && goal > 0 ? Math.min((amount / goal) * 100, 100) : null
  const goalReached = pct === 100

  return (
    <div className="space-y-1.5">
      {goalReached && (
        <p className="text-amber-400 text-xs font-semibold">Goal reached! 🎉</p>
      )}
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 inline-block" />
          <span className="text-amber-400 font-bold text-xl">{formatMeso(amount)}</span>
        </div>
        {goal && (
          <span className="text-slate-500 text-sm">/ {formatMeso(goal)}</span>
        )}
      </div>
      {pct !== null && (
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              goalReached
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-teal-500 to-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.45)]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {pct !== null && (
        <p className="text-slate-500 text-xs">{pct.toFixed(0)}% of goal</p>
      )}
    </div>
  )
}
