"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface CategoryRatingsChartProps {
  data: Array<{
    category: string
    average: number
    count: number
  }>
}

export function CategoryRatingsChart({ data }: CategoryRatingsChartProps) {
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="horizontal">
          <XAxis type="number" domain={[0, 5]} fontSize={12} />
          <YAxis dataKey="category" type="category" fontSize={12} width={80} />
          <Tooltip
            formatter={(value, name) => [`${value}/5`, "Average Rating"]}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="average" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="space-y-1 text-sm">
        {data.map((item) => (
          <div key={item.category} className="flex justify-between">
            <span>{item.category}</span>
            <span className="text-muted-foreground">
              {item.average > 0 ? `${item.average}/5 (${item.count} ratings)` : "No ratings"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
