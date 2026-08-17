import { useState } from 'react'
import { Key, Target, Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { showToast } from '../components/ui/Toast'
import { useAppStore } from '../store/useAppStore'
import { getAllFoodItems, bulkUpsertFoodItems } from '../db/foodItems'
import { getAllWeeklyMenus, saveWeeklyMenu } from '../db/weeklyMenus'
import { getAllLogs, upsertDailyLog } from '../db/dailyLogs'
import { saveGeminiKey } from '../db/userProfile'

export function Settings() {
  const { profile, saveProfile } = useAppStore()

  const [apiKey, setApiKey] = useState(profile?.geminiApiKey ?? '')
  const [showKey, setShowKey] = useState(false)
  const [proteinGoal, setProteinGoal] = useState(String(profile?.proteinGoalG ?? 120))
  const [calorieGoal, setCalorieGoal] = useState(String(profile?.calorieGoalKcal ?? 2000))
  const [saving, setSaving] = useState(false)

  async function handleSaveGoals() {
    if (!profile) return
    setSaving(true)
    await saveProfile({
      ...profile,
      proteinGoalG: parseInt(proteinGoal) || 120,
      calorieGoalKcal: parseInt(calorieGoal) || 2000,
    })
    showToast('Goals updated!', 'success')
    setSaving(false)
  }

  async function handleSaveKey() {
    if (!profile) return
    const trimmed = apiKey.trim()
    await saveProfile({ ...profile, geminiApiKey: trimmed || undefined })
    await saveGeminiKey(trimmed)
    showToast(trimmed ? 'API key saved!' : 'API key cleared', 'success')
  }

  async function handleExport() {
    const [foods, menus, logs] = await Promise.all([
      getAllFoodItems(),
      getAllWeeklyMenus(),
      getAllLogs(),
    ])
    const data = { version: 1, exportedAt: new Date().toISOString(), foods, menus, logs }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `messtrack-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exported successfully!', 'success')
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.foods) await bulkUpsertFoodItems(data.foods)
      if (data.menus) await Promise.all(data.menus.map((m: Parameters<typeof saveWeeklyMenu>[0]) => saveWeeklyMenu(m)))
      if (data.logs) await Promise.all(data.logs.map((l: Parameters<typeof upsertDailyLog>[0]) => upsertDailyLog(l)))
      showToast('Import complete! Reload to see changes.', 'success')
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      showToast('Import failed — invalid file format.', 'error')
    }
    e.target.value = ''
  }

  async function handleReset() {
    if (!confirm('This will delete ALL your data. Are you absolutely sure?')) return
    if (!confirm('Last chance — this cannot be undone. Delete everything?')) return
    indexedDB.deleteDatabase('messtrack-db')
    showToast('All data deleted. Reloading…', 'info')
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Goals */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[var(--color-protein)]" />
            <h2 className="font-semibold text-white">Daily goals</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">Protein (g/day)</label>
              <input
                type="number"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none mt-0.5 focus:ring-1 focus:ring-[var(--color-protein)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">Calories (kcal/day)</label>
              <input
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none mt-0.5 focus:ring-1 focus:ring-[var(--color-calories)]"
              />
            </div>
          </div>
          <Button fullWidth onClick={handleSaveGoals} loading={saving}>Save goals</Button>
        </Card>

        {/* API Key */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[var(--color-carbs)]" />
            <h2 className="font-semibold text-white">Gemini API key</h2>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Your key is stored only in your browser (IndexedDB). It's used exclusively for menu
            parsing and nutrition estimates — sent directly to the Gemini API, never to any other server.
            Both IndexedDB and localStorage are plain JS-readable storage; the privacy guarantee is
            simply that your key never leaves your device except to Google's AI API.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-carbs)] underline block"
          >
            Get a free key at Google AI Studio →
          </a>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 pr-10 text-sm outline-none focus:ring-1 focus:ring-[var(--color-carbs)]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <Button fullWidth variant="secondary" onClick={handleSaveKey}>
            {apiKey.trim() ? 'Update key' : 'Clear key'}
          </Button>
        </Card>

        {/* Export / Import */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[var(--color-accent-orange)]" />
            <h2 className="font-semibold text-white">Backup & restore</h2>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Export your food database, menus, and logs as a JSON file. Import it back on any device.
          </p>
          <div className="flex gap-2">
            <Button fullWidth variant="secondary" onClick={handleExport}>
              <Download size={14} /> Export
            </Button>
          <label className="flex-1 cursor-pointer">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-surface-3)] transition-colors">
                <Upload size={14} /> Import
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="space-y-3 border border-red-500/20">
          <h2 className="font-semibold text-red-400">Danger zone</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Permanently delete all data including food database, menus, and logs. This cannot be undone.
          </p>
          <Button fullWidth variant="danger" onClick={handleReset}>
            <Trash2 size={14} /> Reset all data
          </Button>
        </Card>

        {/* About */}
        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-[var(--color-text-tertiary)]">MessTrack v0.1.0</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">
            All data stays in your browser. No account, no server, no tracking.
          </p>
        </div>
      </div>
    </div>
  )
}
