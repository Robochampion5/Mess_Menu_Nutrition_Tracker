import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import type { Exercise, ExerciseCategory } from '../../types'

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
  other: 'Other',
}

interface ExerciseSearchProps {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onCreateCustom: (name: string) => void
  /** Exercise IDs already in the session (to show "added" state) */
  addedIds?: Set<string>
}

export function ExerciseSearch({
  exercises,
  onSelect,
  onCreateCustom,
  addedIds = new Set(),
}: ExerciseSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered =
    query.trim().length === 0
      ? exercises.slice(0, 20)
      : exercises.filter(
          (e) =>
            e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.muscleGroups.some((m) => m.toLowerCase().includes(query.toLowerCase())),
        )

  // Dedup check: case-insensitive match against all exercises
  const exactMatch = exercises.find((e) => e.name.toLowerCase() === query.trim().toLowerCase())
  const showCreateOption =
    query.trim().length >= 2 && !exactMatch && filtered.length < exercises.length

  function handleSelect(ex: Exercise) {
    // Warn if choosing a custom name that duplicates a seeded exercise
    if (exactMatch && exactMatch.id !== ex.id) {
      // shouldn't happen in filtered list, but guard anyway
    }
    onSelect(ex)
    setQuery('')
    setOpen(false)
  }

  function handleCreate() {
    const name = query.trim()
    if (!name) return
    // Check dedup
    if (exactMatch) {
      if (
        !window.confirm(
          `"${exactMatch.name}" already exists — use that instead? Click Cancel to create a separate custom entry anyway.`,
        )
      ) {
        return
      }
      onSelect(exactMatch)
      setQuery('')
      setOpen(false)
      return
    }
    onCreateCustom(name)
    setQuery('')
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!inputRef.current?.closest('[data-exercise-search]')?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" data-exercise-search="">
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)]"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Search size={16} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search exercises…"
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
            aria-label="Clear"
          >
            <X size={14} className="text-[var(--color-text-tertiary)]" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-[var(--radius-lg)] overflow-hidden z-50"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card-raised)',
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 && !showCreateOption && (
            <p className="px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
              No exercises found
            </p>
          )}

          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleSelect(ex)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{ex.name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {CATEGORY_LABELS[ex.category]} · {ex.muscleGroups.slice(0, 2).join(', ')}
                </p>
              </div>
              {addedIds.has(ex.id) ? (
                <span className="text-xs text-[var(--color-text-tertiary)]">Added</span>
              ) : (
                <Plus size={14} className="text-[var(--color-text-secondary)]" />
              )}
            </button>
          ))}

          {showCreateOption && (
            <>
              {filtered.length > 0 && (
                <div
                  className="mx-4 my-1"
                  style={{ height: 1, background: 'var(--color-border)' }}
                />
              )}
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[var(--color-surface-3)] transition-colors"
              >
                <Plus size={14} style={{ color: 'var(--color-protein)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-protein)' }}>
                  Create "{query.trim()}"
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
