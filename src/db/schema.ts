import { openDB, type IDBPDatabase } from 'idb'
import type {
  FoodItem,
  WeeklyMenu,
  DailyLogRecord,
  UserProfile,
  AiCacheEntry,
  Exercise,
  WorkoutSession,
  PersonalRecord,
} from '../types'

const DB_NAME = 'messtrack-db'
const DB_VERSION = 2

export interface MessTrackDB {
  // ── v1 stores (unchanged) ──
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
  // ── v2 stores (workout tracking) ──
  exercises: {
    key: string
    value: Exercise
    indexes: { 'by-name': string; 'by-category': string }
  }
  workoutSessions: {
    key: string
    value: WorkoutSession
    indexes: { 'by-date': string }
  }
  personalRecords: {
    key: string
    value: PersonalRecord
  }
}

let dbInstance: IDBPDatabase<MessTrackDB> | null = null

export async function getDB(): Promise<IDBPDatabase<MessTrackDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<MessTrackDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // ── v1 stores — create only if they don't exist (first-install path) ──
      if (!db.objectStoreNames.contains('foodItems')) {
        const foodStore = db.createObjectStore('foodItems', { keyPath: 'id' })
        foodStore.createIndex('by-name', 'name', { unique: false })
        foodStore.createIndex('by-category', 'category', { unique: false })
      }
      if (!db.objectStoreNames.contains('weeklyMenus')) {
        db.createObjectStore('weeklyMenus', { keyPath: 'weekKey' })
      }
      if (!db.objectStoreNames.contains('dailyLogs')) {
        const logStore = db.createObjectStore('dailyLogs', { keyPath: ['date', 'mealSlot'] })
        logStore.createIndex('by-date', 'date', { unique: false })
      }
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('aiCache')) {
        db.createObjectStore('aiCache', { keyPath: 'dishName' })
      }

      // ── v2 stores — added ONLY when upgrading from v1; never delete existing stores ──
      // Safety: this block only runs when oldVersion < 2 (new installs get it above via the
      // objectStoreNames guard; existing v1 users get it here). No v1 store is ever touched.
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('exercises')) {
          const exStore = db.createObjectStore('exercises', { keyPath: 'id' })
          exStore.createIndex('by-name', 'name', { unique: false })
          exStore.createIndex('by-category', 'category', { unique: false })
        }
        if (!db.objectStoreNames.contains('workoutSessions')) {
          const sessionStore = db.createObjectStore('workoutSessions', { keyPath: 'id' })
          sessionStore.createIndex('by-date', 'date', { unique: false })
        }
        if (!db.objectStoreNames.contains('personalRecords')) {
          db.createObjectStore('personalRecords', { keyPath: 'exerciseId' })
        }
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
