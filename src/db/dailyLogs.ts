import { getDB } from './schema'
import type { DailyLogRecord, MealSlot } from '../types'

export async function getDailyLog(
  date: string,
  mealSlot: MealSlot,
): Promise<DailyLogRecord | undefined> {
  const db = await getDB()
  return db.get('dailyLogs', [date, mealSlot])
}

/**
 * Always replaces the full record (read → mutate → write pattern).
 * Never partially appends — callers own the merge logic.
 */
export async function upsertDailyLog(record: DailyLogRecord): Promise<void> {
  const db = await getDB()
  await db.put('dailyLogs', record)
}

export async function deleteDailyLog(date: string, mealSlot: MealSlot): Promise<void> {
  const db = await getDB()
  await db.delete('dailyLogs', [date, mealSlot])
}

export async function getLogsForDate(date: string): Promise<DailyLogRecord[]> {
  const db = await getDB()
  const index = db.transaction('dailyLogs').store.index('by-date')
  return index.getAll(date)
}

export async function getLogsForWeek(weekDates: string[]): Promise<DailyLogRecord[]> {
  const results = await Promise.all(weekDates.map((date) => getLogsForDate(date)))
  return results.flat()
}

export async function getAllLogs(): Promise<DailyLogRecord[]> {
  const db = await getDB()
  return db.getAll('dailyLogs')
}
