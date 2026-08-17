import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipForward } from 'lucide-react'
import { formatDuration } from '../../utils/workout'

const PRESET_DURATIONS = [60, 90, 120, 180]

interface RestTimerProps {
  autoStart?: boolean
  onDone?: () => void
}

export function RestTimer({ autoStart = false, onDone }: RestTimerProps) {
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(autoStart)
  const endTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // Reset when duration preset changes
  function selectDuration(d: number) {
    setDuration(d)
    setRemaining(d)
    setRunning(false)
    endTimeRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }

  // Start / pause
  function toggle() {
    if (running) {
      setRunning(false)
      endTimeRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    } else {
      // Use Date.now()-diff so background tabs don't drift
      endTimeRef.current = Date.now() + remaining * 1000
      setRunning(true)
    }
  }

  function skip() {
    setRunning(false)
    setRemaining(duration)
    endTimeRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    onDone?.()
  }

  // Tick loop using requestAnimationFrame + Date.now()-diff
  useEffect(() => {
    if (!running) return

    function tick() {
      if (!endTimeRef.current) return
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        setRunning(false)
        setRemaining(duration)
        endTimeRef.current = null
        onDone?.()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running, duration, onDone])

  // Auto-start on mount if prop set
  useEffect(() => {
    if (autoStart) {
      endTimeRef.current = Date.now() + duration * 1000
      setRunning(true)
    }
  }, [autoStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const pct = remaining / duration
  const circumference = 2 * Math.PI * 28 // r=28

  return (
    <div
      className="flex flex-col items-center gap-4 p-5 rounded-[var(--radius-xl)]"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        Rest Timer
      </p>

      {/* Circular progress */}
      <div className="relative flex items-center justify-center">
        <svg width={72} height={72} className="-rotate-90">
          <circle cx={36} cy={36} r={28} fill="none" stroke="var(--color-surface-3)" strokeWidth={4} />
          <circle
            cx={36}
            cy={36}
            r={28}
            fill="none"
            stroke="var(--color-carbs)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <span
          className="absolute text-lg font-bold tabular-nums num-display"
          style={{ color: remaining <= 10 ? 'var(--color-protein)' : 'white' }}
        >
          {formatDuration(remaining)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--color-carbs)' }}
          aria-label={running ? 'Pause timer' : 'Start timer'}
        >
          {running ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" fill="white" />}
        </button>
        <button
          onClick={skip}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white transition-all active:scale-90"
          style={{ background: 'var(--color-surface-3)' }}
          aria-label="Skip rest"
        >
          <SkipForward size={14} />
        </button>
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-2">
        {PRESET_DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => selectDuration(d)}
            className={[
              'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
              d === duration
                ? 'text-white'
                : 'text-[var(--color-text-tertiary)] hover:text-white',
            ].join(' ')}
            style={
              d === duration
                ? { background: 'var(--color-surface-3)', border: '1px solid var(--color-carbs)' }
                : { background: 'var(--color-surface-3)', border: '1px solid transparent' }
            }
          >
            {d}s
          </button>
        ))}
      </div>
    </div>
  )
}
