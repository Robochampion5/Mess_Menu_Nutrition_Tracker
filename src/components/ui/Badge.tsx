type BadgeVariant = 'protein' | 'calories' | 'carbs' | 'success' | 'warning' | 'neutral' | 'skipped'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  size?: 'sm' | 'md'
}

const styles: Record<BadgeVariant, string> = {
  protein: 'bg-[var(--color-protein)]/20 text-[var(--color-protein)]',
  calories: 'bg-[var(--color-calories)]/20 text-[var(--color-calories)]',
  carbs: 'bg-[var(--color-carbs)]/20 text-[var(--color-carbs)]',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-amber-500/20 text-amber-400',
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
  skipped: 'bg-[var(--color-surface-3)] text-[var(--color-text-tertiary)]',
}

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export function Badge({ variant = 'neutral', children, size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${styles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  )
}
