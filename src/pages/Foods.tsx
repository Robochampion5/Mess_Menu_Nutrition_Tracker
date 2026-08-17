import { useState, useMemo } from 'react'
import { Search, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FoodForm } from '../components/ui/FoodForm'
import { showToast } from '../components/ui/Toast'
import { useAppStore } from '../store/useAppStore'
import { deleteFoodItem } from '../db/foodItems'
import type { FoodItem, FoodCategory, CuisineTag } from '../types'

function generateId(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') +
    '-' +
    Date.now()
  )
}

const emptyFood = (): Omit<FoodItem, 'id'> => ({
  name: '',
  aliases: [],
  category: 'other' as FoodCategory,
  cuisineTag: 'other' as CuisineTag,
  coreIngredients: [],
  caloriesPer: 0,
  proteinPer: 0,
  carbsPer: 0,
  fatPer: 0,
  servingUnit: '1 bowl',
  servingGrams: 150,
  isCustom: true,
})

export function Foods() {
  const { foodItems, upsertFoodItem } = useAppStore()
  const [query, setQuery] = useState('')
  const [editItem, setEditItem] = useState<FoodItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newFood, setNewFood] = useState(emptyFood())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query) return foodItems
    const q = query.toLowerCase()
    return foodItems.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.aliases.some((a) => a.toLowerCase().includes(q)) ||
        f.category.toLowerCase().includes(q),
    )
  }, [foodItems, query])

  async function handleSaveNew() {
    if (!newFood.name.trim()) return
    const food: FoodItem = { ...newFood, id: generateId(newFood.name), isCustom: true }
    await upsertFoodItem(food)
    showToast(`${food.name} added!`, 'success')
    setShowAdd(false)
    setNewFood(emptyFood())
  }

  async function handleSaveEdit() {
    if (!editItem || !editItem.name.trim()) return
    await upsertFoodItem(editItem)
    showToast(`${editItem.name} updated!`, 'success')
    setEditItem(null)
  }

  async function handleDelete(item: FoodItem) {
    if (!confirm(`Delete "${item.name}"?`)) return
    await deleteFoodItem(item.id)
    // Re-seed store via upsertFoodItem is not ideal; trigger hydration instead
    showToast(`${item.name} deleted`, 'info')
    // Force a reload (simple approach for delete)
    window.location.reload()
  }

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Foods</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {foodItems.length} items
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods, aliases, categories…"
            className="w-full bg-[var(--color-surface)] rounded-[var(--radius-lg)] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--color-text-tertiary)] outline-none"
          />
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="px-4 mb-4">
          <Card>
            <p className="text-sm font-semibold text-white mb-3">New food item</p>
            <FoodForm
              item={newFood}
              onChange={(u) => setNewFood(u as Omit<FoodItem, 'id'>)}
              onSave={handleSaveNew}
              onCancel={() => setShowAdd(false)}
            />
          </Card>
        </div>
      )}

      {/* Food list */}
      <div className="px-4 space-y-2">
        {filtered.map((item) => (
          <Card key={item.id} padding="sm">
            {editItem?.id === item.id ? (
              <FoodForm
                item={editItem}
                onChange={(u) => setEditItem(u as FoodItem)}
                onSave={handleSaveEdit}
                onCancel={() => setEditItem(null)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{item.name}</span>
                      {item.isCustom && (
                        <Badge variant="neutral" size="sm">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      <span style={{ color: '#ff375f' }}>{item.proteinPer}g P</span>
                      {' · '}
                      <span style={{ color: '#30d158' }}>{item.caloriesPer} kcal</span>
                      {' · '}
                      {item.servingUnit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      {expandedId === item.id ? (
                        <ChevronUp size={14} className="text-[var(--color-text-secondary)]" />
                      ) : (
                        <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditItem(item)}
                      className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <Edit2 size={14} className="text-[var(--color-text-secondary)]" />
                    </button>
                    {item.isCustom && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-full hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: aliases */}
                {expandedId === item.id && item.aliases.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1.5">Aliases</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.aliases.map((alias) => (
                        <Badge key={alias} variant="neutral" size="sm">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">No foods found</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Try a different search or add a new item
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
