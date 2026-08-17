import type { FoodItem } from '../types'

export interface SuggestedItem {
  foodItem: FoodItem
  servings: number
  protein: number
  calories: number
}

/** Max servings by category to keep suggestions realistic */
const MAX_SERVINGS: Record<string, number> = {
  dal: 2,
  sabzi: 2,
  roti: 3,
  rice: 2,
  egg: 3,
  paneer: 2,
  chicken: 2,
  fish: 2,
  curd: 2,
  snack: 2,
  beverage: 1,
  bread: 2,
  soup: 1,
  chutney: 2,
  dessert: 1,
  salad: 2,
  other: 2,
}

/**
 * Greedy protein-first suggestion algorithm.
 *
 * Ranks available items by protein-per-calorie density, then greedily
 * selects servings until the protein goal is met or calorie budget is exhausted.
 *
 * @param availableItems - Food items available for this meal slot
 * @param remainingProteinGoal - Grams of protein still needed today
 * @param remainingCalorieBudget - Kcal remaining in daily budget
 * @returns Suggested items with serving counts
 */
export function suggestPlate(
  availableItems: FoodItem[],
  remainingProteinGoal: number,
  remainingCalorieBudget: number,
): SuggestedItem[] {
  if (availableItems.length === 0 || remainingProteinGoal <= 0) return []

  // Score by protein density (protein g per calorie); skip zero-calorie items
  const scored = availableItems
    .filter((item) => item.caloriesPer > 0 && item.proteinPer > 0)
    .map((item) => ({
      item,
      density: item.proteinPer / item.caloriesPer,
    }))
    .sort((a, b) => b.density - a.density)

  const result: SuggestedItem[] = []
  let proteinLeft = remainingProteinGoal
  let caloriesLeft = remainingCalorieBudget

  for (const { item } of scored) {
    if (proteinLeft <= 0 || caloriesLeft <= 0) break

    const maxServings = MAX_SERVINGS[item.category] ?? 2
    // How many servings do we need to close the protein gap?
    const servingsNeededForProtein = Math.ceil(proteinLeft / item.proteinPer)
    // How many servings fit in calorie budget?
    const servingsFitInCalories = item.caloriesPer > 0
      ? Math.floor(caloriesLeft / item.caloriesPer)
      : maxServings

    const servings = Math.min(maxServings, servingsNeededForProtein, servingsFitInCalories)

    if (servings <= 0) continue

    const proteinGained = item.proteinPer * servings
    const caloriesUsed = item.caloriesPer * servings

    result.push({
      foodItem: item,
      servings,
      protein: Math.round(proteinGained * 10) / 10,
      calories: Math.round(caloriesUsed * 10) / 10,
    })

    proteinLeft -= proteinGained
    caloriesLeft -= caloriesUsed
  }

  return result
}
