export function ProgressBar({
  value,
}: {
  value: number
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-app-muted">
        <span>Progress</span>

        <span>{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-app-elevated">
        <div
          style={{
            width: `${value}%`,
          }}
          className="h-full rounded-full bg-white transition-all"
        />
      </div>
    </div>
  )
}