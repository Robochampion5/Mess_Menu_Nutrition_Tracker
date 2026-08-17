import { useEffect, useRef } from 'react'

interface RingData {
  value: number
  goal: number
  color: string
  label: string
}

interface ActivityRingsProps {
  protein: RingData
  calories: RingData
  carbs: RingData
  size?: number
}

function Ring({
  value,
  goal,
  color,
  radius,
  strokeWidth,
  animate,
}: {
  value: number
  goal: number
  color: string
  radius: number
  strokeWidth: number
  animate: boolean
}) {
  const circumference = 2 * Math.PI * radius
  const pct = goal > 0 ? Math.min(1, value / goal) : 0
  const targetOffset = circumference * (1 - pct)
  const pathRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!animate || !pathRef.current) return
    const el = pathRef.current
    el.style.strokeDasharray = String(circumference)
    el.style.strokeDashoffset = String(circumference)
    // Force reflow then animate
    el.getBoundingClientRect()
    el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)'
    el.style.strokeDashoffset = String(targetOffset)
  }, [circumference, targetOffset, animate])

  return (
    <>
      {/* Background track */}
      <circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={0.15}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <circle
        ref={pathRef}
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: animate ? circumference : targetOffset,
          transformOrigin: 'center',
          transform: 'rotate(-90deg)',
          filter: `drop-shadow(0 0 6px ${color}60)`,
        }}
      />
    </>
  )
}

export function ActivityRings({ protein, calories, carbs, size = 220 }: ActivityRingsProps) {
  const center = size / 2
  const gap = 12 // gap between rings

  // Protein = innermost but visually PRIMARY (thickest)
  const proteinStroke = 18
  const caloriesStroke = 13
  const carbsStroke = 10

  const carbsRadius = center - carbsStroke / 2 - 4
  const caloriesRadius = carbsRadius - carbsStroke / 2 - gap - caloriesStroke / 2
  const proteinRadius = caloriesRadius - caloriesStroke / 2 - gap - proteinStroke / 2

  const proteinPct = protein.goal > 0 ? Math.min(1, protein.value / protein.goal) : 0
  const calPct = calories.goal > 0 ? Math.min(1, calories.value / calories.goal) : 0

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Carbs — outermost */}
        <Ring
          value={carbs.value}
          goal={carbs.goal}
          color={carbs.color}
          radius={carbsRadius}
          strokeWidth={carbsStroke}
          animate
        />
        {/* Calories — middle */}
        <Ring
          value={calories.value}
          goal={calories.goal}
          color={calories.color}
          radius={caloriesRadius}
          strokeWidth={caloriesStroke}
          animate
        />
        {/* Protein — innermost but visually primary (thickest) */}
        <Ring
          value={protein.value}
          goal={protein.goal}
          color={protein.color}
          radius={proteinRadius}
          strokeWidth={proteinStroke}
          animate
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span
          className="text-4xl font-bold tabular-nums"
          style={{ color: protein.color }}
        >
          {Math.round(protein.value)}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          / {Math.round(protein.goal)}g
        </span>
        <span className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">protein</span>

        {/* Small sub-indicators */}
        <div className="flex items-center gap-2 mt-3">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: calories.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: calories.color }} />
            {Math.round(calPct * 100)}%
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: carbs.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: carbs.color }} />
            {Math.round(carbs.value)}g
          </span>
        </div>

        {/* Protein % label */}
        <div
          className="mt-1 text-[10px] font-semibold"
          style={{ color: protein.color }}
        >
          {Math.round(proteinPct * 100)}%
        </div>
      </div>

      {/* Ring labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-4 text-[10px]">
        {[
          { label: protein.label, color: protein.color },
          { label: calories.label, color: calories.color },
          { label: carbs.label, color: carbs.color },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1" style={{ color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
