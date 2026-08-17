import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { ToastContainer } from './components/ui/Toast'
import { Spinner } from './components/ui/Spinner'
import { Home } from './pages/Home'
import { Log } from './pages/Log'
import { Menu } from './pages/Menu'
import { Foods } from './pages/Foods'
import { Settings } from './pages/Settings'
import { Onboarding } from './pages/Onboarding'
import { useAppStore } from './store/useAppStore'

function AppShell() {
  const { isHydrated, profile, hydrate } = useAppStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-dvh bg-[var(--color-bg)]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-protein)] flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
          <span className="text-white text-2xl font-bold">MT</span>
        </div>
        <Spinner size="md" />
        <p className="text-xs text-[var(--color-text-tertiary)]">Loading MessTrack…</p>
      </div>
    )
  }

  // Gate on onboarding — show wizard on first launch
  if (!profile?.onboardingComplete) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/log" element={<Log />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/foods" element={<Foods />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <AppShell />
    </BrowserRouter>
  )
}
