/** Returns ISO week key in format YYYY-Www (e.g. "2024-W32") */
export function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7 // Mon=1, Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/** Returns YYYY-MM-DD for a given date */
export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0] ?? ''
}

/** Returns the Monday of the ISO week containing the given date */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay() || 7 // Mon=1 Sun=7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns all 7 dates (Mon–Sun) for the ISO week of the given date as YYYY-MM-DD */
export function getWeekDates(date: Date = new Date()): string[] {
  const monday = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toDateString(d)
  })
}

/** Day index 0=Mon 6=Sun from a YYYY-MM-DD string */
export function dayIndexFromDateString(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  return (d.getDay() + 6) % 7 // Mon=0 Sun=6
}

/** Human-readable relative date label */
export function relativeDateLabel(dateStr: string): string {
  const today = toDateString()
  const yesterday = toDateString(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}
