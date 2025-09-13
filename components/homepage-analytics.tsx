"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Star, Users } from "lucide-react"

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
  const totalMovies = movies.length
  const totalRatings = movies.reduce((sum, movie) => sum + movie.totalRatings, 0)
  const averageRating = totalRatings > 0 
    ? movies.reduce((sum, movie) => sum + (movie.averageRating * movie.totalRatings), 0) / totalRatings
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMovies}</div>
          <p className="text-xs text-muted-foreground">
            Movies available for rating
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRatings}</div>
          <p className="text-xs text-muted-foreground">
            Community ratings submitted
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Overall community rating
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
