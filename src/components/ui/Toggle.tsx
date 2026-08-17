interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 cursor-pointer select-none"
    >
      <span
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-11 h-6 rounded-full transition-colors duration-300',
          checked ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-surface-3)]',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow',
            'transition-transform duration-300',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
      {label && <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>}
    </label>
  )
}
