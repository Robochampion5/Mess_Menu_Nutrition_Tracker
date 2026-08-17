interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export function Stepper({ value, onChange, min = 0, max = 10, step = 0.5, label }: StepperProps) {
  const decrement = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10))
  const increment = () => onChange(Math.min(max, Math.round((value + step) * 10) / 10))

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-[var(--color-text-secondary)] mr-1">{label}</span>}
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease"
        className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] text-white flex items-center justify-center
                   hover:bg-[var(--color-surface-3)] active:scale-90 transition-all disabled:opacity-30"
      >
        <span className="text-lg leading-none select-none">−</span>
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase"
        className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] text-white flex items-center justify-center
                   hover:bg-[var(--color-surface-3)] active:scale-90 transition-all disabled:opacity-30"
      >
        <span className="text-lg leading-none select-none">+</span>
      </button>
    </div>
  )
}
