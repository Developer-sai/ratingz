"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"

interface Movie {
  id: string
  title: string
  year: number
  ratingsCount: number
  reactionsCount: number
  averageRating: number
}

interface AdminAnalyticsProps {
  movies: Movie[]
}

export function AdminAnalytics({ movies }: AdminAnalyticsProps) {
  // Top rated movies (only movies with at least 3 ratings for statistical significance)
  const topRatedMovies = movies
    .filter((movie) => movie.ratingsCount >= 3)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5)
    .map((movie) => ({
      title: movie.title.length > 20 ? movie.title.substring(0, 20) + "..." : movie.title,
      rating: Number(movie.averageRating.toFixed(2)),
      count: movie.ratingsCount,
    }))

  // Most rated movies
  const mostRatedMovies = movies
    .sort((a, b) => b.ratingsCount - a.ratingsCount)
    .slice(0, 5)
    .map((movie) => ({
      title: movie.title.length > 20 ? movie.title.substring(0, 20) + "..." : movie.title,
      ratings: movie.ratingsCount,
      reactions: movie.reactionsCount,
    }))

  // Movies by decade
  const moviesByDecade = movies.reduce(
    (acc, movie) => {
      const decade = Math.floor(movie.year / 10) * 10
      const decadeKey = `${decade}s`
      acc[decadeKey] = (acc[decadeKey] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const decadeData = Object.entries(moviesByDecade)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade))

  // Rating distribution across all movies (only movies with ratings)
  const ratingRanges = [
    { range: "4.5-5.0", min: 4.5, max: 5.0, color: "#22c55e" },
    { range: "4.0-4.4", min: 4.0, max: 4.4, color: "#84cc16" },
    { range: "3.5-3.9", min: 3.5, max: 3.9, color: "#eab308" },
    { range: "3.0-3.4", min: 3.0, max: 3.4, color: "#f97316" },
    { range: "0-2.9", min: 0, max: 2.9, color: "#ef4444" },
  ]

  const moviesWithRatings = movies.filter(movie => movie.ratingsCount > 0)
  const ratingDistribution = ratingRanges.map((range) => ({
    range: range.range,
    count: moviesWithRatings.filter(
      (movie) => movie.averageRating >= range.min && movie.averageRating <= range.max,
    ).length,
    color: range.color,
  })).filter(item => item.count > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Rated Movies</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topRatedMovies} layout="horizontal">
              <XAxis type="number" domain={[0, 5]} fontSize={12} />
              <YAxis dataKey="title" type="category" fontSize={12} width={100} />
              <Tooltip formatter={(value, name) => [`${value}/5`, "Rating"]} labelFormatter={(label) => `${label}`} />
              <Bar dataKey="rating" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Rated Movies</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mostRatedMovies}>
              <XAxis dataKey="title" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="ratings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movies by Decade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={decadeData}>
              <XAxis dataKey="decade" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={(props: any) => {
                  const { range, count } = props
                  return count > 0 ? `${range}: ${count}` : ""
                }}
              >
                {ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
