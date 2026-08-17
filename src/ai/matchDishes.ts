import { getGeminiClient, GEMINI_MODEL } from './client'
import { safeParseJson, normalizeDishName } from './utils'
import { getAiCache, setAiCache } from '../db/aiCache'
import type { FoodItem } from '../types'

/** Confidence >= this → auto-accept match; below → flag for manual review */
export const MATCH_CONFIDENCE_THRESHOLD = 0.85

export interface DishMatchResult {
  input: string
  matchedId: string | null
  confidence: number
  suggestedAlias: string | null
  isNew: boolean
}

export type MatchDishesResult =
  { ok: true; matches: DishMatchResult[] } | { ok: false; error: string; noKey?: boolean }

export async function matchDishes(
  dishNames: string[],
  foodItems: FoodItem[],
): Promise<MatchDishesResult> {
  // First: resolve from cache (no API call needed)
  const uncachedNames: string[] = []
  const cachedMatches: DishMatchResult[] = []

  for (const name of dishNames) {
    const cached = await getAiCache(name)
    if (cached?.matchedFoodId !== undefined) {
      cachedMatches.push({
        input: name,
        matchedId: cached.matchedFoodId ?? null,
        confidence: cached.confidence ?? 1,
        suggestedAlias: cached.matchedFoodId ? name : null,
        isNew: !cached.matchedFoodId,
      })
    } else {
      uncachedNames.push(name)
    }
  }

  if (uncachedNames.length === 0) {
    return { ok: true, matches: cachedMatches }
  }

  const client = await getGeminiClient()
  if (!client) {
    // Return cached hits + mark uncached as new (user must review)
    const fallback: DishMatchResult[] = uncachedNames.map((name) => ({
      input: name,
      matchedId: null,
      confidence: 0,
      suggestedAlias: null,
      isNew: true,
    }))
    return { ok: true, matches: [...cachedMatches, ...fallback] }
  }

  const knownItems = foodItems.map((f) => ({
    id: f.id,
    name: f.name,
    aliases: f.aliases.slice(0, 5),
    ingredients: f.coreIngredients.slice(0, 5),
  }))

  const prompt = `You are a food matching assistant for Indian mess menus.
Given a list of dish names and a known food database, match each dish to the best database entry.
Use semantic matching by ingredients and cooking style, NOT just string similarity.
For example "Mix Veg" and "Veg Kurma" might both map to the same mixed vegetable curry entry.

Return ONLY a JSON array — no markdown, no explanation:
[{"input":"dish name","matchedId":"db_id_or_null","confidence":0.0_to_1.0,"suggestedAlias":"alias_or_null","isNew":true_or_false}]

If no good match exists (confidence < 0.5), set matchedId to null and isNew to true.
confidence 1.0 = certain match, 0.0 = no match.

DISH NAMES TO MATCH:
${JSON.stringify(uncachedNames)}

KNOWN FOOD DATABASE (id, name, aliases, ingredients):
${JSON.stringify(knownItems)}`

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const parsed = safeParseJson<DishMatchResult[]>(raw)

    if (!parsed.ok) {
      // Fallback: all dishes are "new" (user must review)
      const fallback: DishMatchResult[] = uncachedNames.map((name) => ({
        input: name,
        matchedId: null,
        confidence: 0,
        suggestedAlias: null,
        isNew: true,
      }))
      return { ok: true, matches: [...cachedMatches, ...fallback] }
    }

    // Store results in cache
    for (const match of parsed.data) {
      await setAiCache({
        dishName: normalizeDishName(match.input),
        matchedFoodId: match.matchedId ?? undefined,
        confidence: match.confidence,
        cachedAt: new Date().toISOString(),
      })
    }

    return { ok: true, matches: [...cachedMatches, ...parsed.data] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: `Gemini API error: ${message}` }
  }
}
