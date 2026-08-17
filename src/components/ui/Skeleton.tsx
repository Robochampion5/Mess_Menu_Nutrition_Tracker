interface SkeletonProps {
  className?: string
  height?: string | number
  width?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const roundedMap = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  xl: 'rounded-[var(--radius-xl)]',
  full: 'rounded-full',
}

export function Skeleton({ className = '', height, width, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={['skeleton', roundedMap[rounded], className].filter(Boolean).join(' ')}
      style={{ height, width }}
      aria-hidden="true"
    />
  )
}

/** Pre-built skeleton for a stat card (number + label) */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={['rounded-[var(--radius-xl)] p-4', className].join(' ')}
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <Skeleton height={28} className="w-16 mb-2" />
      <Skeleton height={12} className="w-12" />
    </div>
  )
}

/** Pre-built skeleton for a list row */
export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div
      className={['rounded-[var(--radius-xl)] p-4 flex items-center gap-3', className].join(' ')}
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <Skeleton height={40} width={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-32" />
        <Skeleton height={11} className="w-20" />
      </div>
    </div>
  )
}

/** Rings skeleton */
export function SkeletonRings({ size = 220 }: { size?: number }) {
  return (
    <div
      className="skeleton rounded-full"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
