import { DAY_SHORT } from '../../types'

interface WorkoutFrequencyStripProps {
  /** ISO date strings of days this week that had a workout */
  trainedDates: Set<string>
  /** ISO date strings for this week (Mon–Sun) */
  weekDates: string[]
}

export function WorkoutFrequencyStrip({ trainedDates, weekDates }: WorkoutFrequencyStripProps) {
  const today = new Date().toISOString().split('T')[0]!

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-text-tertiary)] font-medium w-16 flex-shrink-0">
        Trained
      </span>
      <div className="flex items-center gap-1.5">
        {weekDates.map((date, i) => {
          const trained = trainedDates.has(date)
          const isToday = date === today
          const isFuture = date > today!

          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: trained
                    ? 'var(--color-protein)'
                    : isFuture
                      ? 'var(--color-surface-2)'
                      : 'var(--color-surface-3)',
                  boxShadow: trained ? 'var(--shadow-glow-protein)' : undefined,
                  border: isToday ? '2px solid var(--color-carbs)' : '2px solid transparent',
                  opacity: isFuture ? 0.4 : 1,
                }}
                title={date}
              >
                {trained && (
                  <span className="text-white text-[8px] font-bold">✓</span>
                )}
              </div>
              <span
                className="text-[9px] font-medium"
                style={{
                  color: isToday ? 'var(--color-carbs)' : 'var(--color-text-tertiary)',
                }}
              >
                {(DAY_SHORT[i] ?? '').slice(0, 2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
