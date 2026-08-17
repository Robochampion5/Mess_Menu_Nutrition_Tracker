import { GoogleGenAI } from '@google/genai'
import { getProfile } from '../db/userProfile'

let cachedClient: GoogleGenAI | null = null
let cachedKey: string | null = null

/**
 * Returns a Gemini client using the key stored in IndexedDB.
 * Returns null if no key is configured — callers must handle this
 * by showing a "manual entry" fallback rather than crashing.
 */
export async function getGeminiClient(): Promise<GoogleGenAI | null> {
  const profile = await getProfile()
  const key = profile?.geminiApiKey?.trim()

  if (!key) return null

  // Re-use cached client if key hasn't changed
  if (cachedClient && cachedKey === key) return cachedClient

  cachedClient = new GoogleGenAI({ apiKey: key })
  cachedKey = key
  return cachedClient
}

export const GEMINI_MODEL = 'gemini-3.6-flash'
