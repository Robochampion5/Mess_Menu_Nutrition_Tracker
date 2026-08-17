import { getGeminiClient, GEMINI_MODEL } from './client'
import { safeParseJson, normalizeDishName } from './utils'
import { getAiCache, setAiCache } from '../db/aiCache'

export interface NutritionEstimate {
  calories: number
  protein: number
  carbs: number
  fat: number
  servingUnit: string
}

export type EstimateNutritionResult =
  | { ok: true; nutrition: NutritionEstimate; fromCache: boolean }
  | { ok: false; error: string; noKey?: boolean }

/**
 * Estimates nutrition for a free-text dish description.
 * Checks aiCache first — same dish never triggers two API calls.
 */
export async function estimateNutrition(dishDescription: string): Promise<EstimateNutritionResult> {
  // Check cache first
  const cached = await getAiCache(dishDescription)
  if (cached?.nutrition) {
    return { ok: true, nutrition: cached.nutrition, fromCache: true }
  }

  const client = await getGeminiClient()
  if (!client) {
    return {
      ok: false,
      error: 'No Gemini API key configured. Add your key in Settings.',
      noKey: true,
    }
  }

  const prompt = `Estimate the nutritional content for this Indian food item per typical single serving.
Return ONLY a JSON object — no markdown fences, no explanation:
{"calories":number,"protein":number,"carbs":number,"fat":number,"servingUnit":"description"}

All values are numbers (grams for macros, kcal for calories).
servingUnit is a human-readable description like "1 bowl (200g)" or "1 piece".
Be conservative and realistic for Indian mess/hostel portions.

Food item: "${dishDescription}"`

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const parsed = safeParseJson<NutritionEstimate>(raw)

    if (!parsed.ok) {
      return { ok: false, error: `Could not parse nutrition estimate: ${parsed.error.message}` }
    }

    const nutrition = parsed.data

    // Cache the result
    await setAiCache({
      dishName: normalizeDishName(dishDescription),
      nutrition,
      cachedAt: new Date().toISOString(),
    })

    return { ok: true, nutrition, fromCache: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: `Gemini API error: ${message}` }
  }
}
