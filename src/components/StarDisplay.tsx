interface Props {
  stars: number
  size?: 'sm' | 'md'
}

export default function StarDisplay({ stars, size = 'md' }: Props) {
  const starSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const filled = Math.min(stars, 25)
  const empty = 25 - filled

  // Stars 0-15 are yellow, 16-25 are red-orange (Superior Equipment)
  const filledColor = stars > 15 ? 'text-orange-400' : 'text-amber-400'

  return (
    <span className={`font-mono leading-none ${starSize}`}>
      <span className={filledColor}>{'★'.repeat(filled)}</span>
      <span className="text-slate-600">{'★'.repeat(empty)}</span>
    </span>
  )
}
