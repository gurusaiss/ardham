export default function ErrorBanner({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof Error ? error.message : String(error)

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        <button
          onClick={onRetry}
          className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 active:scale-95"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
