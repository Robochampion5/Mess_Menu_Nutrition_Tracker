export function PRBadge() {
  return (
    <span
      className="pr-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
      style={{
        background: 'rgba(255, 55, 95, 0.15)',
        color: 'var(--color-protein)',
        border: '1px solid rgba(255, 55, 95, 0.3)',
        boxShadow: 'var(--shadow-glow-protein)',
      }}
      aria-label="New personal record"
    >
      🏆 PR
    </span>
  )
}
