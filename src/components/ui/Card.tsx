import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const baseClass = [
    'bg-[var(--color-surface)] rounded-[var(--radius-xl)]',
    paddingStyles[padding],
    onClick ? 'cursor-pointer active:scale-[0.99] transition-transform duration-100' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button className={baseClass} onClick={onClick} type="button">
        {children}
      </button>
    )
  }

  return <div className={baseClass}>{children}</div>
}
