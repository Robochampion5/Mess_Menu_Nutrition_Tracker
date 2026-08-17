import { describe, it, expect } from 'vitest'
import {
  entryMacros,
  logMacros,
  sumMacros,
  percentComplete,
  remaining,
  roundMacro,
} from '../utils/nutrition'
import type { FoodItem, DailyLogRecord, DailyLogEntry } from '../types'

function makeFood(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'test-food',
    name: 'Test Food',
    aliases: [],
    category: 'other',
    cuisineTag: 'other',
    coreIngredients: [],
    caloriesPer: 200,
    proteinPer: 20,
    carbsPer: 25,
    fatPer: 5,
    servingUnit: '1 bowl',
    servingGrams: 150,
    ...overrides,
  }
}

function makeEntry(overrides: Partial<DailyLogEntry> = {}): DailyLogEntry {
  return {
    foodId: 'test-food',
    servings: 1,
    isOutsideFood: false,
    ...overrides,
  }
}

function makeLog(
  entries: DailyLogEntry[],
  status: DailyLogRecord['status'] = 'ate',
): DailyLogRecord {
  return {
    date: '2024-01-01',
    mealSlot: 'lunch',
    status,
    entries,
  }
}

describe('entryMacros', () => {
  it('returns zeros for unknown food id', () => {
    const foodMap = new Map<string, FoodItem>()
    const entry = makeEntry()
    expect(entryMacros(entry, foodMap)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })

  it('multiplies macros by servings', () => {
    const food = makeFood()
    const foodMap = new Map([['test-food', food]])
    const entry = makeEntry({ servings: 2 })
    const result = entryMacros(entry, foodMap)
    expect(result.calories).toBe(400)
    expect(result.protein).toBe(40)
    expect(result.carbs).toBe(50)
    expect(result.fat).toBe(10)
  })

  it('handles fractional servings', () => {
    const food = makeFood()
    const foodMap = new Map([['test-food', food]])
    const entry = makeEntry({ servings: 0.5 })
    const result = entryMacros(entry, foodMap)
    expect(result.calories).toBe(100)
    expect(result.protein).toBe(10)
  })
})

describe('logMacros', () => {
  it('sums all entries in the record', () => {
    const food = makeFood()
    const foodMap = new Map([['test-food', food]])
    const record = makeLog([makeEntry({ servings: 1 }), makeEntry({ servings: 1 })])
    const result = logMacros(record, foodMap)
    expect(result.protein).toBe(40)
    expect(result.calories).toBe(400)
  })

  it('returns zeros for empty entries', () => {
    const foodMap = new Map<string, FoodItem>()
    const record = makeLog([])
    const result = logMacros(record, foodMap)
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('sumMacros', () => {
  it('sums an array of macros', () => {
    const a = { calories: 100, protein: 10, carbs: 15, fat: 3 }
    const b = { calories: 200, protein: 20, carbs: 30, fat: 6 }
    expect(sumMacros([a, b])).toEqual({ calories: 300, protein: 30, carbs: 45, fat: 9 })
  })

  it('returns zeros for empty array', () => {
    expect(sumMacros([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('percentComplete', () => {
  it('returns 0 for zero goal', () => {
    expect(percentComplete(50, 0)).toBe(0)
  })

  it('clamps at 100 even when value exceeds goal', () => {
    expect(percentComplete(200, 100)).toBe(100)
  })

  it('calculates correct percentage', () => {
    expect(percentComplete(75, 100)).toBe(75)
    expect(percentComplete(50, 200)).toBe(25)
  })
})

describe('remaining', () => {
  it('never returns negative', () => {
    expect(remaining(150, 100)).toBe(0)
  })

  it('returns correct remaining amount', () => {
    expect(remaining(30, 100)).toBe(70)
  })

  it('returns full goal when nothing consumed', () => {
    expect(remaining(0, 120)).toBe(120)
  })
})

describe('roundMacro', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundMacro(10.567)).toBe(10.6)
    expect(roundMacro(10.544)).toBe(10.5)
  })

  it('handles zero', () => {
    expect(roundMacro(0)).toBe(0)
  })
})
