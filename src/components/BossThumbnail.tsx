interface Props {
  boss: string
  size?: number
}

export default function BossThumbnail({ boss, size = 36 }: Props) {
  return (
    <div
      style={{ width: size, height: size, minWidth: size }}
      className="rounded bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0"
    >
      {boss.charAt(0).toUpperCase()}
    </div>
  )
}
