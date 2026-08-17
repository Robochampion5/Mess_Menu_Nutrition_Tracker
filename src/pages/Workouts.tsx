import { useState, useMemo, useCallback } from 'react'
import { Plus, ChevronDown, ChevronUp, Dumbbell, Trophy, History, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import { ExerciseSearch } from '../components/workout/ExerciseSearch'
import { SetRow } from '../components/workout/SetRow'
import { RestTimer } from '../components/workout/RestTimer'
import { EmptyState } from '../components/ui/EmptyState'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { showToast } from '../components/ui/Toast'
import type { Exercise, WorkoutExercise, WorkoutSet, WorkoutSession, PersonalRecord } from '../types'
import { toDateString } from '../utils/weekKey'
import { isNewPR, calculate1RM, toKg } from '../utils/workout'

type Tab = 'log' | 'history' | 'records'

function generateId() {
  return crypto.randomUUID()
}

// ─────────────────────────────────────────────────────────────
// Log Tab — today's active workout
// ─────────────────────────────────────────────────────────────
function LogTab() {
  const { exercises, personalRecords, saveWorkoutSession, deleteWorkoutSession, workoutSessions, upsertExercise } =
    useAppStore()

  const today = toDateString()
  const todaySession = workoutSessions.find((s) => s.date === today)

  const [session, setSession] = useState<WorkoutSession | null>(todaySession ?? null)
  const [sessionName, setSessionName] = useState(todaySession?.name ?? '')
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [showTimer, setShowTimer] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [newPRMap, setNewPRMap] = useState<Set<string>>(new Set()) // set of exerciseId+setIndex

  const addedIds = useMemo(
    () => new Set(session?.exercises.map((e) => e.exerciseId) ?? []),
    [session],
  )

  function startSession() {
    const s: WorkoutSession = {
      id: generateId(),
      date: today,
      name: '',
      exercises: [],
      createdAt: new Date().toISOString(),
    }
    setSession(s)
  }

  function addExercise(ex: Exercise) {
    if (!session) return
    if (addedIds.has(ex.id)) return
    setSession((s) =>
      s
        ? {
            ...s,
            exercises: [
              ...s.exercises,
              { exerciseId: ex.id, sets: [{ reps: 8, weight: 0, unit: 'kg' }] },
            ],
          }
        : s,
    )
    setExpandedExercise(ex.id)
  }

  async function handleCreateCustom(name: string) {
    const ex: Exercise = {
      id: `custom-${generateId()}`,
      name,
      category: 'other',
      muscleGroups: [],
      trackingType: 'sets_reps_weight',
      isCustom: true,
    }
    await upsertExercise(ex)
    addExercise(ex)
  }

  function updateSet(exerciseId: string, setIdx: number, updated: WorkoutSet) {
    if (!session) return
    // Check for PR in real-time
    const existing = personalRecords.get(exerciseId)
    const isPR = isNewPR(updated, existing)
    const key = `${exerciseId}-${setIdx}`
    setNewPRMap((prev) => {
      const next = new Set(prev)
      if (isPR) next.add(key); else next.delete(key)
      return next
    })
    setSession((s) =>
      s
        ? {
            ...s,
            exercises: s.exercises.map((we) =>
              we.exerciseId !== exerciseId
                ? we
                : {
                    ...we,
                    sets: we.sets.map((set, i) => (i === setIdx ? updated : set)),
                  },
            ),
          }
        : s,
    )
    // Auto-start rest timer
    setTimerKey((k) => k + 1)
    setShowTimer(true)
  }

  function addSet(exerciseId: string, trackingType: Exercise['trackingType']) {
    setSession((s) =>
      s
        ? {
            ...s,
            exercises: s.exercises.map((we) =>
              we.exerciseId !== exerciseId
                ? we
                : {
                    ...we,
                    sets: [
                      ...we.sets,
                      trackingType === 'sets_reps_weight'
                        ? { reps: 8, weight: 0, unit: 'kg' as const }
                        : trackingType === 'duration'
                          ? { duration: 60 }
                          : { distance: 0, duration: 0 },
                    ],
                  },
            ),
          }
        : s,
    )
  }

  function deleteSet(exerciseId: string, setIdx: number) {
    setSession((s) =>
      s
        ? {
            ...s,
            exercises: s.exercises.map((we) =>
              we.exerciseId !== exerciseId
                ? we
                : { ...we, sets: we.sets.filter((_, i) => i !== setIdx) },
            ),
          }
        : s,
    )
  }

  function removeExercise(exerciseId: string) {
    setSession((s) =>
      s ? { ...s, exercises: s.exercises.filter((we) => we.exerciseId !== exerciseId) } : s,
    )
  }

  async function handleSave() {
    if (!session) return
    setSaving(true)
    try {
      const toSave: WorkoutSession = { ...session, name: sessionName }
      const newPRs = await saveWorkoutSession(toSave)
      if (newPRs.length > 0) {
        showToast(`🏆 ${newPRs.length} new PR${newPRs.length > 1 ? 's' : ''}!`, 'success')
      } else {
        showToast('Workout saved!', 'success')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!session || !window.confirm('Delete this workout session?')) return
    await deleteWorkoutSession(session.id)
    setSession(null)
    setSessionName('')
    showToast('Session deleted', 'info')
  }

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  if (!session) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No workout today"
        description="Start a session to log your exercises, sets, and track personal records."
        action={{ label: 'Start Workout', onClick: startSession }}
        className="flex-1"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session name (e.g. Push Day)"
          className="flex-1 bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none focus:ring-1"
          style={{ '--tw-ring-color': 'var(--color-protein)' } as React.CSSProperties}
        />
        <button
          onClick={handleDelete}
          className="p-2 rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
          aria-label="Delete session"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Rest timer */}
      {showTimer && (
        <RestTimer key={timerKey} autoStart onDone={() => setShowTimer(false)} />
      )}

      {/* Exercise list */}
      {session.exercises.map((we: WorkoutExercise) => {
        const ex = exerciseMap.get(we.exerciseId)
        if (!ex) return null
        const isExpanded = expandedExercise === we.exerciseId

        return (
          <div
            key={we.exerciseId}
            className="rounded-[var(--radius-xl)] overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Exercise header */}
            <div
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              onClick={() => setExpandedExercise(isExpanded ? null : we.exerciseId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedExercise(isExpanded ? null : we.exerciseId) }}
            >
              <div className="flex items-center gap-3">
                <Dumbbell size={16} style={{ color: 'var(--color-protein)' }} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{ex.name}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {we.sets.length} set{we.sets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); removeExercise(we.exerciseId) }}
                  className="p-1 text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors"
                  aria-label="Remove exercise"
                >
                  <Trash2 size={14} />
                </button>
                {isExpanded ? <ChevronUp size={16} className="text-[var(--color-text-secondary)]" /> : <ChevronDown size={16} className="text-[var(--color-text-secondary)]" />}
              </div>
            </div>

            {/* Sets */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {we.sets.map((set, idx) => (
                  <SetRow
                    key={idx}
                    setNumber={idx + 1}
                    set={set}
                    trackingType={ex.trackingType}
                    onChange={(updated) => updateSet(we.exerciseId, idx, updated)}
                    onDelete={() => deleteSet(we.exerciseId, idx)}
                    isNewPR={newPRMap.has(`${we.exerciseId}-${idx}`)}
                  />
                ))}
                <button
                  onClick={() => addSet(we.exerciseId, ex.trackingType)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors hover:bg-[var(--color-surface-2)]"
                  style={{ color: 'var(--color-protein)', border: '1px dashed rgba(255,55,95,0.3)' }}
                >
                  <Plus size={14} /> Add Set
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Exercise search */}
      <ExerciseSearch
        exercises={exercises}
        onSelect={addExercise}
        onCreateCustom={handleCreateCustom}
        addedIds={addedIds}
      />

      {/* Save button */}
      {session.exercises.length > 0 && (
        <Button fullWidth onClick={handleSave} loading={saving} size="lg">
          Save Workout
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// History Tab
// ─────────────────────────────────────────────────────────────
function HistoryTab() {
  const { workoutSessions, exercises } = useAppStore()
  const [expanded, setExpanded] = useState<string | null>(null)
  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  if (workoutSessions.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No sessions yet"
        description="Your completed workout sessions will appear here."
      />
    )
  }

  return (
    <div className="space-y-3">
      {workoutSessions.map((s) => (
        <div
          key={s.id}
          className="rounded-[var(--radius-xl)] overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <button
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{s.name || 'Workout'}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {s.date} · {s.exercises.length} exercise{s.exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
            {expanded === s.id ? <ChevronUp size={16} className="text-[var(--color-text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--color-text-tertiary)]" />}
          </button>
          {expanded === s.id && (
            <div className="px-4 pb-4 space-y-2">
              {s.exercises.map((we) => {
                const ex = exerciseMap.get(we.exerciseId)
                return (
                  <div key={we.exerciseId}>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      {ex?.name ?? 'Unknown exercise'}
                    </p>
                    {we.sets.map((set, idx) => (
                      <p key={idx} className="text-xs text-[var(--color-text-tertiary)] ml-2">
                        Set {idx + 1}:{' '}
                        {set.reps != null && set.weight != null
                          ? `${set.reps} × ${set.weight}${set.unit ?? 'kg'}`
                          : set.duration != null
                            ? `${Math.round(set.duration / 60)} min`
                            : `${set.distance ?? 0} km`}
                        {set.isFailure ? ' (F)' : ''}
                      </p>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Records Tab
// ─────────────────────────────────────────────────────────────
function RecordsTab() {
  const { personalRecords, exercises, workoutSessions } = useAppStore()
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const recordsWithExercise = useMemo(
    () =>
      Array.from(personalRecords.values())
        .filter((r) => exerciseMap.has(r.exerciseId))
        .sort((a, b) => (b.best1RM ?? 0) - (a.best1RM ?? 0)),
    [personalRecords, exerciseMap],
  )

  // Trend data for selected exercise
  const trendData = useMemo(() => {
    if (!selectedExerciseId) return []
    return workoutSessions
      .flatMap((s) => {
        const we = s.exercises.find((e) => e.exerciseId === selectedExerciseId)
        if (!we) return []
        const bestSet = we.sets
          .filter((set) => !set.isFailure && set.weight != null && set.reps != null)
          .reduce(
            (best, set) => {
              const w = toKg(set.weight!, set.unit ?? 'kg')
              const rm = calculate1RM(w, set.reps!)
              return rm > (best?.rm ?? 0) ? { rm, weight: set.weight, unit: set.unit } : best
            },
            null as { rm: number; weight: number | undefined; unit: string | undefined } | null,
          )
        if (!bestSet) return []
        return [{ date: s.date, weight: Math.round(bestSet.rm * 10) / 10 }]
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [selectedExerciseId, workoutSessions])

  if (recordsWithExercise.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No records yet"
        description="Log workouts to track your personal bests. Your PRs will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* PR table */}
      <div
        className="rounded-[var(--radius-xl)] overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {recordsWithExercise.map((r: PersonalRecord, idx) => {
          const ex = exerciseMap.get(r.exerciseId)
          return (
            <button
              key={r.exerciseId}
              onClick={() =>
                setSelectedExerciseId(
                  selectedExerciseId === r.exerciseId ? null : r.exerciseId,
                )
              }
              className={[
                'w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]',
                idx > 0 ? 'border-t border-[var(--color-border-subtle)]' : '',
              ].join(' ')}
            >
              <div>
                <p className="text-sm font-medium text-white">{ex?.name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{r.achievedAt}</p>
              </div>
              <div className="text-right">
                {r.best1RM != null && (
                  <p className="text-sm font-bold num-large" style={{ color: 'var(--color-protein)' }}>
                    {Math.round(r.best1RM)}kg 1RM
                  </p>
                )}
                {r.bestWeightKg != null && r.bestReps != null && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {Math.round(r.bestWeightKg * 10) / 10}kg × {r.bestReps}
                  </p>
                )}
                {r.bestDistance != null && (
                  <p className="text-sm font-bold num-large" style={{ color: 'var(--color-calories)' }}>
                    {r.bestDistance}km
                  </p>
                )}
                {r.bestDuration != null && !r.bestDistance && (
                  <p className="text-sm font-bold num-large" style={{ color: 'var(--color-carbs)' }}>
                    {Math.round(r.bestDuration / 60)}min
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Trend chart */}
      {selectedExerciseId && trendData.length >= 2 && (
        <Card padding="md">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            {exerciseMap.get(selectedExerciseId)?.name} — 1RM Trend
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trendData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--color-text-secondary)' }}
                itemStyle={{ color: 'var(--color-protein)' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--color-protein)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-protein)', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Workouts page
// ─────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; Icon: typeof Dumbbell }[] = [
  { id: 'log', label: 'Log', Icon: Dumbbell },
  { id: 'history', label: 'History', Icon: History },
  { id: 'records', label: 'Records', Icon: Trophy },
]

export function Workouts() {
  const [activeTab, setActiveTab] = useState<Tab>('log')

  return (
    <div className="flex-1 overflow-y-auto pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white font-display tracking-tight">Workouts</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Log sessions, track personal records
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="mx-4 mb-4 flex rounded-[var(--radius-lg)] p-1"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-white',
            ].join(' ')}
            style={
              activeTab === id
                ? { background: 'var(--color-surface-3)', boxShadow: 'var(--shadow-card)' }
                : {}
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4">
        {activeTab === 'log' && <LogTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'records' && <RecordsTab />}
      </div>
    </div>
  )
}
