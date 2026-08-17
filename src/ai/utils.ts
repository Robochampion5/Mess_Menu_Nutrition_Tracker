/**
 * Defensive JSON parsing for all AI responses.
 * LLMs frequently wrap output in ```json fences despite instructions.
 */

type ParseSuccess<T> = { ok: true; data: T }
type ParseFailure = { ok: false; raw: string; error: Error }
export type ParseResult<T> = ParseSuccess<T> | ParseFailure

/**
 * Strips markdown code fences, trims whitespace, then JSON.parses.
 * Returns { ok: true, data } or { ok: false, raw, error }.
 */
export function safeParseJson<T>(raw: string): ParseResult<T> {
  try {
    // Strip ```json ... ``` or ``` ... ``` fences
    let cleaned = raw.trim()
    const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i)
    if (fenceMatch && fenceMatch[1]) {
      cleaned = fenceMatch[1].trim()
    }
    // Also handle single-backtick inline wrapping (rare but seen)
    if (cleaned.startsWith('`') && cleaned.endsWith('`')) {
      cleaned = cleaned.slice(1, -1).trim()
    }
    const data = JSON.parse(cleaned) as T
    return { ok: true, data }
  } catch (e) {
    return {
      ok: false,
      raw,
      error: e instanceof Error ? e : new Error(String(e)),
    }
  }
}

/** Normalize a dish name for use as a cache key */
export function normalizeDishName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}
