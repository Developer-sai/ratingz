import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MovieRatingClient } from "@/components/movie-rating-client"

interface PageProps {
  params: Promise<{ id: string }>
}

interface DatabaseRating {
  id: string
  movie_id: string
  overall_rating: number | null
  story_rating: number | null
  screenplay_rating: number | null
  direction_rating: number | null
  performance_rating: number | null
  music_rating: number | null
  device_id: string
  user_ip: string
  created_at: string
}

interface DatabaseReaction {
  id: string
  movie_id: string
  reaction_type: string
  device_id: string
  user_ip: string
  created_at: string
}

interface DatabaseMovie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
  created_at: string
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch movie details
  const { data: movie, error: movieError } = await supabase
    .from("movies")
    .select("*")
    .eq("id", id)
    .single()

  if (movieError || !movie) {
    notFound()
  }

  // Fetch rating statistics
  const { data: ratings } = await supabase
    .from("ratings")
    .select("*")
    .eq("movie_id", id)

  // Fetch reaction statistics
  const { data: reactions } = await supabase
    .from("reactions")
    .select("*")
    .eq("movie_id", id)

  const typedMovie = movie as DatabaseMovie
  const typedRatings = (ratings || []) as DatabaseRating[]
  const typedReactions = (reactions || []) as DatabaseReaction[]

  const ratingStats = {
    totalRatings: typedRatings.length,
    averageOverall: typedRatings.length ? typedRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / typedRatings.length : 0,
    averageStory: typedRatings.filter((r) => r.story_rating !== null).length
      ? typedRatings.filter((r) => r.story_rating !== null).reduce((sum, r) => sum + (r.story_rating || 0), 0) /
        typedRatings.filter((r) => r.story_rating !== null).length
      : 0,
    averageScreenplay: typedRatings.filter((r) => r.screenplay_rating !== null).length
      ? typedRatings.filter((r) => r.screenplay_rating !== null).reduce((sum, r) => sum + (r.screenplay_rating || 0), 0) /
        typedRatings.filter((r) => r.screenplay_rating !== null).length
      : 0,
    averageDirection: typedRatings.filter((r) => r.direction_rating !== null).length
      ? typedRatings.filter((r) => r.direction_rating !== null).reduce((sum, r) => sum + (r.direction_rating || 0), 0) /
        typedRatings.filter((r) => r.direction_rating !== null).length
      : 0,
    averagePerformance: typedRatings.filter((r) => r.performance_rating !== null).length
      ? typedRatings.filter((r) => r.performance_rating !== null).reduce((sum, r) => sum + (r.performance_rating || 0), 0) /
        typedRatings.filter((r) => r.performance_rating !== null).length
      : 0,
    averageMusic: typedRatings.filter((r) => r.music_rating !== null).length
      ? typedRatings.filter((r) => r.music_rating !== null).reduce((sum, r) => sum + (r.music_rating || 0), 0) /
        typedRatings.filter((r) => r.music_rating !== null).length
      : 0,
    thumbsUp: typedReactions.filter((r) => r.reaction_type === "thumbs_up").length,
    thumbsDown: typedReactions.filter((r) => r.reaction_type === "thumbs_down").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <MovieRatingClient movie={typedMovie} initialStats={ratingStats} />
    </div>
  )
}
