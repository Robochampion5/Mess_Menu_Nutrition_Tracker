import { getDB } from './schema'
import type { FoodItem } from '../types'

export async function getAllFoodItems(): Promise<FoodItem[]> {
  const db = await getDB()
  return db.getAll('foodItems')
}

export async function getFoodItemById(id: string): Promise<FoodItem | undefined> {
  const db = await getDB()
  return db.get('foodItems', id)
}

export async function upsertFoodItem(item: FoodItem): Promise<void> {
  const db = await getDB()
  await db.put('foodItems', item)
}

export async function deleteFoodItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('foodItems', id)
}

export async function bulkUpsertFoodItems(items: FoodItem[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('foodItems', 'readwrite')
  await Promise.all([...items.map((item) => tx.store.put(item)), tx.done])
}

export async function searchFoodItems(query: string): Promise<FoodItem[]> {
  const all = await getAllFoodItems()
  const q = query.toLowerCase()
  return all.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.aliases.some((a) => a.toLowerCase().includes(q)) ||
      item.coreIngredients.some((i) => i.toLowerCase().includes(q)),
  )
}
