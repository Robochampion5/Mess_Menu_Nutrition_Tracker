import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Today',
  '/week': 'Week',
  '/menu': 'Menu',
  '/log': 'Log',
  '/workouts': 'Workouts',
  '/foods': 'Foods',
  '/settings': 'Settings',
}

interface MobileHeaderProps {
  onMenuOpen: () => void
  rightSlot?: React.ReactNode
}

export function MobileHeader({ onMenuOpen, rightSlot }: MobileHeaderProps) {
  const location = useLocation()
  const title = ROUTE_TITLES[location.pathname] ?? 'MessTrack'

  return (
    <header
      className="md:hidden flex items-center gap-3 px-4 h-14 flex-shrink-0 sticky top-0 z-30"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        className="p-2 -ml-2 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-2)] transition-all active:scale-90"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-protein)', boxShadow: 'var(--shadow-glow-protein)' }}
        >
          <span className="text-white text-[10px] font-bold font-display">MT</span>
        </div>
        <h1 className="text-base font-semibold text-white font-display tracking-tight">{title}</h1>
      </div>

      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </header>
  )
}
