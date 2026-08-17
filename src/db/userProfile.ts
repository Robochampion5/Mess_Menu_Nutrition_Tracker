import { getDB } from './schema'
import type { UserProfile } from '../types'

const PROFILE_KEY = 'profile' as const

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB()
  return db.get('userProfile', PROFILE_KEY)
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB()
  await db.put('userProfile', profile)
}

export async function getGeminiKey(): Promise<string | undefined> {
  const profile = await getProfile()
  return profile?.geminiApiKey
}

export async function saveGeminiKey(key: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('userProfile', PROFILE_KEY)
  if (existing) {
    await db.put('userProfile', { ...existing, geminiApiKey: key })
  }
}
