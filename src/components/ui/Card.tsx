import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg' | 'none'
  variant?: 'default' | 'glass' | 'raised'
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
  variant = 'default',
}: CardProps) {
  const baseClass = [
    'rounded-[var(--radius-xl)]',
    variant === 'glass' ? 'glass' : 'bg-[var(--color-surface)]',
    paddingStyles[padding],
    onClick
      ? [
          'cursor-pointer select-none',
          'transition-all duration-200',
          'active:scale-[0.98] active:opacity-90',
          'hover:bg-[var(--color-surface-2)]',
        ].join(' ')
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const shadowStyle =
    variant === 'raised'
      ? { boxShadow: 'var(--shadow-card-raised)', border: '1px solid rgba(255,255,255,0.06)' }
      : { boxShadow: 'var(--shadow-card)', border: '1px solid rgba(255,255,255,0.04)' }

  if (onClick) {
    return (
      <button className={baseClass} style={shadowStyle} onClick={onClick} type="button">
        {children}
      </button>
    )
  }

  return (
    <div className={baseClass} style={shadowStyle}>
      {children}
    </div>
  )
}
