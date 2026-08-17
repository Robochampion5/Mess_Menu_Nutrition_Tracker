import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
  loading?: boolean
}

const variantStyles: Record<string, string> = {
  primary: 'bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95',
  secondary: 'bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface-3)] active:scale-95',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-white active:scale-95',
  danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 active:scale-95',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-4 py-2.5 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-lg)]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth,
  loading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-200 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
