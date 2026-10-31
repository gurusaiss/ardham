import type { ReactNode } from 'react'
import OfflineIndicator from './OfflineIndicator'

export default function StepLayout({
  title,
  teluguTitle,
  children,
}: {
  title: string
  teluguTitle?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {teluguTitle && <p className="text-sm text-slate-500">{teluguTitle}</p>}
        </div>
        <OfflineIndicator />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-8 border-t pt-3 text-xs text-slate-400">
        Ardham assists the field officer. It is not legal or financial advice. All sample
        data shown is fictional.
      </footer>
    </div>
  )
}
