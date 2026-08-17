import { getDB } from './schema'
import type { WorkoutSession } from '../types'

export async function saveSession(session: WorkoutSession): Promise<void> {
  const db = await getDB()
  await db.put('workoutSessions', session)
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  const db = await getDB()
  return db.get('workoutSessions', id)
}

export async function getSessionsForDate(date: string): Promise<WorkoutSession[]> {
  const db = await getDB()
  return db.getAllFromIndex('workoutSessions', 'by-date', date)
}

export async function getAllSessions(): Promise<WorkoutSession[]> {
  const db = await getDB()
  const all = await db.getAll('workoutSessions')
  // Sort newest first
  return all.sort((a, b) => b.date.localeCompare(a.date))
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('workoutSessions', id)
}
