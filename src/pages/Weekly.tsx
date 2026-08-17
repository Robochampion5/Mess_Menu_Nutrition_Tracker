import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { WeeklyChart } from '../components/charts/WeeklyChart'
import { Badge } from '../components/ui/Badge'
import { SkeletonCard, SkeletonRow, Skeleton } from '../components/ui/Skeleton'
import { WorkoutFrequencyStrip } from '../components/workout/WorkoutFrequencyStrip'
import { useAppStore } from '../store/useAppStore'
import { logMacros, sumMacros } from '../utils/nutrition'
import { getWeekDates, toDateString } from '../utils/weekKey'
import { DAY_SHORT, type MealSlot } from '../types'

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner']

export function Weekly() {
  const { profile, foodItems, getDailyLogsForDate, dailyLogs, workoutSessions } = useAppStore()
  const [loading, setLoading] = useState(true)

  const weekDates = useMemo(() => getWeekDates(), [])
  const foodMap = useMemo(() => new Map(foodItems.map((f) => [f.id, f])), [foodItems])
  const proteinGoal = profile?.proteinGoalG ?? 120

  useEffect(() => {
    Promise.all(weekDates.map((date) => getDailyLogsForDate(date))).finally(() =>
      setLoading(false),
    )
  }, [weekDates, getDailyLogsForDate])

  const weekData = useMemo(() => {
    return weekDates.map((date, i) => {
      const logs = MEAL_SLOTS.map((slot) => dailyLogs.get(`${date}::${slot}`)).filter(Boolean)
      const macroList = logs.filter((r) => r!.status === 'ate').map((r) => logMacros(r!, foodMap))
      const totals = sumMacros(macroList)
      const goalHit = totals.protein >= proteinGoal
      const hasAnyLog = logs.length > 0
      return {
        date,
        day: DAY_SHORT[i] ?? '',
        protein: Math.round(totals.protein),
        calories: Math.round(totals.calories),
        goalHit,
        hasAnyLog,
        isToday: date === toDateString(),
        isFuture: date > toDateString(),
      }
    })
  }, [weekDates, dailyLogs, foodMap, proteinGoal])

  const avgProtein = useMemo(() => {
    const logged = weekData.filter((d) => d.hasAnyLog && !d.isFuture)
    if (logged.length === 0) return 0
    return Math.round(logged.reduce((sum, d) => sum + d.protein, 0) / logged.length)
  }, [weekData])

  const daysHit = useMemo(
    () => weekData.filter((d) => d.goalHit && !d.isFuture).length,
    [weekData],
  )

  const streak = useMemo(() => {
    let s = 0
    const today = toDateString()
    for (let i = weekData.length - 1; i >= 0; i--) {
      const d = weekData[i]
      if (!d || d.date > today) continue
      if (d.goalHit) s++
      else break
    }
    return s
  }, [weekData])

  // Workout frequency — which days this week had a session
  const trainedDates = useMemo(
    () =>
      new Set(
        workoutSessions
          .filter((s) => weekDates.includes(s.date))
          .map((s) => s.date),
      ),
    [workoutSessions, weekDates],
  )

  return (
    <div className="flex-1 pb-8 overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white font-display tracking-tight">This Week</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Mon – Sun overview
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : [
              { label: 'Avg Protein', value: `${avgProtein}g`, color: '#ff375f' },
              { label: 'Days Hit', value: `${daysHit}/7`, color: '#30d158' },
              { label: '🔥 Streak', value: `${streak}d`, color: '#ff9f0a' },
            ].map(({ label, value, color }) => (
              <Card key={label} padding="md" className="text-center">
                <p className="text-xl font-bold num-large" style={{ color }}>
                  {value}
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{label}</p>
              </Card>
            ))}
      </div>

      {/* Workout frequency strip */}
      <div className="mx-4 mb-4">
        <Card padding="md">
          {loading ? (
            <Skeleton height={40} className="w-full" />
          ) : (
            <WorkoutFrequencyStrip trainedDates={trainedDates} weekDates={weekDates} />
          )}
        </Card>
      </div>

      {/* Protein bar chart */}
      <div className="mx-4 mb-4">
        {loading ? (
          <Skeleton height={180} className="w-full rounded-[var(--radius-xl)]" />
        ) : (
          <Card padding="md">
            <p className="text-xs text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide font-semibold">
              Protein per day
            </p>
            <WeeklyChart
              data={weekData.map((d) => ({ day: d.day, protein: d.protein, goal: proteinGoal }))}
              proteinGoal={proteinGoal}
            />
          </Card>
        )}
      </div>

      {/* Day breakdown list */}
      <div className="px-4 space-y-2">
        <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Daily breakdown
        </h2>
        {loading
          ? MEAL_SLOTS.map((s) => <SkeletonRow key={s} />)
          : weekData.map((d) => (
              <Card key={d.date} padding="sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: d.goalHit ? 'rgba(255,55,95,0.15)' : 'var(--color-surface-2)',
                      color: d.goalHit ? '#ff375f' : 'var(--color-text-tertiary)',
                    }}
                  >
                    {d.day.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{d.day}</span>
                      {d.isToday && <Badge variant="neutral">Today</Badge>}
                      {d.isFuture && <Badge variant="neutral">Upcoming</Badge>}
                      {d.goalHit && !d.isFuture && <Badge variant="success">Goal ✓</Badge>}
                      {trainedDates.has(d.date) && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255,55,95,0.1)',
                            color: 'var(--color-protein)',
                          }}
                        >
                          💪 Trained
                        </span>
                      )}
                    </div>
                    {!d.isFuture && d.hasAnyLog && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {d.protein}g protein · {d.calories} kcal
                      </p>
                    )}
                    {!d.isFuture && !d.hasAnyLog && (
                      <p className="text-xs text-[var(--color-text-tertiary)]">No nutrition logs</p>
                    )}
                  </div>
                  {!d.isFuture && d.hasAnyLog && (
                    <span
                      className="text-sm font-bold tabular-nums num-large"
                      style={{ color: d.goalHit ? '#30d158' : 'var(--color-text-tertiary)' }}
                    >
                      {d.protein}g
                    </span>
                  )}
                </div>
              </Card>
            ))}
      </div>
    </div>
  )
}
