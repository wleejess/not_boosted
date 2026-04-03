import type { PotentialTier } from '../types'

const TIER_STYLES: Record<PotentialTier, string> = {
  None: 'bg-slate-700 text-slate-400',
  Rare: 'bg-blue-900 text-blue-300 border border-blue-700',
  Epic: 'bg-purple-900 text-purple-300 border border-purple-700',
  Unique: 'bg-amber-900 text-amber-300 border border-amber-600',
  Legendary: 'bg-gradient-to-r from-red-900 to-orange-900 text-orange-300 border border-orange-600',
}

interface Props {
  tier: PotentialTier
  size?: 'sm' | 'md'
}

export default function PotentialBadge({ tier, size = 'md' }: Props) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`rounded font-semibold ${padding} ${TIER_STYLES[tier]}`}>
      {tier}
    </span>
  )
}
