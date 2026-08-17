import { getDB } from './schema'
import type { Exercise } from '../types'

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAll('exercises')
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  const db = await getDB()
  return db.get('exercises', id)
}

export async function upsertExercise(exercise: Exercise): Promise<void> {
  const db = await getDB()
  await db.put('exercises', exercise)
}

export async function bulkUpsertExercises(exercises: Exercise[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('exercises', 'readwrite')
  await Promise.all([...exercises.map((e) => tx.store.put(e)), tx.done])
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('exercises', id)
}
