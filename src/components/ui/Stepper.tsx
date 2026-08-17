import { useState } from 'react'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  label,
  unit,
}: StepperProps) {
  const [decAnim, setDecAnim] = useState(false)
  const [incAnim, setIncAnim] = useState(false)

  function decrement() {
    if (value <= min) return
    onChange(Math.max(min, Math.round((value - step) * 10) / 10))
    setDecAnim(true)
    setTimeout(() => setDecAnim(false), 180)
  }

  function increment() {
    if (value >= max) return
    onChange(Math.min(max, Math.round((value + step) * 10) / 10))
    setIncAnim(true)
    setTimeout(() => setIncAnim(false), 180)
  }

  const btnBase =
    'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-100 select-none'
  const btnEnabled =
    'bg-[var(--color-surface-2)] text-white hover:bg-[var(--color-surface-3)] active:scale-90'
  const btnDisabled = 'opacity-30 cursor-not-allowed bg-[var(--color-surface-2)] text-white'

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-[var(--color-text-secondary)] mr-1 font-medium">{label}</span>
      )}
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease"
        className={[
          btnBase,
          value <= min ? btnDisabled : btnEnabled,
          decAnim ? 'stepper-tap' : '',
        ].join(' ')}
      >
        <span className="text-lg leading-none select-none">−</span>
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums num-large">
        {value}
        {unit ? (
          <span className="text-[10px] text-[var(--color-text-secondary)] ml-0.5">{unit}</span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase"
        className={[
          btnBase,
          value >= max ? btnDisabled : btnEnabled,
          incAnim ? 'stepper-tap' : '',
        ].join(' ')}
      >
        <span className="text-lg leading-none select-none">+</span>
      </button>
    </div>
  )
}
