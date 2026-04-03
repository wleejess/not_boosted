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

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-amber-400 font-bold text-xl">{formatMeso(amount)}</span>
        {goal && (
          <span className="text-slate-500 text-sm">/ {formatMeso(goal)}</span>
        )}
      </div>
      {pct !== null && (
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full transition-all"
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
