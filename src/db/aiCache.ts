import { getDB } from './schema'
import type { AiCacheEntry } from '../types'

export function normalizeKey(dishName: string): string {
  return dishName.toLowerCase().trim().replace(/\s+/g, ' ')
}

export async function getAiCache(dishName: string): Promise<AiCacheEntry | undefined> {
  const db = await getDB()
  return db.get('aiCache', normalizeKey(dishName))
}

export async function setAiCache(entry: AiCacheEntry): Promise<void> {
  const db = await getDB()
  await db.put('aiCache', { ...entry, dishName: normalizeKey(entry.dishName) })
}

export async function getAllAiCache(): Promise<AiCacheEntry[]> {
  const db = await getDB()
  return db.getAll('aiCache')
}

export async function clearAiCache(): Promise<void> {
  const db = await getDB()
  await db.clear('aiCache')
}
