import type { WorkoutSet, PersonalRecord, WorkoutSession, Exercise } from '../types'

/** Convert weight to kg. Identity for 'kg', multiplies by 0.453592 for 'lb'. */
export function toKg(weight: number, unit: 'kg' | 'lb' = 'kg'): number {
  if (unit === 'lb') return weight * 0.453592
  return weight
}

/**
 * Epley 1RM estimate: weightKg × (1 + reps / 30)
 * Returns 0 for invalid input (weight ≤ 0 or reps ≤ 0).
 * For reps = 1, returns weightKg exactly (1 + 1/30 ≈ 1.033 — close enough for a single).
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0
  return weightKg * (1 + reps / 30)
}

/**
 * Determines whether a set represents a new personal record.
 *
 * Rules:
 * - Failure sets (isFailure: true) are always excluded → returns false
 * - Must have both weight and reps to qualify for a strength PR
 * - Weight is normalized to kg before comparison
 * - If no existing record → always a new PR (first-ever set)
 * - Tied 1RM (same value) → NOT a new PR (must strictly exceed)
 */
export function isNewPR(
  set: WorkoutSet,
  existing: PersonalRecord | undefined,
): boolean {
  // Never award PR on a failure set
  if (set.isFailure) return false

  // Strength PR path
  if (set.weight != null && set.reps != null && set.reps > 0 && set.weight > 0) {
    const weightKg = toKg(set.weight, set.unit ?? 'kg')
    const new1RM = calculate1RM(weightKg, set.reps)
    if (!existing || existing.best1RM == null) return true
    return new1RM > existing.best1RM
  }

  // Cardio duration PR
  if (set.duration != null && set.distance == null) {
    if (!existing || existing.bestDuration == null) return true
    return set.duration > existing.bestDuration
  }

  // Cardio distance PR (same or longer time is irrelevant — we track distance)
  if (set.distance != null) {
    if (!existing || existing.bestDistance == null) return true
    return set.distance > existing.bestDistance
  }

  return false
}

/**
 * Derives updated PersonalRecord objects from a completed session.
 * Only exercises whose current session data beats the stored record are returned.
 * Callers should upsert the returned records into the DB.
 */
export function derivePRsFromSession(
  session: WorkoutSession,
  exercises: Exercise[],
  currentRecords: Map<string, PersonalRecord>,
): PersonalRecord[] {
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))
  const updated: PersonalRecord[] = []

  for (const we of session.exercises) {
    const exercise = exerciseMap.get(we.exerciseId)
    if (!exercise) continue

    const existing = currentRecords.get(we.exerciseId)
    let newRecord: PersonalRecord | null = null

    for (const set of we.sets) {
      if (!isNewPR(set, newRecord ?? existing)) continue

      if (exercise.trackingType === 'sets_reps_weight' && set.weight != null && set.reps != null) {
        const weightKg = toKg(set.weight, set.unit ?? 'kg')
        const new1RM = calculate1RM(weightKg, set.reps)
        newRecord = {
          exerciseId: we.exerciseId,
          bestWeightKg: weightKg,
          bestReps: set.reps,
          best1RM: new1RM,
          achievedAt: session.date,
          displayUnit: set.unit ?? 'kg',
        }
      } else if (exercise.trackingType === 'duration' && set.duration != null) {
        newRecord = {
          exerciseId: we.exerciseId,
          bestDuration: set.duration,
          achievedAt: session.date,
        }
      } else if (exercise.trackingType === 'distance_duration' && set.distance != null) {
        newRecord = {
          exerciseId: we.exerciseId,
          bestDistance: set.distance,
          bestDuration: set.duration,
          achievedAt: session.date,
        }
      }
    }

    if (newRecord) updated.push(newRecord)
  }

  return updated
}

/** Format seconds to mm:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
