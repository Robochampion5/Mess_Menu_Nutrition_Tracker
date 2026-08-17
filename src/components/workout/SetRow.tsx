import { Trash2 } from 'lucide-react'
import { Stepper } from '../ui/Stepper'
import { PRBadge } from './PRBadge'
import type { WorkoutSet, TrackingType } from '../../types'

interface SetRowProps {
  setNumber: number
  set: WorkoutSet
  trackingType: TrackingType
  onChange: (updated: WorkoutSet) => void
  onDelete: () => void
  isNewPR?: boolean
  preferredUnit?: 'kg' | 'lb'
}

export function SetRow({
  setNumber,
  set,
  trackingType,
  onChange,
  onDelete,
  isNewPR = false,
  preferredUnit = 'kg',
}: SetRowProps) {
  const unit = set.unit ?? preferredUnit

  function toggleFailure() {
    onChange({ ...set, isFailure: !set.isFailure })
  }

  return (
    <div
      className={[
        'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] transition-all duration-200',
        set.isFailure ? 'opacity-60' : '',
      ].join(' ')}
      style={{
        background: isNewPR
          ? 'rgba(255, 55, 95, 0.08)'
          : 'var(--color-surface-2)',
        border: isNewPR
          ? '1px solid rgba(255, 55, 95, 0.25)'
          : '1px solid var(--color-border)',
      }}
    >
      {/* Set number */}
      <span
        className="w-6 text-center text-xs font-bold tabular-nums flex-shrink-0"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {setNumber}
      </span>

      {trackingType === 'sets_reps_weight' && (
        <>
          <Stepper
            value={set.reps ?? 0}
            onChange={(v) => onChange({ ...set, reps: v })}
            min={0}
            max={100}
            step={1}
            label="Reps"
          />
          <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--color-border)' }} />
          <Stepper
            value={set.weight ?? 0}
            onChange={(v) => {
              const weightKg = unit === 'lb' ? v * 0.453592 : v
              onChange({ ...set, weight: v, unit, weightKg })
            }}
            min={0}
            max={unit === 'lb' ? 1200 : 500}
            step={unit === 'lb' ? 5 : 2.5}
            label={unit.toUpperCase()}
          />
        </>
      )}

      {trackingType === 'duration' && (
        <Stepper
          value={Math.round((set.duration ?? 0) / 60)}
          onChange={(v) => onChange({ ...set, duration: v * 60 })}
          min={0}
          max={120}
          step={1}
          label="Min"
        />
      )}

      {trackingType === 'distance_duration' && (
        <>
          <Stepper
            value={set.distance ?? 0}
            onChange={(v) => onChange({ ...set, distance: v })}
            min={0}
            max={100}
            step={0.5}
            label="km"
          />
          <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--color-border)' }} />
          <Stepper
            value={Math.round((set.duration ?? 0) / 60)}
            onChange={(v) => onChange({ ...set, duration: v * 60 })}
            min={0}
            max={300}
            step={1}
            label="Min"
          />
        </>
      )}

      {/* Failure toggle */}
      <button
        onClick={toggleFailure}
        title={set.isFailure ? 'Mark as completed' : 'Mark as failed'}
        className={[
          'w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all',
          set.isFailure
            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            : 'bg-[var(--color-surface-3)] text-[var(--color-text-tertiary)]',
        ].join(' ')}
      >
        F
      </button>

      {/* PR badge */}
      {isNewPR && !set.isFailure && <PRBadge />}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="ml-auto p-1 rounded text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
        aria-label="Delete set"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
