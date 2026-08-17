import { NavLink } from 'react-router-dom'
import { Home, BookOpen, UtensilsCrossed, Database, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/log', icon: UtensilsCrossed, label: 'Log' },
  { to: '/menu', icon: BookOpen, label: 'Menu' },
  { to: '/foods', icon: Database, label: 'Foods' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 h-14">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-[var(--radius-md)]',
                'transition-all duration-200 select-none',
                isActive
                  ? 'text-[var(--color-protein)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'drop-shadow-[0_0_6px_var(--color-protein)]' : ''}
                />
                <span className="text-[9px] font-medium tracking-wide uppercase leading-none">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
