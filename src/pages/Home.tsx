import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ActivityRings } from '../components/rings/ActivityRings'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAppStore } from '../store/useAppStore'
import { logMacros, sumMacros, remaining } from '../utils/nutrition'
import { toDateString, relativeDateLabel } from '../utils/weekKey'
import type { MealSlot } from '../types'

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner']
const MEAL_ICONS: Record<MealSlot, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snacks: '🍎',
  dinner: '🌙',
}

export function Home() {
  const navigate = useNavigate()
  const { selectedDate, setSelectedDate, dailyLogs, foodItems, profile, getDailyLogsForDate } =
    useAppStore()

  const [loading, setLoading] = useState(false)

  const foodMap = useMemo(() => new Map(foodItems.map((f) => [f.id, f])), [foodItems])

  useEffect(() => {
    let cancelled = false
    setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, 0)
    getDailyLogsForDate(selectedDate).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [selectedDate, getDailyLogsForDate])

  const mealMacros = useMemo(
    () =>
      MEAL_SLOTS.map((slot) => {
        const record = dailyLogs.get(`${selectedDate}::${slot}`)
        const macros = record?.status === 'ate' ? logMacros(record, foodMap) : null
        return { slot, record, macros }
      }),
    [dailyLogs, selectedDate, foodMap],
  )

  const totalMacros = useMemo(
    () => sumMacros(mealMacros.filter((m) => m.macros !== null).map((m) => m.macros!)),
    [mealMacros],
  )

  const proteinGoal = profile?.proteinGoalG ?? 120
  const calorieGoal = profile?.calorieGoalKcal ?? 2000
  const carbsGoal = Math.round(calorieGoal * 0.45 / 4) // 45% of cals from carbs

  const proteinRemaining = remaining(totalMacros.protein, proteinGoal)

  function shiftDate(days: number) {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(toDateString(d))
  }

  const isToday = selectedDate === toDateString()

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Date header */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <button onClick={() => shiftDate(-1)} className="p-1 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
          <ChevronLeft size={20} className="text-[var(--color-text-secondary)]" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-white">
          {relativeDateLabel(selectedDate)}
        </h1>
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="p-1 rounded-full hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-30"
        >
          <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
        </button>
      </div>

      {/* Activity Rings */}
      {!loading && (
        <div className="flex justify-center pt-6 pb-10">
          <ActivityRings
            protein={{ value: totalMacros.protein, goal: proteinGoal, color: '#ff375f', label: 'Protein' }}
            calories={{ value: totalMacros.calories, goal: calorieGoal, color: '#30d158', label: 'Calories' }}
            carbs={{ value: totalMacros.carbs, goal: carbsGoal, color: '#0a84ff', label: 'Carbs' }}
            size={220}
          />
        </div>
      )}

      {/* Protein gap banner */}
      {proteinRemaining > 5 && (
        <div className="mx-4 mb-4 bg-[var(--color-protein)]/10 border border-[var(--color-protein)]/30 rounded-[var(--radius-lg)] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {Math.round(proteinRemaining)}g protein remaining
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Log a meal or add outside food to hit your goal
            </p>
          </div>
          <span className="text-2xl font-bold" style={{ color: '#ff375f' }}>
            {Math.round(proteinRemaining)}
          </span>
        </div>
      )}

      {proteinRemaining <= 5 && totalMacros.protein > 0 && (
        <div className="mx-4 mb-4 bg-green-500/10 border border-green-500/30 rounded-[var(--radius-lg)] px-4 py-3 text-center">
          <p className="text-sm font-semibold text-green-400">🎉 Protein goal hit!</p>
        </div>
      )}

      {/* Macro summary row */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Protein', value: Math.round(totalMacros.protein), unit: 'g', color: '#ff375f' },
          { label: 'Calories', value: Math.round(totalMacros.calories), unit: 'kcal', color: '#30d158' },
          { label: 'Carbs', value: Math.round(totalMacros.carbs), unit: 'g', color: '#0a84ff' },
        ].map(({ label, value, unit, color }) => (
          <Card key={label} padding="sm" className="text-center">
            <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{unit}</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">{label}</p>
          </Card>
        ))}
      </div>

      {/* Meal breakdown */}
      <div className="px-4 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Meals
        </h2>
        {mealMacros.map(({ slot, record, macros }) => (
          <Card
            key={slot}
            padding="md"
            onClick={() => navigate(`/log?date=${selectedDate}&slot=${slot}`)}
            className={`w-full text-left ${record?.status === 'skipped' ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{MEAL_ICONS[slot]}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize text-white">{slot}</span>
                    {record?.status === 'skipped' && <Badge variant="skipped">Skipped</Badge>}
                    {record?.status === 'unset' && <Badge variant="neutral">Not logged</Badge>}
                  </div>
                  {macros && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {Math.round(macros.protein)}g protein · {Math.round(macros.calories)} kcal
                    </p>
                  )}
                  {!record && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Tap to log</p>
                  )}
                </div>
              </div>
              {macros && (
                <span className="text-sm font-bold tabular-nums" style={{ color: '#ff375f' }}>
                  {Math.round(macros.protein)}g
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Outside food FAB */}
      <button
        onClick={() => navigate('/log?outside=true')}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[var(--color-protein)] text-white shadow-lg shadow-red-500/30 flex items-center justify-center active:scale-90 transition-transform z-40"
        aria-label="Add outside food"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
