import { type ReactNode, type ElementType } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ElementType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  children,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      ].join(' ')}
    >
      {/* Icon glow container */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--color-surface-2)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Icon size={28} className="text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
      </div>

      <h3 className="text-base font-semibold text-white mb-1 font-display">{title}</h3>

      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}

      {!description && action && <div className="mb-5" />}

      {action && (
        <Button variant="primary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {children}
    </div>
  )
}
