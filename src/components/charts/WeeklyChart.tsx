import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'
import { DAY_SHORT } from '../../types'

interface WeekDay {
  day: string // short name e.g. "Mon"
  protein: number
  goal: number
}

interface WeeklyChartProps {
  data: WeekDay[]
  proteinGoal: number
}

const PROTEIN_COLOR = '#ff375f'
const DIM_COLOR = '#3a3a3c'

export function WeeklyChart({ data, proteinGoal }: WeeklyChartProps) {
  // Pad to 7 days
  const chartData = DAY_SHORT.map((day, i) => {
    const found = data.find((d) => d.day === day)
    return { day, protein: found?.protein ?? 0, goal: proteinGoal, index: i }
  })

  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap="25%">
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8e8e93', fontSize: 11 }}
          />
          <YAxis hide domain={[0, Math.max(proteinGoal * 1.2, 10)]} />
          <ReferenceLine
            y={proteinGoal}
            stroke={PROTEIN_COLOR}
            strokeDasharray="4 3"
            strokeOpacity={0.5}
            label={{
              value: `${proteinGoal}g`,
              position: 'right',
              fill: PROTEIN_COLOR,
              fontSize: 10,
            }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              background: '#2c2c2e',
              border: '1px solid #38383a',
              borderRadius: 10,
              color: '#fff',
              fontSize: 12,
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}g`, 'Protein'] as any}
          />
          <Bar dataKey="protein" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry) => (
              <Cell
                key={entry.day}
                fill={entry.protein >= proteinGoal ? PROTEIN_COLOR : DIM_COLOR}
                fillOpacity={entry.protein > 0 ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
