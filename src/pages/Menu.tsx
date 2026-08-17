import { useState, useEffect, useMemo } from 'react'
import { ClipboardList, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { showToast } from '../components/ui/Toast'
import { useAppStore } from '../store/useAppStore'
import { parseMenuText } from '../ai/parseMenu'
import { matchDishes, MATCH_CONFIDENCE_THRESHOLD } from '../ai/matchDishes'
import { estimateNutrition } from '../ai/estimateNutrition'
import type { WeeklyMenu, WeeklyMenuItem, FoodItem, MealSlot } from '../types'
import { getISOWeekKey } from '../utils/weekKey'
import { upsertFoodItem } from '../db/foodItems'
import { DAY_NAMES } from '../types'

type ImportStep = 'paste' | 'parsing' | 'review' | 'done'

interface ReviewItem {
  day: string
  slot: MealSlot
  dish: string
  matchedFoodId: string | null
  confidence: number
  isNew: boolean
  newNutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    servingUnit: string
  }
  estimating?: boolean
}

function generateFoodId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function Menu() {
  const { foodItems, weeklyMenus, saveWeeklyMenu, upsertFoodItem: storeFoodItem, getWeeklyMenu } = useAppStore()
  const weekKey = getISOWeekKey()
  const [rawText, setRawText] = useState('')
  const [step, setStep] = useState<ImportStep>('paste')
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [saving, setSaving] = useState(false)
  const [existingMenuWarning, setExistingMenuWarning] = useState(false)
  const [mergeMode, setMergeMode] = useState<'merge' | 'replace'>('merge')

  const existingMenu = weeklyMenus.get(weekKey)
  const foodMap = useMemo(() => new Map(foodItems.map((f) => [f.id, f])), [foodItems])

  useEffect(() => {
    getWeeklyMenu(weekKey)
  }, [weekKey, getWeeklyMenu])

  async function handleParse() {
    if (!rawText.trim()) return
    setStep('parsing')

    const parsed = await parseMenuText(rawText)

    if (!parsed.ok) {
      if (parsed.noKey) {
        showToast('Add your Gemini API key in Settings to use AI parsing.', 'error')
      } else {
        showToast(`Parse failed: ${parsed.error}`, 'error')
      }
      setStep('paste')
      return
    }

    // Match dishes against food DB
    const dishNames = [...new Set(parsed.items.map((i) => i.dish))]
    const matchResult = await matchDishes(dishNames, foodItems)

    const matchMap = new Map<string, { matchedId: string | null; confidence: number; isNew: boolean }>()
    if (matchResult.ok) {
      for (const m of matchResult.matches) {
        matchMap.set(m.input, { matchedId: m.matchedId, confidence: m.confidence, isNew: m.isNew })
      }
    }

    const items: ReviewItem[] = parsed.items.map((item) => {
      const match = matchMap.get(item.dish)
      return {
        day: item.day,
        slot: item.slot,
        dish: item.dish,
        matchedFoodId: match?.matchedId ?? null,
        confidence: match?.confidence ?? 0,
        isNew: match?.isNew ?? true,
      }
    })

    // Auto-estimate nutrition for new dishes
    const newItems = items.filter(
      (item, i, arr) =>
        item.isNew && arr.findIndex((x) => x.dish === item.dish) === i,
    )

    const estimatedItems = [...items]
    for (const newItem of newItems) {
      const idxEst = estimatedItems.findIndex((x) => x.dish === newItem.dish && x.isNew)
        if (idxEst >= 0) {
          const cur = estimatedItems[idxEst]!
          estimatedItems[idxEst] = { ...cur, estimating: true }
        }
      const est = await estimateNutrition(newItem.dish)
      for (let i = 0; i < estimatedItems.length; i++) {
        if (estimatedItems[i]?.dish === newItem.dish && estimatedItems[i]?.isNew) {
          estimatedItems[i] = {
            ...estimatedItems[i]!,
            newNutrition: est.ok ? est.nutrition : undefined,
            estimating: false,
          }
        }
      }
    }

    if (existingMenu) setExistingMenuWarning(true)
    setReviewItems(estimatedItems)
    setStep('review')
  }

  async function handleSave() {
    setSaving(true)
    try {
      // 1. Save new food items
      const seenNewDishes = new Set<string>()
      for (const item of reviewItems) {
        if (item.isNew && !seenNewDishes.has(item.dish) && item.newNutrition) {
          seenNewDishes.add(item.dish)
          const newFood: FoodItem = {
            id: generateFoodId(item.dish),
            name: item.dish,
            aliases: [],
            category: 'other',
            cuisineTag: 'other',
            coreIngredients: [],
            caloriesPer: item.newNutrition.calories,
            proteinPer: item.newNutrition.protein,
            carbsPer: item.newNutrition.carbs,
            fatPer: item.newNutrition.fat,
            servingUnit: item.newNutrition.servingUnit,
            servingGrams: 150,
            isCustom: true,
          }
          await storeFoodItem(newFood)
        }

        // Add alias to matched food item
        if (!item.isNew && item.matchedFoodId && item.confidence >= MATCH_CONFIDENCE_THRESHOLD) {
          const existing = foodMap.get(item.matchedFoodId)
          if (existing && !existing.aliases.includes(item.dish)) {
            await upsertFoodItem({ ...existing, aliases: [...existing.aliases, item.dish] })
          }
        }
      }

      // 2. Build menu items
      const currentMenu = mergeMode === 'merge' ? (existingMenu ?? { weekKey, items: [] }) : { weekKey, items: [] }
      const menuItems: WeeklyMenuItem[] = []

      for (const item of reviewItems) {
        const foodId = item.isNew
          ? generateFoodId(item.dish)
          : (item.matchedFoodId ?? generateFoodId(item.dish))

        const dayIdx = DAY_NAMES.findIndex((d) => d.toLowerCase() === item.day.toLowerCase())
        if (dayIdx < 0) continue

        const alreadyExists = currentMenu.items.some(
          (m) => m.foodItemId === foodId && m.day === dayIdx && m.slot === item.slot,
        )
        if (!alreadyExists) {
          menuItems.push({ foodItemId: foodId, day: dayIdx, slot: item.slot })
        }
      }

      const finalMenu: WeeklyMenu = {
        weekKey,
        items: mergeMode === 'merge' ? [...currentMenu.items, ...menuItems] : menuItems,
      }

      await saveWeeklyMenu(finalMenu)
      showToast('Menu saved!', 'success')
      setStep('done')
    } catch {
      showToast('Failed to save menu. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function copyLastWeek() {
    const lastWeekDate = new Date()
    lastWeekDate.setDate(lastWeekDate.getDate() - 7)
    const lastWeekKey = getISOWeekKey(lastWeekDate)
    const lastMenu = await getWeeklyMenu(lastWeekKey)
    if (!lastMenu) {
      showToast('No menu found for last week.', 'info')
      return
    }
    await saveWeeklyMenu({ ...lastMenu, weekKey })
    showToast('Last week\'s menu copied!', 'success')
    setStep('done')
  }

  const autoMatched = reviewItems.filter((r) => !r.isNew && r.confidence >= MATCH_CONFIDENCE_THRESHOLD)
  const needsReview = reviewItems.filter(
    (r) => r.isNew || r.confidence < MATCH_CONFIDENCE_THRESHOLD,
  )

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">Menu</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{weekKey}</p>
      </div>

      {step === 'paste' && (
        <div className="px-4 space-y-4">
          {existingMenu && (
            <Card className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Menu already saved</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {existingMenu.items.length} items. Re-import to update.
                </p>
              </div>
            </Card>
          )}

          <Card padding="none" className="overflow-hidden">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste your weekly mess menu here.\n\nAny format works — table, list, text. The AI will extract dishes automatically.\n\nExample:\nMonday Breakfast: Idli, Sambar\nMonday Lunch: Dal Tadka, Rice, Roti...`}
              className="w-full bg-transparent text-sm text-white placeholder:text-[var(--color-text-tertiary)] p-4 resize-none outline-none min-h-[200px]"
            />
          </Card>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={copyLastWeek}
              className="flex-1"
            >
              <Copy size={14} /> Copy last week
            </Button>
            <Button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="flex-1"
            >
              <ClipboardList size={14} /> Parse menu
            </Button>
          </div>
        </div>
      )}

      {step === 'parsing' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--color-text-secondary)]">Parsing menu with AI…</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Matching dishes against your food database</p>
        </div>
      )}

      {step === 'review' && (
        <div className="px-4 space-y-4">
          {existingMenuWarning && (
            <Card className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">This week already has a menu</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Your existing logs won't be deleted. Items no longer in the new menu will show as
                    "custom entry" in history.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(['merge', 'replace'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMergeMode(mode)}
                    className={`flex-1 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${mergeMode === mode ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}
                  >
                    {mode === 'merge' ? 'Merge (safe)' : 'Replace'}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="flex gap-2">
            <Badge variant="success">{autoMatched.length} auto-matched</Badge>
            {needsReview.length > 0 && (
              <Badge variant="warning">{needsReview.length} new / review</Badge>
            )}
          </div>

          {/* Grouped by day */}
          {DAY_NAMES.map((dayName) => {
            const dayItems = reviewItems.filter(
              (r) => r.day.toLowerCase() === dayName.toLowerCase(),
            )
            if (dayItems.length === 0) return null
            return (
              <div key={dayName}>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                  {dayName}
                </p>
                <div className="space-y-1.5">
                  {dayItems.map((item, idx) => (
                    <Card key={idx} padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white truncate">{item.dish}</span>
                            {item.isNew ? (
                              <Badge variant="warning" size="sm">New</Badge>
                            ) : item.confidence >= MATCH_CONFIDENCE_THRESHOLD ? (
                              <Badge variant="success" size="sm">✓ Matched</Badge>
                            ) : (
                              <Badge variant="warning" size="sm">Low confidence</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-tertiary)] capitalize">
                            {item.slot}
                            {!item.isNew && item.matchedFoodId && (
                              <> · {foodMap.get(item.matchedFoodId)?.name ?? item.matchedFoodId}</>
                            )}
                          </p>
                          {item.isNew && item.estimating && (
                            <span className="text-xs text-[var(--color-text-tertiary)]">Estimating nutrition…</span>
                          )}
                          {item.isNew && item.newNutrition && (
                            <p className="text-xs text-amber-400 mt-0.5">
                              ~{item.newNutrition.protein}g protein · {item.newNutrition.calories} kcal
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="flex gap-3 pt-2 pb-4">
            <Button variant="secondary" onClick={() => setStep('paste')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              Save menu
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="px-4 py-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Menu saved!</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Your weekly menu is ready. Go to Log to start recording meals.
          </p>
          <Button onClick={() => { setStep('paste'); setRawText(''); setReviewItems([]) }}>
            Import another
          </Button>
        </div>
      )}
    </div>
  )
}
