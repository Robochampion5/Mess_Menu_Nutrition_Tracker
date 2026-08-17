import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { WeeklyChart } from '../components/charts/WeeklyChart'
import { Badge } from '../components/ui/Badge'
import { useAppStore } from '../store/useAppStore'
import { logMacros, sumMacros } from '../utils/nutrition'
import { getWeekDates, toDateString } from '../utils/weekKey'
import { DAY_SHORT, type MealSlot } from '../types'

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner']

export function Weekly() {
  const { profile, foodItems, getDailyLogsForDate, dailyLogs } = useAppStore()
  const [loading, setLoading] = useState(true)

  const weekDates = useMemo(() => getWeekDates(), [])
  const foodMap = useMemo(() => new Map(foodItems.map((f) => [f.id, f])), [foodItems])
  const proteinGoal = profile?.proteinGoalG ?? 120

  useEffect(() => {
    Promise.all(weekDates.map((date) => getDailyLogsForDate(date))).finally(() => setLoading(false))
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

  const daysHit = useMemo(() => weekData.filter((d) => d.goalHit && !d.isFuture).length, [weekData])

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

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">This Week</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Mon – Sun protein overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Avg Protein', value: `${avgProtein}g`, color: '#ff375f' },
          { label: 'Days Hit', value: `${daysHit}/7`, color: '#30d158' },
          { label: '🔥 Streak', value: `${streak}d`, color: '#ff9f0a' },
        ].map(({ label, value, color }) => (
          <Card key={label} padding="md" className="text-center">
            <p className="text-xl font-bold" style={{ color }}>
              {value}
            </p>
            <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      {!loading && (
        <div className="mx-4">
          <Card padding="md">
            <p className="text-xs text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
              Protein per day
            </p>
            <WeeklyChart
              data={weekData.map((d) => ({ day: d.day, protein: d.protein, goal: proteinGoal }))}
              proteinGoal={proteinGoal}
            />
          </Card>
        </div>
      )}

      {/* Day breakdown list */}
      <div className="px-4 mt-4 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Daily breakdown
        </h2>
        {weekData.map((d) => (
          <Card key={d.date} padding="sm">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: d.goalHit ? '#ff375f22' : '#2c2c2e',
                  color: d.goalHit ? '#ff375f' : '#636366',
                }}
              >
                {d.day.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{d.day}</span>
                  {d.isToday && <Badge variant="neutral">Today</Badge>}
                  {d.isFuture && <Badge variant="neutral">Upcoming</Badge>}
                  {d.goalHit && !d.isFuture && <Badge variant="success">Goal hit ✓</Badge>}
                </div>
                {!d.isFuture && d.hasAnyLog && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {d.protein}g protein · {d.calories} kcal
                  </p>
                )}
                {!d.isFuture && !d.hasAnyLog && (
                  <p className="text-xs text-[var(--color-text-tertiary)]">No logs yet</p>
                )}
              </div>
              {!d.isFuture && d.hasAnyLog && (
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: d.goalHit ? '#30d158' : '#636366' }}
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
