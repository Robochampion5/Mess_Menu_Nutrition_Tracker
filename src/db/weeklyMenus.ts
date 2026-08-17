import { getDB } from './schema'
import type { WeeklyMenu } from '../types'

export async function getWeeklyMenu(weekKey: string): Promise<WeeklyMenu | undefined> {
  const db = await getDB()
  return db.get('weeklyMenus', weekKey)
}

export async function saveWeeklyMenu(menu: WeeklyMenu): Promise<void> {
  const db = await getDB()
  await db.put('weeklyMenus', menu)
}

export async function getAllWeeklyMenus(): Promise<WeeklyMenu[]> {
  const db = await getDB()
  return db.getAll('weeklyMenus')
}

export async function deleteWeeklyMenu(weekKey: string): Promise<void> {
  const db = await getDB()
  await db.delete('weeklyMenus', weekKey)
}
