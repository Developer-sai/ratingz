"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { TrendingUp, Users, Star, Calendar } from "lucide-react"

interface Movie {
  id: string
  title: string
  year: number
  ratingsCount: number
  reactionsCount: number
  averageRating: number
  created_at?: string
}

interface AdminAnalyticsProps {
  movies: Movie[]
}

export function AdminAnalytics({ movies }: AdminAnalyticsProps) {
  // Handle empty state
  if (!movies || movies.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No Data Available</h3>
              <p className="text-sm text-muted-foreground">Add some movies to see analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate overall statistics
  const totalMovies = movies.length
  const moviesWithRatings = movies.filter(movie => movie.ratingsCount > 0)
  const totalRatings = movies.reduce((sum, movie) => sum + movie.ratingsCount, 0)
  const totalReactions = movies.reduce((sum, movie) => sum + movie.reactionsCount, 0)
  const overallAverageRating = moviesWithRatings.length > 0 
    ? moviesWithRatings.reduce((sum, movie) => sum + movie.averageRating, 0) / moviesWithRatings.length 
    : 0

  // Top rated movies (only movies with at least 1 rating)
  const topRatedMovies = moviesWithRatings
    .sort((a, b) => {
      // First sort by rating, then by number of ratings for tie-breaking
      if (Math.abs(b.averageRating - a.averageRating) < 0.1) {
        return b.ratingsCount - a.ratingsCount
      }
      return b.averageRating - a.averageRating
    })
    .slice(0, 5)
    .map((movie) => ({
      title: movie.title.length > 15 ? movie.title.substring(0, 15) + "..." : movie.title,
      rating: Number(movie.averageRating.toFixed(1)),
      count: movie.ratingsCount,
      fullTitle: movie.title
    }))

  // Most rated movies
  const mostRatedMovies = movies
    .filter(movie => movie.ratingsCount > 0)
    .sort((a, b) => b.ratingsCount - a.ratingsCount)
    .slice(0, 5)
    .map((movie) => ({
      title: movie.title.length > 15 ? movie.title.substring(0, 15) + "..." : movie.title,
      ratings: movie.ratingsCount,
      reactions: movie.reactionsCount,
      fullTitle: movie.title
    }))

  // Movies by decade with better handling
  const moviesByDecade = movies.reduce(
    (acc, movie) => {
      if (movie.year && movie.year > 1900) {
        const decade = Math.floor(movie.year / 10) * 10
        const decadeKey = `${decade}s`
        acc[decadeKey] = (acc[decadeKey] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const decadeData = Object.entries(moviesByDecade)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade))

  // Enhanced rating distribution
  const ratingRanges = [
    { range: "4.5-5.0", min: 4.5, max: 5.0, color: "#22c55e", label: "Excellent" },
    { range: "4.0-4.4", min: 4.0, max: 4.4, color: "#84cc16", label: "Very Good" },
    { range: "3.5-3.9", min: 3.5, max: 3.9, color: "#eab308", label: "Good" },
    { range: "3.0-3.4", min: 3.0, max: 3.4, color: "#f97316", label: "Average" },
    { range: "0-2.9", min: 0, max: 2.9, color: "#ef4444", label: "Poor" },
  ]

  const ratingDistribution = ratingRanges.map((range) => ({
    range: range.range,
    label: range.label,
    count: moviesWithRatings.filter(
      (movie) => movie.averageRating >= range.min && movie.averageRating <= range.max,
    ).length,
    color: range.color,
  })).filter(item => item.count > 0)

  // Engagement metrics
  const engagementData = movies
    .filter(movie => movie.ratingsCount > 0 || movie.reactionsCount > 0)
    .map(movie => ({
      title: movie.title.length > 10 ? movie.title.substring(0, 10) + "..." : movie.title,
      engagement: movie.ratingsCount + movie.reactionsCount,
      ratings: movie.ratingsCount,
      reactions: movie.reactionsCount,
      fullTitle: movie.title
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMovies}</div>
            <p className="text-xs text-muted-foreground">
              {moviesWithRatings.length} with ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRatings}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {totalRatings > 0 ? (totalRatings / moviesWithRatings.length).toFixed(1) : '0'} per movie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReactions}</div>
            <p className="text-xs text-muted-foreground">
              User engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Platform average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated Movies */}
        {topRatedMovies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Rated Movies</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topRatedMovies} layout="horizontal">
                  <XAxis type="number" domain={[0, 5]} fontSize={12} />
                  <YAxis dataKey="title" type="category" fontSize={12} width={120} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}/5`, "Rating"]} 
                    labelFormatter={(label) => {
                      const movie = topRatedMovies.find(m => m.title === label)
                      return movie ? movie.fullTitle : label
                    }}
                  />
                  <Bar dataKey="rating" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Most Rated Movies */}
        {mostRatedMovies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Most Rated Movies</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mostRatedMovies}>
                  <XAxis dataKey="title" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(label) => {
                      const movie = mostRatedMovies.find(m => m.title === label)
                      return movie ? movie.fullTitle : label
                    }}
                  />
                  <Bar dataKey="ratings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Movies by Decade */}
        {decadeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Movies by Decade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={decadeData}>
                  <XAxis dataKey="decade" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Rating Distribution */}
        {ratingDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={(props: any) => {
                      const { range, count, label } = props
                      return count > 0 ? `${label}: ${count}` : ""
                    }}
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.label]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engagement Chart */}
      {engagementData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movie Engagement (Ratings + Reactions)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <XAxis dataKey="title" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => {
                    const movie = engagementData.find(m => m.title === label)
                    return movie ? movie.fullTitle : label
                  }}
                />
                <Bar dataKey="ratings" stackId="a" fill="hsl(var(--chart-1))" />
                <Bar dataKey="reactions" stackId="a" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
