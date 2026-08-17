import { getDB } from './schema'
import type { PersonalRecord } from '../types'

export async function getRecord(exerciseId: string): Promise<PersonalRecord | undefined> {
  const db = await getDB()
  return db.get('personalRecords', exerciseId)
}

export async function getAllRecords(): Promise<PersonalRecord[]> {
  const db = await getDB()
  return db.getAll('personalRecords')
}

export async function saveRecord(record: PersonalRecord): Promise<void> {
  const db = await getDB()
  await db.put('personalRecords', record)
}

export async function deleteRecord(exerciseId: string): Promise<void> {
  const db = await getDB()
  await db.delete('personalRecords', exerciseId)
}
