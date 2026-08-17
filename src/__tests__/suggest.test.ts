import { describe, it, expect } from 'vitest'
import { suggestPlate } from '../utils/suggest'
import type { FoodItem } from '../types'

function makeFood(
  id: string,
  proteinPer: number,
  caloriesPer: number,
  category: FoodItem['category'] = 'other',
): FoodItem {
  return {
    id,
    name: id,
    aliases: [],
    category,
    cuisineTag: 'north_indian',
    coreIngredients: [],
    caloriesPer,
    proteinPer,
    carbsPer: 10,
    fatPer: 2,
    servingUnit: '1 bowl',
    servingGrams: 150,
    isCustom: false,
  }
}

describe('suggestPlate', () => {
  it('returns empty when no items available', () => {
    expect(suggestPlate([], 50, 500)).toEqual([])
  })

  it('returns empty when protein goal is already met', () => {
    const items = [makeFood('dal', 8, 120)]
    expect(suggestPlate(items, 0, 500)).toEqual([])
  })

  it('returns empty when protein goal is negative', () => {
    const items = [makeFood('dal', 8, 120)]
    expect(suggestPlate(items, -10, 500)).toEqual([])
  })

  it('prioritizes highest protein-density items first', () => {
    const egg = makeFood('egg', 13, 78, 'egg')  // density 0.167
    const rice = makeFood('rice', 3, 200, 'rice') // density 0.015
    const paneer = makeFood('paneer', 14, 100, 'paneer') // density 0.14
    const result = suggestPlate([rice, egg, paneer], 30, 600)
    // First suggestion should be egg (highest density)
    expect(result[0]?.foodItem.id).toBe('egg')
  })

  it('respects calorie budget — stops when budget exhausted', () => {
    const dal = makeFood('dal', 8, 120)
    // Only 50 kcal budget — can't fit even 1 serving (120 kcal)
    const result = suggestPlate([dal], 30, 50)
    expect(result).toHaveLength(0)
  })

  it('respects max servings per category', () => {
    // Roti max is 3 per category config
    const roti = makeFood('roti', 3, 70, 'roti')
    const result = suggestPlate([roti], 50, 1000)
    const rotiSuggestion = result.find((r) => r.foodItem.id === 'roti')
    expect(rotiSuggestion?.servings).toBeLessThanOrEqual(3)
  })

  it('stops early when protein goal is met mid-list', () => {
    const chicken = makeFood('chicken', 30, 200, 'chicken') // 1 serving hits 30g
    const dal = makeFood('dal', 8, 120, 'dal')
    const result = suggestPlate([chicken, dal], 25, 1000)
    // Chicken alone meets the 25g goal — should not need dal
    const totalProtein = result.reduce((s, r) => s + r.protein, 0)
    expect(totalProtein).toBeGreaterThanOrEqual(25)
    // dal should not be included (goal already met after chicken)
    const dalEntry = result.find((r) => r.foodItem.id === 'dal')
    expect(dalEntry).toBeUndefined()
  })

  it('skips zero-calorie or zero-protein items', () => {
    const water = makeFood('water', 0, 0)
    const dal = makeFood('dal', 8, 120)
    const result = suggestPlate([water, dal], 20, 500)
    expect(result.every((r) => r.foodItem.id !== 'water')).toBe(true)
  })

  it('returns correct protein and calorie values', () => {
    const egg = makeFood('egg', 13, 78, 'egg')
    const result = suggestPlate([egg], 13, 500)
    expect(result).toHaveLength(1)
    expect(result[0]?.protein).toBe(13)
    expect(result[0]?.calories).toBe(78)
    expect(result[0]?.servings).toBe(1)
  })
})
