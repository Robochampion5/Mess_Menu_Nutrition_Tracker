import { openDB, type IDBPDatabase } from 'idb'
import type { FoodItem, WeeklyMenu, DailyLogRecord, UserProfile, AiCacheEntry } from '../types'

const DB_NAME = 'messtrack-db'
const DB_VERSION = 1

export interface MessTrackDB {
  foodItems: {
    key: string
    value: FoodItem
    indexes: { 'by-name': string; 'by-category': string }
  }
  weeklyMenus: {
    key: string
    value: WeeklyMenu
  }
  dailyLogs: {
    key: [string, string]
    value: DailyLogRecord
    indexes: { 'by-date': string }
  }
  userProfile: {
    key: 'profile'
    value: UserProfile
  }
  aiCache: {
    key: string
    value: AiCacheEntry
  }
}

let dbInstance: IDBPDatabase<MessTrackDB> | null = null

export async function getDB(): Promise<IDBPDatabase<MessTrackDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<MessTrackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // foodItems store
      if (!db.objectStoreNames.contains('foodItems')) {
        const foodStore = db.createObjectStore('foodItems', { keyPath: 'id' })
        foodStore.createIndex('by-name', 'name', { unique: false })
        foodStore.createIndex('by-category', 'category', { unique: false })
      }

      // weeklyMenus store
      if (!db.objectStoreNames.contains('weeklyMenus')) {
        db.createObjectStore('weeklyMenus', { keyPath: 'weekKey' })
      }

      // dailyLogs store — compound key [date, mealSlot]
      if (!db.objectStoreNames.contains('dailyLogs')) {
        const logStore = db.createObjectStore('dailyLogs', { keyPath: ['date', 'mealSlot'] })
        logStore.createIndex('by-date', 'date', { unique: false })
      }

      // userProfile store — single record keyed by 'profile'
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' })
      }

      // aiCache store — keyed by normalized dish name
      if (!db.objectStoreNames.contains('aiCache')) {
        db.createObjectStore('aiCache', { keyPath: 'dishName' })
      }
    },
    blocked() {
      console.warn('MessTrack DB upgrade blocked by another tab')
    },
    blocking() {
      dbInstance?.close()
      dbInstance = null
    },
  })

  return dbInstance
}
