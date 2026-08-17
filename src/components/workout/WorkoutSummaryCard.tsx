import { useNavigate } from 'react-router-dom'
import { Dumbbell, Trophy, ChevronRight, Plus } from 'lucide-react'
import type { WorkoutSession, PersonalRecord } from '../../types'

interface WorkoutSummaryCardProps {
  session: WorkoutSession | null
  newPRCount?: number
  personalRecords?: Map<string, PersonalRecord>
}

export function WorkoutSummaryCard({ session, newPRCount = 0 }: WorkoutSummaryCardProps) {
  const navigate = useNavigate()

  if (!session) {
    return (
      <button
        onClick={() => navigate('/workouts')}
        className="w-full flex items-center gap-4 px-4 py-4 rounded-[var(--radius-xl)] text-left transition-all duration-200 active:scale-[0.98] hover:bg-[var(--color-surface-2)]"
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-surface-2)' }}
        >
          <Dumbbell size={18} className="text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">No workout today</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Tap to log a session</p>
        </div>
        <Plus size={16} className="text-[var(--color-text-tertiary)]" />
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate('/workouts')}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-[var(--radius-xl)] text-left transition-all duration-200 active:scale-[0.98] hover:bg-[var(--color-surface-2)]"
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(255,55,95,0.15)',
          border: '1px solid rgba(255,55,95,0.2)',
        }}
      >
        <Dumbbell size={18} style={{ color: 'var(--color-protein)' }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{session.name || 'Workout logged'}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
          {newPRCount > 0 && (
            <span
              className="ml-2 inline-flex items-center gap-0.5"
              style={{ color: 'var(--color-protein)' }}
            >
              <Trophy size={10} /> {newPRCount} PR{newPRCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>
      <ChevronRight size={16} className="text-[var(--color-text-tertiary)]" />
    </button>
  )
}
