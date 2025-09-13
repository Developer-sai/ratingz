import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MovieRatingClient } from "@/components/movie-rating-client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch movie details
  const { data: movie, error: movieError } = await supabase.from("movies").select("*").eq("id", id).single()

  if (movieError || !movie) {
    notFound()
  }

  // Fetch rating statistics
  const { data: ratings } = await supabase.from("ratings").select("*").eq("movie_id", id)

  // Fetch reaction statistics
  const { data: reactions } = await supabase.from("reactions").select("*").eq("movie_id", id)

  const ratingStats = {
    totalRatings: ratings?.length || 0,
    averageOverall: ratings?.length ? ratings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / ratings.length : 0,
    averageStory: ratings?.filter((r) => r.story_rating).length
      ? ratings.filter((r) => r.story_rating).reduce((sum, r) => sum + r.story_rating, 0) /
        ratings.filter((r) => r.story_rating).length
      : 0,
    averageScreenplay: ratings?.filter((r) => r.screenplay_rating).length
      ? ratings.filter((r) => r.screenplay_rating).reduce((sum, r) => sum + r.screenplay_rating, 0) /
        ratings.filter((r) => r.screenplay_rating).length
      : 0,
    averageDirection: ratings?.filter((r) => r.direction_rating).length
      ? ratings.filter((r) => r.direction_rating).reduce((sum, r) => sum + r.direction_rating, 0) /
        ratings.filter((r) => r.direction_rating).length
      : 0,
    averagePerformance: ratings?.filter((r) => r.performance_rating).length
      ? ratings.filter((r) => r.performance_rating).reduce((sum, r) => sum + r.performance_rating, 0) /
        ratings.filter((r) => r.performance_rating).length
      : 0,
    averageMusic: ratings?.filter((r) => r.music_rating).length
      ? ratings.filter((r) => r.music_rating).reduce((sum, r) => sum + r.music_rating, 0) /
        ratings.filter((r) => r.music_rating).length
      : 0,
    thumbsUp: reactions?.filter((r) => r.reaction_type === "thumbs_up").length || 0,
    thumbsDown: reactions?.filter((r) => r.reaction_type === "thumbs_down").length || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <MovieRatingClient movie={movie} initialStats={ratingStats} />
    </div>
  )
}
