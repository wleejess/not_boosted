export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-700/60 animate-pulse rounded-md ${className}`} />
}
