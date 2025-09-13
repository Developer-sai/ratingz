"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/star-rating"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface Movie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
  averageRating: number
  totalRatings: number
  thumbsUp: number
  thumbsDown: number
}

interface MovieGridProps {
  movies: Movie[]
}

export function MovieGrid({ movies }: MovieGridProps) {
  if (!movies.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No movies found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movie/${movie.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
        <CardContent className="p-0">
          <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
            <img
              src={movie.poster_url || "/placeholder.svg?height=400&width=300&query=movie poster"}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
            />

            {/* Rating overlay */}
            {movie.totalRatings > 0 && (
              <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded-md text-sm font-medium">
                {movie.averageRating.toFixed(1)}
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg leading-tight text-balance group-hover:text-primary transition-colors">
                {movie.title}
              </h3>
              <p className="text-muted-foreground text-sm">{movie.year}</p>
            </div>

            {movie.totalRatings > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StarRating value={movie.averageRating} readonly size="sm" />
                  <span className="text-sm text-muted-foreground">({movie.totalRatings})</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{movie.thumbsUp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="w-3 h-3" />
                    <span>{movie.thumbsDown}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No ratings yet - be the first!</div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
