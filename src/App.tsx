import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SideNav } from './components/layout/SideNav'
import { MobileHeader } from './components/layout/MobileHeader'
import { ToastContainer } from './components/ui/Toast'
import { Spinner } from './components/ui/Spinner'
import { Home } from './pages/Home'
import { Log } from './pages/Log'
import { Menu } from './pages/Menu'
import { Foods } from './pages/Foods'
import { Settings } from './pages/Settings'
import { Weekly } from './pages/Weekly'
import { Workouts } from './pages/Workouts'
import { Onboarding } from './pages/Onboarding'
import { useAppStore } from './store/useAppStore'

function AppShell() {
  const { isHydrated, profile, hydrate } = useAppStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  if (!isHydrated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-dvh bg-[var(--color-bg)]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
          style={{
            background: 'var(--color-protein)',
            boxShadow: 'var(--shadow-glow-protein)',
          }}
        >
          <span className="text-white text-2xl font-bold font-display">MT</span>
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
    <div className="flex min-h-dvh">
      {/* Sidebar — desktop persistent, mobile drawer */}
      <SideNav mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-dvh">
        {/* Mobile top header */}
        <MobileHeader onMenuOpen={() => setMobileNavOpen(true)} />

        {/* Page content */}
        <main className="flex-1 flex flex-col page-enter">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/week" element={<Weekly />} />
            <Route path="/log" element={<Log />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/foods" element={<Foods />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
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
