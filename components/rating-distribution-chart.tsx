"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface RatingDistributionChartProps {
  data: number[]
}

export function RatingDistributionChart({ data }: RatingDistributionChartProps) {
  const chartData = data.map((count, index) => ({
    rating: `${index + 1} Star${index === 0 ? "" : "s"}`,
    count,
    percentage:
      data.reduce((sum, c) => sum + c, 0) > 0 ? ((count / data.reduce((sum, c) => sum + c, 0)) * 100).toFixed(1) : 0,
  }))

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis dataKey="rating" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip formatter={(value, name) => [value, "Ratings"]} labelFormatter={(label) => `${label}`} />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-5 gap-2 text-sm">
        {chartData.map((item, index) => (
          <div key={index} className="text-center">
            <div className="font-medium">{item.count}</div>
            <div className="text-muted-foreground text-xs">{item.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
