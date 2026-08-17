import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Stepper } from '../components/ui/Stepper'
import { Toggle } from '../components/ui/Toggle'
import { Spinner } from '../components/ui/Spinner'
import { showToast } from '../components/ui/Toast'
import { useAppStore } from '../store/useAppStore'
import { estimateNutrition } from '../ai/estimateNutrition'
import { suggestPlate } from '../utils/suggest'
import { logMacros, sumMacros, remaining } from '../utils/nutrition'
import {
  toDateString,
  relativeDateLabel,
  getISOWeekKey,
  dayIndexFromDateString,
} from '../utils/weekKey'
import type { MealSlot, DailyLogRecord, DailyLogEntry, FoodItem } from '../types'

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner']
const MEAL_ICONS: Record<MealSlot, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snacks: '🍎',
  dinner: '🌙',
}

interface OutsideFoodModal {
  open: boolean
  query: string
  estimating: boolean
  result: {
    calories: number
    protein: number
    carbs: number
    fat: number
    servingUnit: string
  } | null
  error: string | null
  mealSlot: MealSlot
}

export function Log() {
  const [params] = useSearchParams()
  const dateParam = params.get('date') ?? toDateString()
  const slotParam = (params.get('slot') as MealSlot | null) ?? null
  const showOutside = params.get('outside') === 'true'

  const {
    foodItems,
    dailyLogs,
    weeklyMenus,
    profile,
    upsertDailyLog,
    getDailyLogsForDate,
    upsertFoodItem,
  } = useAppStore()
  const [selectedDate, setSelectedDate] = useState(dateParam)
  const [loading, setLoading] = useState(false)

  const foodMap = useMemo(() => new Map(foodItems.map((f) => [f.id, f])), [foodItems])

  const [outsideModal, setOutsideModal] = useState<OutsideFoodModal>({
    open: showOutside,
    query: '',
    estimating: false,
    result: null,
    error: null,
    mealSlot: slotParam ?? 'lunch',
  })

  useEffect(() => {
    let cancelled = false
    setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, 0)
    getDailyLogsForDate(selectedDate).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedDate, getDailyLogsForDate])

  const weekKey = useMemo(() => getISOWeekKey(new Date(selectedDate + 'T00:00:00')), [selectedDate])
  const dayIndex = useMemo(() => dayIndexFromDateString(selectedDate), [selectedDate])
  const weekMenu = weeklyMenus.get(weekKey)

  const menuItemsBySlot = useMemo(() => {
    if (!weekMenu) return new Map<MealSlot, FoodItem[]>()
    const map = new Map<MealSlot, FoodItem[]>()
    MEAL_SLOTS.forEach((slot) => {
      const ids = weekMenu.items
        .filter((m) => m.day === dayIndex && m.slot === slot)
        .map((m) => m.foodItemId)
      map.set(slot, [...new Set(ids)].map((id) => foodMap.get(id)).filter(Boolean) as FoodItem[])
    })
    return map
  }, [weekMenu, dayIndex, foodMap])

  // Total logged macros for the day
  const dayMacros = useMemo(() => {
    const logs = MEAL_SLOTS.map((slot) => dailyLogs.get(`${selectedDate}::${slot}`))
      .filter((r): r is DailyLogRecord => !!r && r.status === 'ate')
      .map((r) => logMacros(r, foodMap))
    return sumMacros(logs)
  }, [dailyLogs, selectedDate, foodMap])

  const proteinGoal = profile?.proteinGoalG ?? 120
  const calorieGoal = profile?.calorieGoalKcal ?? 2000

  async function setMealStatus(slot: MealSlot, status: 'ate' | 'skipped') {
    const existing = dailyLogs.get(`${selectedDate}::${slot}`)
    const record: DailyLogRecord = existing ?? {
      date: selectedDate,
      mealSlot: slot,
      status: 'unset',
      entries: [],
    }
    await upsertDailyLog({ ...record, status })
  }

  async function updateServings(slot: MealSlot, foodId: string, servings: number) {
    const key = `${selectedDate}::${slot}`
    const existing = dailyLogs.get(key)
    const record: DailyLogRecord = existing ?? {
      date: selectedDate,
      mealSlot: slot,
      status: 'ate',
      entries: [],
    }

    let entries = record.entries.filter((e) => e.foodId !== foodId)
    if (servings > 0) {
      entries = [...entries, { foodId, servings, isOutsideFood: false }]
    }

    await upsertDailyLog({ ...record, status: 'ate', entries })
  }

  // Outside food
  async function estimateOutside() {
    if (!outsideModal.query.trim()) return
    setOutsideModal((m) => ({ ...m, estimating: true, error: null, result: null }))
    const res = await estimateNutrition(outsideModal.query)
    if (res.ok) {
      setOutsideModal((m) => ({ ...m, estimating: false, result: res.nutrition }))
    } else {
      setOutsideModal((m) => ({
        ...m,
        estimating: false,
        error: res.noKey ? 'Add your Gemini API key in Settings to estimate nutrition.' : res.error,
      }))
    }
  }

  async function saveOutsideFood() {
    const { query, result, mealSlot } = outsideModal
    if (!result) return

    const foodId =
      query
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') + '-outside'
    const newFood: FoodItem = {
      id: foodId,
      name: query,
      aliases: [],
      category: 'other',
      cuisineTag: 'other',
      coreIngredients: [],
      caloriesPer: result.calories,
      proteinPer: result.protein,
      carbsPer: result.carbs,
      fatPer: result.fat,
      servingUnit: result.servingUnit,
      servingGrams: 150,
      isCustom: true,
    }
    await upsertFoodItem(newFood)

    const key = `${selectedDate}::${mealSlot}`
    const existing = dailyLogs.get(key)
    const record: DailyLogRecord = existing ?? {
      date: selectedDate,
      mealSlot,
      status: 'ate',
      entries: [],
    }
    const entry: DailyLogEntry = { foodId, servings: 1, isOutsideFood: true }
    await upsertDailyLog({
      ...record,
      status: 'ate',
      entries: [...record.entries.filter((e) => e.foodId !== foodId), entry],
    })

    showToast(`${query} logged!`, 'success')
    setOutsideModal({
      open: false,
      query: '',
      estimating: false,
      result: null,
      error: null,
      mealSlot: 'lunch',
    })
  }

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">Log Meals</h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {relativeDateLabel(selectedDate)}
          </p>
          <input
            type="date"
            value={selectedDate}
            max={toDateString()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="ml-auto text-xs bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-2 py-1 outline-none"
          />
        </div>
      </div>

      {/* Day macro summary */}
      <div className="px-4 mb-4 flex gap-3">
        {[
          {
            label: 'Protein',
            value: `${Math.round(dayMacros.protein)}g`,
            color: '#ff375f',
            goal: proteinGoal,
          },
          {
            label: 'Calories',
            value: `${Math.round(dayMacros.calories)}`,
            color: '#30d158',
            goal: calorieGoal,
          },
        ].map(({ label, value, color, goal }) => (
          <div
            key={label}
            className="flex-1 bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-3 text-center"
          >
            <p className="text-lg font-bold" style={{ color }}>
              {value}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              / {goal} {label}
            </p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {/* Meal slots */}
      {!loading &&
        MEAL_SLOTS.map((slot) => {
          const record = dailyLogs.get(`${selectedDate}::${slot}`)
          const status = record?.status ?? 'unset'
          const slotItems = menuItemsBySlot.get(slot) ?? []
          const slotMacros = record?.status === 'ate' ? logMacros(record, foodMap) : null
          const proteinLeft = remaining(dayMacros.protein, proteinGoal)
          const caloriesLeft = remaining(dayMacros.calories, calorieGoal)
          const suggestions =
            status === 'ate' && slotItems.length > 0
              ? suggestPlate(slotItems, proteinLeft, caloriesLeft)
              : []

          return (
            <div key={slot} className="px-4 mb-4">
              <Card className={status === 'skipped' ? 'opacity-60' : ''}>
                {/* Slot header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MEAL_ICONS[slot]}</span>
                    <span className="font-semibold capitalize text-white">{slot}</span>
                    {status === 'skipped' && <Badge variant="skipped">Skipped</Badge>}
                  </div>
                  <Toggle
                    checked={status === 'ate'}
                    onChange={(ate) => setMealStatus(slot, ate ? 'ate' : 'skipped')}
                    label={status === 'ate' ? 'Ate' : 'Skipped'}
                  />
                </div>

                {/* Macro sub-total */}
                {slotMacros && (
                  <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                    {Math.round(slotMacros.protein)}g protein · {Math.round(slotMacros.calories)}{' '}
                    kcal
                  </p>
                )}

                {/* Suggested plate */}
                {status === 'ate' && suggestions.length > 0 && (
                  <div className="mb-3 bg-[var(--color-protein)]/10 border border-[var(--color-protein)]/20 rounded-[var(--radius-md)] px-3 py-2">
                    <p className="text-xs font-medium text-[var(--color-protein)] mb-1.5">
                      💡 Suggested plate
                    </p>
                    <div className="space-y-1">
                      {suggestions.map((s) => (
                        <div key={s.foodItem.id} className="flex justify-between text-xs">
                          <span className="text-white">{s.foodItem.name}</span>
                          <span className="text-[var(--color-text-secondary)]">
                            ×{s.servings} · {Math.round(s.protein)}g P
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Menu items */}
                {status === 'ate' && (
                  <div className="space-y-2">
                    {slotItems.length === 0 && (
                      <p className="text-xs text-[var(--color-text-tertiary)] py-1">
                        No menu for this slot — add outside food below
                      </p>
                    )}
                    {slotItems.map((item) => {
                      const entry = record?.entries.find((e) => e.foodId === item.id)
                      const servings = entry?.servings ?? 0
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.name}</p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">
                              {Math.round(item.proteinPer * servings * 10) / 10}g P ·
                              {Math.round(item.caloriesPer * servings)} kcal
                            </p>
                          </div>
                          <Stepper
                            value={servings}
                            min={0}
                            max={6}
                            step={0.5}
                            onChange={(v) => updateServings(slot, item.id, v)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Outside food entries */}
                {status === 'ate' &&
                  record?.entries
                    .filter((e) => e.isOutsideFood)
                    .map((entry) => {
                      const food = foodMap.get(entry.foodId)
                      if (!food) return null
                      return (
                        <div
                          key={entry.foodId}
                          className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--color-border)]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm text-white truncate">{food.name}</p>
                              <Badge variant="neutral" size="sm">
                                Outside
                              </Badge>
                            </div>
                            <p className="text-xs text-[var(--color-text-tertiary)]">
                              {Math.round(food.proteinPer * entry.servings * 10) / 10}g P
                            </p>
                          </div>
                          <Stepper
                            value={entry.servings}
                            min={0}
                            max={5}
                            onChange={(v) => updateServings(slot, entry.foodId, v)}
                          />
                        </div>
                      )
                    })}

                {/* Add outside food for this slot */}
                {status === 'ate' && (
                  <button
                    type="button"
                    onClick={() => setOutsideModal({ ...outsideModal, open: true, mealSlot: slot })}
                    className="w-full mt-3 py-2 text-xs text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] flex items-center justify-center gap-1 hover:border-[var(--color-protein)] hover:text-[var(--color-protein)] transition-colors"
                  >
                    <Plus size={12} /> Add outside food
                  </button>
                )}
              </Card>
            </div>
          )
        })}

      {/* Outside food FAB */}
      <button
        onClick={() => setOutsideModal({ ...outsideModal, open: true })}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[var(--color-protein)] text-white shadow-lg shadow-red-500/30 flex items-center justify-center active:scale-90 transition-transform z-40"
        aria-label="Add outside food"
      >
        <Plus size={24} />
      </button>

      {/* Outside food modal */}
      {outsideModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-[var(--color-surface)] w-full rounded-t-3xl p-6 pb-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Add outside food</h3>
              <button
                onClick={() =>
                  setOutsideModal({
                    ...outsideModal,
                    open: false,
                    query: '',
                    result: null,
                    error: null,
                  })
                }
                className="text-[var(--color-text-secondary)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={outsideModal.query}
                onChange={(e) =>
                  setOutsideModal((m) => ({
                    ...m,
                    query: e.target.value,
                    result: null,
                    error: null,
                  }))
                }
                onKeyDown={(e) => e.key === 'Enter' && estimateOutside()}
                placeholder="e.g. Chicken biryani, 1 plate"
                className="flex-1 bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none"
              />
              <Button onClick={estimateOutside} loading={outsideModal.estimating} size="md">
                {outsideModal.estimating ? '' : 'Estimate'}
              </Button>
            </div>

            {/* Slot picker */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {MEAL_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setOutsideModal((m) => ({ ...m, mealSlot: slot }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${outsideModal.mealSlot === slot ? 'bg-[var(--color-protein)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}
                >
                  {MEAL_ICONS[slot]} {slot}
                </button>
              ))}
            </div>

            {outsideModal.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[var(--radius-md)] px-3 py-2">
                <p className="text-xs text-red-400">{outsideModal.error}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  You can still save the food with manual nutrition values below.
                </p>
              </div>
            )}

            {outsideModal.result && (
              <div className="bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] p-4 space-y-3">
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                  Estimated nutrition (editable)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['protein', 'calories', 'carbs', 'fat'] as const).map((key) => (
                    <div key={key}>
                      <label className="text-[10px] text-[var(--color-text-tertiary)] capitalize">
                        {key}
                      </label>
                      <input
                        type="number"
                        value={outsideModal.result![key]}
                        onChange={(e) =>
                          setOutsideModal((m) => ({
                            ...m,
                            result: m.result
                              ? { ...m.result, [key]: parseFloat(e.target.value) || 0 }
                              : null,
                          }))
                        }
                        className="w-full bg-[var(--color-surface-3)] text-white text-sm rounded-[var(--radius-sm)] px-2 py-1.5 outline-none mt-0.5"
                      />
                    </div>
                  ))}
                </div>
                <Button fullWidth onClick={saveOutsideFood}>
                  Log {outsideModal.query || 'food'}
                </Button>
              </div>
            )}

            {/* Manual entry when no key */}
            {!outsideModal.result && outsideModal.error?.includes('API key') && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() =>
                  setOutsideModal((m) => ({
                    ...m,
                    error: null,
                    result: { calories: 0, protein: 0, carbs: 0, fat: 0, servingUnit: '1 serving' },
                  }))
                }
              >
                Enter manually
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
