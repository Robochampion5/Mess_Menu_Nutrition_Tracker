import { getGeminiClient, GEMINI_MODEL } from './client'
import { safeParseJson } from './utils'
import type { MealSlot } from '../types'

export interface ParsedMenuItem {
  day: string // e.g. 'Monday'
  slot: MealSlot
  dish: string
}

export type ParseMenuResult =
  { ok: true; items: ParsedMenuItem[] } | { ok: false; raw: string; error: string; noKey?: boolean }

const SYSTEM_PROMPT = `You are a structured data extractor for Indian mess/hostel menus.
Given raw menu text (which may be a table, list, or mixed formatting), extract every dish.
Return ONLY a JSON array — no markdown fences, no explanation, nothing else.
Format: [{"day":"Monday","slot":"breakfast","dish":"Dal Tadka"},...]
Valid slots: breakfast, lunch, snacks, dinner.
Valid days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
If a day/slot is ambiguous, make your best guess.`

export async function parseMenuText(rawText: string): Promise<ParseMenuResult> {
  const client = await getGeminiClient()

  if (!client) {
    return { ok: false, raw: rawText, error: 'No Gemini API key configured.', noKey: true }
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nMENU TEXT:\n${rawText}` }],
        },
      ],
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const result = safeParseJson<ParsedMenuItem[]>(raw)

    if (!result.ok) {
      return { ok: false, raw, error: `Could not parse AI response: ${result.error.message}` }
    }

    // Basic validation
    const validSlots: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner']
    const valid = result.data.filter(
      (item) => item.day && item.dish && validSlots.includes(item.slot),
    )

    return { ok: true, items: valid }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, raw: rawText, error: `Gemini API error: ${message}` }
  }
}
