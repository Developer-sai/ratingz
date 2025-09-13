"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/star-rating"
import { TrendingUp, Award, Clock } from "lucide-react"

interface Movie {
  id: string
  title: string
  year: number
  poster_url: string
  averageRating: number
  totalRatings: number
  thumbsUp: number
  thumbsDown: number
}

interface HomepageAnalyticsProps {
  movies: Movie[]
}

export function HomepageAnalytics({ movies }: HomepageAnalyticsProps) {
  // Top rated movies with at least 3 ratings
  const topRated = movies
    .filter((movie) => movie.totalRatings >= 3)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3)

  // Most popular (most ratings)
  const mostPopular = movies.sort((a, b) => b.totalRatings - a.totalRatings).slice(0, 3)

  // Recent additions (newest movies by year)
  const recentMovies = movies.sort((a, b) => b.year - a.year).slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Rated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topRated.map((movie, index) => (
            <div key={movie.id} className="flex items-center gap-3">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                {index + 1}
              </Badge>
              <img
                src={movie.poster_url || "/placeholder.svg?height=40&width=30"}
                alt={movie.title}
                className="w-8 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{movie.title}</p>
                <div className="flex items-center gap-1">
                  <StarRating value={movie.averageRating} readonly size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {movie.averageRating.toFixed(1)} ({movie.totalRatings})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Most Popular
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mostPopular.map((movie, index) => (
            <div key={movie.id} className="flex items-center gap-3">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                {index + 1}
              </Badge>
              <img
                src={movie.poster_url || "/placeholder.svg?height=40&width=30"}
                alt={movie.title}
                className="w-8 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{movie.title}</p>
                <p className="text-xs text-muted-foreground">{movie.totalRatings} ratings</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-green-500" />
            Recent Movies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentMovies.map((movie, index) => (
            <div key={movie.id} className="flex items-center gap-3">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                {index + 1}
              </Badge>
              <img
                src={movie.poster_url || "/placeholder.svg?height=40&width=30"}
                alt={movie.title}
                className="w-8 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{movie.title}</p>
                <p className="text-xs text-muted-foreground">{movie.year}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
