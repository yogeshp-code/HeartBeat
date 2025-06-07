// MetricsChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface MetricsChartProps {
  data: number[]
  label: string // "CPU" or "Memory"
  color?: string
}

export default function MetricsChart({ data, label, color = "#3b82f6" }: MetricsChartProps) {
  const chartData = data.map((value, index) => ({
    time: `${(6 - index * 0.5).toFixed(1)}h ago`,
    value,
  }))

  const maxValue = Math.max(...data)
  const yMax = maxValue < 20 ? 20 : Math.ceil(maxValue / 10) * 10 + 10

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, yMax]} tickFormatter={(val) => `${val}%`} />
        <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
        <Line type="monotone" dataKey="value" stroke={color} dot={false} name={label} />
      </LineChart>
    </ResponsiveContainer>
  )
}
