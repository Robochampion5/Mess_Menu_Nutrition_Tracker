import { describe, it, expect } from 'vitest'
import { toKg, calculate1RM, isNewPR } from '../utils/workout'
import type { WorkoutSet, PersonalRecord } from '../types'

// ─────────────────────────────────────────────────────────────
// toKg
// ─────────────────────────────────────────────────────────────
describe('toKg', () => {
  it('returns the same value for kg unit', () => {
    expect(toKg(100, 'kg')).toBe(100)
  })

  it('defaults to kg when unit is omitted', () => {
    expect(toKg(80)).toBe(80)
  })

  it('converts lb to kg correctly', () => {
    // 100 lb × 0.453592 = 45.3592 kg
    expect(toKg(100, 'lb')).toBeCloseTo(45.3592, 3)
  })

  it('handles 0', () => {
    expect(toKg(0, 'lb')).toBe(0)
    expect(toKg(0, 'kg')).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// calculate1RM (Epley: weightKg × (1 + reps / 30))
// ─────────────────────────────────────────────────────────────
describe('calculate1RM', () => {
  it('returns 0 for weight = 0', () => {
    expect(calculate1RM(0, 5)).toBe(0)
  })

  it('returns 0 for reps = 0', () => {
    expect(calculate1RM(100, 0)).toBe(0)
  })

  it('returns 0 for negative weight', () => {
    expect(calculate1RM(-50, 5)).toBe(0)
  })

  it('returns 0 for negative reps', () => {
    expect(calculate1RM(100, -1)).toBe(0)
  })

  it('returns weightKg exactly for reps = 1 (Epley: weight × 1.0333)', () => {
    // For 1 rep: 100 × (1 + 1/30) ≈ 103.33 — NOT the same as weight.
    // The Epley formula doesn't return exactly 'weight' at reps=1.
    // This test documents the actual behaviour.
    expect(calculate1RM(100, 1)).toBeCloseTo(103.33, 1)
  })

  it('normal case: 100kg × 5 reps', () => {
    // 100 × (1 + 5/30) = 100 × 1.1667 = 116.67
    expect(calculate1RM(100, 5)).toBeCloseTo(116.67, 1)
  })

  it('normal case: 80kg × 10 reps', () => {
    // 80 × (1 + 10/30) = 80 × 1.3333 = 106.67
    expect(calculate1RM(80, 10)).toBeCloseTo(106.67, 1)
  })
})

// ─────────────────────────────────────────────────────────────
// isNewPR
// ─────────────────────────────────────────────────────────────
describe('isNewPR', () => {
  const makeSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
    reps: 5,
    weight: 100,
    unit: 'kg',
    ...overrides,
  })

  const makeRecord = (best1RM: number): PersonalRecord => ({
    exerciseId: 'ex-squat',
    best1RM,
    bestWeightKg: 100,
    bestReps: 5,
    achievedAt: '2026-01-01',
  })

  // First-ever set (no existing record) → always a PR
  it('returns true when there is no existing record', () => {
    expect(isNewPR(makeSet(), undefined)).toBe(true)
  })

  // Failure sets are always excluded
  it('returns false for a failure set regardless of weight', () => {
    expect(isNewPR(makeSet({ weight: 500, reps: 10, isFailure: true }), undefined)).toBe(false)
    expect(isNewPR(makeSet({ weight: 500, reps: 10, isFailure: true }), makeRecord(50))).toBe(false)
  })

  // Strictly better → PR
  it('returns true when new 1RM strictly exceeds existing', () => {
    // 110kg × 5 reps = 1RM ≈ 128.33; existing = 116.67
    const existing = makeRecord(calculate1RM(100, 5))
    expect(isNewPR(makeSet({ weight: 110, reps: 5 }), existing)).toBe(true)
  })

  // Tied 1RM → NOT a new PR
  it('returns false when new 1RM equals existing (tied weight and reps)', () => {
    const rm = calculate1RM(100, 5)
    const existing = makeRecord(rm)
    expect(isNewPR(makeSet({ weight: 100, reps: 5 }), existing)).toBe(false)
  })

  // Lower weight → not a PR
  it('returns false when new 1RM is lower than existing', () => {
    const existing = makeRecord(calculate1RM(120, 5))
    expect(isNewPR(makeSet({ weight: 100, reps: 5 }), existing)).toBe(false)
  })

  // Unit normalization: lb set vs kg record
  it('correctly normalizes lb to kg before comparing', () => {
    // 225lb = ~102.06 kg; 102.06 × (1 + 5/30) ≈ 119.07
    // Existing best = 116.67 (100kg × 5)
    const existing = makeRecord(calculate1RM(100, 5))
    expect(
      isNewPR(makeSet({ weight: 225, reps: 5, unit: 'lb' }), existing),
    ).toBe(true)
  })

  it('lb set that does NOT beat existing kg record returns false', () => {
    // 200lb = ~90.72 kg; 90.72 × (1 + 5/30) ≈ 105.84 < 116.67
    const existing = makeRecord(calculate1RM(100, 5))
    expect(
      isNewPR(makeSet({ weight: 200, reps: 5, unit: 'lb' }), existing),
    ).toBe(false)
  })

  // Edge: set with no weight → not a PR
  it('returns false for a set with no weight or reps', () => {
    expect(isNewPR({ isFailure: false }, undefined)).toBe(false)
    expect(isNewPR({ weight: 0, reps: 5 }, undefined)).toBe(false)
    expect(isNewPR({ weight: 100, reps: 0 }, undefined)).toBe(false)
  })

  // Cardio duration PR
  it('returns true for duration PR when no existing record', () => {
    expect(isNewPR({ duration: 3600 }, undefined)).toBe(true)
  })

  it('returns true when duration exceeds existing best', () => {
    const existing: PersonalRecord = {
      exerciseId: 'ex-plank',
      bestDuration: 60,
      achievedAt: '2026-01-01',
    }
    expect(isNewPR({ duration: 120 }, existing)).toBe(true)
  })

  it('returns false when duration does not beat existing', () => {
    const existing: PersonalRecord = {
      exerciseId: 'ex-plank',
      bestDuration: 120,
      achievedAt: '2026-01-01',
    }
    expect(isNewPR({ duration: 60 }, existing)).toBe(false)
  })
})
