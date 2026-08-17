import type { FoodItem } from '../../types'

interface FoodFormProps {
  item: Partial<FoodItem>
  onChange: (updated: Partial<FoodItem>) => void
  onSave: () => void
  onCancel: () => void
}

export function FoodForm({ item, onChange, onSave, onCancel }: FoodFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-[var(--color-text-secondary)]">Name *</label>
        <input
          value={item.name ?? ''}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none mt-0.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(['caloriesPer', 'proteinPer', 'carbsPer', 'fatPer'] as const).map((key) => (
          <div key={key}>
            <label className="text-xs text-[var(--color-text-secondary)] capitalize">
              {key.replace('Per', '').replace('calories', 'Calories').replace('protein', 'Protein')}
            </label>
            <input
              type="number"
              value={(item[key] as number | undefined) ?? 0}
              onChange={(e) => onChange({ ...item, [key]: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none mt-0.5"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-[var(--color-text-secondary)]">Serving unit</label>
        <input
          value={item.servingUnit ?? ''}
          onChange={(e) => onChange({ ...item, servingUnit: e.target.value })}
          className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none mt-0.5"
        />
      </div>
      <div>
        <label className="text-xs text-[var(--color-text-secondary)]">
          Aliases (comma-separated)
        </label>
        <input
          value={(item.aliases ?? []).join(', ')}
          onChange={(e) =>
            onChange({
              ...item,
              aliases: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="e.g. yellow dal, toor dal"
          className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none mt-0.5"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-surface-3)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--color-protein)] text-white rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  )
}
