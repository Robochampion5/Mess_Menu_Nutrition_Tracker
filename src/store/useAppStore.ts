import { create } from 'zustand'
import type { FoodItem, WeeklyMenu, DailyLogRecord, UserProfile, MealSlot } from '../types'
import { getAllFoodItems, upsertFoodItem, bulkUpsertFoodItems } from '../db/foodItems'
import { getWeeklyMenu, saveWeeklyMenu } from '../db/weeklyMenus'
import { upsertDailyLog, getLogsForDate } from '../db/dailyLogs'
import { getProfile, saveProfile } from '../db/userProfile'
import { SEED_FOODS } from '../data/seedFoods'
import { toDateString, getISOWeekKey } from '../utils/weekKey'

interface AppState {
  // Data
  foodItems: FoodItem[]
  weeklyMenus: Map<string, WeeklyMenu>
  dailyLogs: Map<string, DailyLogRecord> // key: `${date}::${slot}`
  profile: UserProfile | null

  // UI state
  selectedDate: string
  isHydrated: boolean

  // Actions
  hydrate: () => Promise<void>
  upsertFoodItem: (item: FoodItem) => Promise<void>
  saveWeeklyMenu: (menu: WeeklyMenu) => Promise<void>
  getWeeklyMenu: (weekKey: string) => Promise<WeeklyMenu | undefined>
  upsertDailyLog: (record: DailyLogRecord) => Promise<void>
  getDailyLogsForDate: (date: string) => Promise<DailyLogRecord[]>
  saveProfile: (profile: UserProfile) => Promise<void>
  setSelectedDate: (date: string) => void
}

function logKey(date: string, slot: MealSlot): string {
  return `${date}::${slot}`
}

export const useAppStore = create<AppState>((set, get) => ({
  foodItems: [],
  weeklyMenus: new Map(),
  dailyLogs: new Map(),
  profile: null,
  selectedDate: toDateString(),
  isHydrated: false,

  hydrate: async () => {
    // Load profile
    let profile = await getProfile()

    // Seed food database if empty
    let foodItems = await getAllFoodItems()
    if (foodItems.length === 0) {
      await bulkUpsertFoodItems(SEED_FOODS)
      foodItems = SEED_FOODS
    }

    // Load today's logs
    const today = toDateString()
    const todayLogs = await getLogsForDate(today)
    const logsMap = new Map<string, DailyLogRecord>()
    for (const log of todayLogs) {
      logsMap.set(logKey(log.date, log.mealSlot), log)
    }

    // Load current week's menu
    const weekKey = getISOWeekKey()
    const weekMenu = await getWeeklyMenu(weekKey)
    const menusMap = new Map<string, WeeklyMenu>()
    if (weekMenu) menusMap.set(weekKey, weekMenu)

    set({
      profile: profile ?? null,
      foodItems,
      dailyLogs: logsMap,
      weeklyMenus: menusMap,
      isHydrated: true,
    })
  },

  upsertFoodItem: async (item) => {
    await upsertFoodItem(item)
    const all = await getAllFoodItems()
    set({ foodItems: all })
  },

  saveWeeklyMenu: async (menu) => {
    await saveWeeklyMenu(menu)
    set((state) => {
      const newMap = new Map(state.weeklyMenus)
      newMap.set(menu.weekKey, menu)
      return { weeklyMenus: newMap }
    })
  },

  getWeeklyMenu: async (weekKey) => {
    const existing = get().weeklyMenus.get(weekKey)
    if (existing) return existing
    const fromDB = await getWeeklyMenu(weekKey)
    if (fromDB) {
      set((state) => {
        const newMap = new Map(state.weeklyMenus)
        newMap.set(weekKey, fromDB)
        return { weeklyMenus: newMap }
      })
    }
    return fromDB
  },

  upsertDailyLog: async (record) => {
    await upsertDailyLog(record)
    set((state) => {
      const newMap = new Map(state.dailyLogs)
      newMap.set(logKey(record.date, record.mealSlot), record)
      return { dailyLogs: newMap }
    })
  },

  getDailyLogsForDate: async (date) => {
    const logs = await getLogsForDate(date)
    set((state) => {
      const newMap = new Map(state.dailyLogs)
      for (const log of logs) {
        newMap.set(logKey(log.date, log.mealSlot), log)
      }
      return { dailyLogs: newMap }
    })
    return logs
  },

  saveProfile: async (profile) => {
    await saveProfile(profile)
    set({ profile })
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}))
