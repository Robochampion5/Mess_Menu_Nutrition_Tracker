import type { DailyLogEntry, DailyLogRecord, FoodItem } from '../types'

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** Compute macros for a single entry given a food item lookup */
export function entryMacros(entry: DailyLogEntry, foodMap: Map<string, FoodItem>): MacroTotals {
  const item = foodMap.get(entry.foodId)
  if (!item) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  return {
    calories: Math.round(item.caloriesPer * entry.servings * 10) / 10,
    protein: Math.round(item.proteinPer * entry.servings * 10) / 10,
    carbs: Math.round(item.carbsPer * entry.servings * 10) / 10,
    fat: Math.round(item.fatPer * entry.servings * 10) / 10,
  }
}

/** Compute total macros for a meal slot log record */
export function logMacros(record: DailyLogRecord, foodMap: Map<string, FoodItem>): MacroTotals {
  return record.entries.reduce(
    (acc, entry) => {
      const m = entryMacros(entry, foodMap)
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/** Sum an array of MacroTotals */
export function sumMacros(macroList: MacroTotals[]): MacroTotals {
  return macroList.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/**
 * Percentage of goal achieved, clamped to [0, 100].
 * Always returns a safe number even if goal is 0.
 */
export function percentComplete(value: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((value / goal) * 100))
}

/** Remaining amount (never negative) */
export function remaining(value: number, goal: number): number {
  return Math.max(0, goal - value)
}

/** Round a macro value to 1 decimal */
export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10
}
