export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-app-elevated rounded-2xl p-4 space-y-3"
        >
          <div className="h-4 w-1/3 rounded bg-app-surface" />
          <div className="h-3 w-2/3 rounded bg-app-surface" />
          <div className="h-3 w-1/4 rounded bg-app-surface" />
        </div>
      ))}
    </div>
  )
}
