// Shared types for the entire application

export type MealSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type FoodCategory =
  | 'dal'
  | 'sabzi'
  | 'roti'
  | 'rice'
  | 'egg'
  | 'paneer'
  | 'chicken'
  | 'fish'
  | 'curd'
  | 'salad'
  | 'dessert'
  | 'snack'
  | 'beverage'
  | 'bread'
  | 'soup'
  | 'chutney'
  | 'other'

export type CuisineTag = 'north_indian' | 'south_indian' | 'continental' | 'other'

export interface FoodItem {
  id: string
  name: string
  aliases: string[]
  category: FoodCategory
  cuisineTag: CuisineTag
  coreIngredients: string[]
  caloriesPer: number // per serving
  proteinPer: number // g per serving
  carbsPer: number // g per serving
  fatPer: number // g per serving
  servingUnit: string // e.g. "1 bowl", "1 piece", "100g"
  servingGrams: number // approximate grams per serving
  isCustom?: boolean // true if user-added
}

export interface WeeklyMenuItem {
  foodItemId: string
  day: number // 0=Mon ... 6=Sun
  slot: MealSlot
}

export interface WeeklyMenu {
  weekKey: string // YYYY-Www
  items: WeeklyMenuItem[]
}

export interface DailyLogEntry {
  foodId: string
  servings: number
  isOutsideFood: boolean
}

export interface DailyLogRecord {
  date: string // YYYY-MM-DD
  mealSlot: MealSlot
  status: 'ate' | 'skipped' | 'unset'
  entries: DailyLogEntry[]
  notes?: string
}

export interface UserProfile {
  id: 'profile'
  name?: string
  weightKg?: number
  activityLevel?: ActivityLevel
  proteinGoalG: number // daily target
  calorieGoalKcal: number // daily target
  geminiApiKey?: string // stored in IDB, never in repo
  onboardingComplete: boolean
  createdAt: string
}

export interface AiCacheEntry {
  dishName: string // normalized lowercase key
  matchedFoodId?: string
  confidence?: number
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    servingUnit: string
  }
  cachedAt: string
}

// Computed helpers
export interface DailyMacros {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner']
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── Workout Types ─────────────────────────────────────────────────────

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'other'
export type TrackingType = 'sets_reps_weight' | 'duration' | 'distance_duration'
export type WeightUnit = 'kg' | 'lb'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  muscleGroups: string[] // e.g. ['chest', 'triceps']
  trackingType: TrackingType
  isCustom?: boolean
}

/** One set of an exercise */
export interface WorkoutSet {
  reps?: number         // for sets_reps_weight
  weight?: number       // display value (may be in kg or lb)
  unit?: WeightUnit     // kg or lb — defaults to kg
  weightKg?: number     // canonical normalized value used for PR comparison
  duration?: number     // seconds — for duration / distance_duration
  distance?: number     // km — for distance_duration
  isFailure?: boolean   // failed set — excluded from PR detection
}

/** An exercise within a session, with its sets */
export interface WorkoutExercise {
  exerciseId: string
  sets: WorkoutSet[]
  notes?: string
}

/** A single training session */
export interface WorkoutSession {
  id: string            // nanoid / crypto.randomUUID
  date: string          // YYYY-MM-DD
  name?: string         // e.g. "Push Day"
  exercises: WorkoutExercise[]
  notes?: string
  durationMin?: number  // optional total session duration
  createdAt: string
}

/** Best performance for an exercise — always stored in kg internally */
export interface PersonalRecord {
  exerciseId: string
  // Strength PRs (sets_reps_weight)
  bestWeightKg?: number
  bestReps?: number
  best1RM?: number      // Epley formula: weightKg × (1 + reps / 30)
  // Cardio PRs
  bestDuration?: number // seconds
  bestDistance?: number // km
  achievedAt: string    // ISO date string
  displayUnit?: WeightUnit // unit the user was using when they set the PR (for display)
}
