import { Link } from 'react-router-dom'
import OfflineIndicator from '../components/OfflineIndicator'

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4">
        <OfflineIndicator />
      </div>
      <h1 className="text-3xl font-bold">అర్థం</h1>
      <p className="mt-1 text-lg text-slate-600">Ardham</p>
      <p className="mt-4 text-sm text-slate-500">
        Make sure the borrower understands the loan before they sign.
      </p>
      <Link
        to="/choose-loan"
        className="mt-10 w-full rounded-xl bg-slate-900 py-4 text-lg font-medium text-white active:scale-[0.98]"
      >
        Start a new session
      </Link>
      <p className="mt-6 text-xs text-slate-400">
        All sample data is fictional. Not legal or financial advice.
      </p>
    </div>
  )
}
