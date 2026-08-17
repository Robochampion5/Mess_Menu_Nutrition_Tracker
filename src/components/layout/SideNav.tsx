import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  BookOpen,
  UtensilsCrossed,
  Dumbbell,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Today', end: true },
  { to: '/week', icon: CalendarDays, label: 'Week', end: false },
  { to: '/menu', icon: BookOpen, label: 'Menu', end: false },
  { to: '/log', icon: UtensilsCrossed, label: 'Log', end: false },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts', end: false },
  { to: '/foods', icon: Database, label: 'Foods', end: false },
  { to: '/settings', icon: Settings, label: 'Settings', end: false },
] as const

const LS_KEY = 'messtrack-sidebar-expanded'

interface SideNavProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function SideNav({ mobileOpen, onMobileClose }: SideNavProps) {
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== 'false'
    } catch {
      return true
    }
  })

  const drawerRef = useRef<HTMLElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  // Persist desktop collapsed state
  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    try {
      localStorage.setItem(LS_KEY, String(next))
    } catch {}
  }

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen) onMobileClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus trap & keyboard handling for mobile
  useEffect(() => {
    if (!mobileOpen) return

    firstFocusRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onMobileClose()
        return
      }
      // Basic focus trap
      if (e.key !== 'Tab' || !drawerRef.current) return
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onMobileClose])

  // Swipe-to-close on mobile
  useEffect(() => {
    if (!mobileOpen) return
    let startX = 0
    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0]?.clientX ?? 0
    }
    function onTouchEnd(e: TouchEvent) {
      const dx = (e.changedTouches[0]?.clientX ?? 0) - startX
      if (dx < -60) onMobileClose()
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [mobileOpen, onMobileClose])

  const sidebarContent = (isMobile: boolean) => (
    <nav
      ref={isMobile ? drawerRef : undefined}
      aria-label="Main navigation"
      className={[
        'flex flex-col h-full py-4 overflow-hidden',
        isMobile ? '' : expanded ? 'w-[240px]' : 'w-16',
        'transition-[width] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]',
      ]
        .filter(Boolean)
        .join(' ')}
      style={isMobile ? { width: 240 } : undefined}
    >
      {/* Logo / brand */}
      <div
        className={[
          'flex items-center mb-6 px-3',
          !isMobile && !expanded ? 'justify-center' : 'gap-3 pl-4',
        ].join(' ')}
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--color-protein)] flex items-center justify-center shadow-lg flex-shrink-0"
          style={{ boxShadow: 'var(--shadow-glow-protein)' }}>
          <span className="text-white text-xs font-bold font-display">MT</span>
        </div>
        {(isMobile || expanded) && (
          <span className="text-white font-semibold font-display text-sm tracking-tight">
            MessTrack
          </span>
        )}
        {/* Mobile close button */}
        {isMobile && (
          <button
            ref={firstFocusRef}
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="ml-auto p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]',
                'transition-all duration-150 select-none group',
                !isMobile && !expanded ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-[var(--color-surface-3)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-2)]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={[
                    'flex-shrink-0 transition-transform duration-150',
                    isActive ? 'text-[var(--color-protein)]' : '',
                    'group-hover:scale-110',
                  ].join(' ')}
                />
                {(isMobile || expanded) && (
                  <span className={['text-sm font-medium', isActive ? 'font-semibold' : ''].join(' ')}>
                    {label}
                  </span>
                )}
                {/* Active indicator pill */}
                {isActive && (isMobile || expanded) && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--color-protein)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Desktop collapse toggle */}
      {!isMobile && (
        <div className="px-2 mt-2">
          <button
            onClick={toggleExpanded}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]',
              'text-[var(--color-text-tertiary)] hover:text-white hover:bg-[var(--color-surface-2)]',
              'transition-all duration-150',
              !expanded ? 'justify-center px-0' : '',
            ].join(' ')}
          >
            {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {expanded && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      )}
    </nav>
  )

  return (
    <>
      {/* ── Desktop sidebar ── (hidden on mobile) */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 h-dvh sticky top-0 z-30"
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-drawer)',
          width: expanded ? 240 : 64,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Mobile overlay drawer ── (hidden on desktop) */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="sidebar-backdrop md:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed left-0 top-0 bottom-0 z-50 md:hidden flex flex-col glass"
            style={{
              width: 240,
              transform: 'translateX(0)',
              transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: 'var(--shadow-drawer)',
            }}
          >
            {sidebarContent(true)}
          </aside>
        </>
      )}
    </>
  )
}
