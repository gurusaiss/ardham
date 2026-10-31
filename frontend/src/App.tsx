import { Route, Routes } from 'react-router-dom'
import DebugPanel from './components/DebugPanel'
import Home from './pages/Home'
import Auth from './pages/Auth'
import ChooseLoanType from './pages/ChooseLoanType'
import Scan from './pages/Scan'
import Review from './pages/Review'
import Explain from './pages/Explain'
import Quiz from './pages/Quiz'
import Result from './pages/Result'
import Certificate from './pages/Certificate'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/choose-loan" element={<ChooseLoanType />} />
        <Route path="/scan/:loanType" element={<Scan />} />
        <Route path="/review/:sessionId" element={<Review />} />
        <Route path="/explain/:sessionId" element={<Explain />} />
        <Route path="/quiz/:sessionId" element={<Quiz />} />
        <Route path="/result/:sessionId" element={<Result />} />
        <Route path="/certificate/:sessionId" element={<Certificate />} />
      </Routes>
      <DebugPanel />
    </>
  )
}
