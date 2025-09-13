import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { HomePageClient } from "@/components/homepage-client"

interface DatabaseMovie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
  created_at: string
}

interface DatabaseRating {
  overall_rating: number | null
}

interface DatabaseReaction {
  reaction_type: string
}

interface MovieWithStats extends DatabaseMovie {
  averageRating: number
  totalRatings: number
  thumbsUp: number
  thumbsDown: number
}

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch all movies with their rating statistics on the server
  const { data: moviesData } = await supabase
    .from("movies")
    .select("*")
    .order("title")

  const typedMovies = (moviesData || []) as DatabaseMovie[]

  // Fetch ratings for each movie to calculate averages
  const moviesWithStats: MovieWithStats[] = await Promise.all(
    typedMovies.map(async (movie) => {
      const { data: ratings } = await supabase
        .from("ratings")
        .select("overall_rating")
        .eq("movie_id", movie.id)

      const { data: reactions } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("movie_id", movie.id)

      const typedRatings = (ratings || []) as DatabaseRating[]
      const typedReactions = (reactions || []) as DatabaseReaction[]

      const averageRating = typedRatings.length
        ? typedRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / typedRatings.length
        : 0

      const totalRatings = typedRatings.length
      const thumbsUp = typedReactions.filter((r) => r.reaction_type === "thumbs_up").length
      const thumbsDown = typedReactions.filter((r) => r.reaction_type === "thumbs_down").length

      return {
        ...movie,
        averageRating,
        totalRatings,
        thumbsUp,
        thumbsDown,
      }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-4">
            Rate Movies.
            <br />
            <span className="text-primary">Share Opinions.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover and rate your favorite movies. No login required - just honest ratings from real movie lovers.
          </p>
        </div>
        
        <HomePageClient initialMovies={moviesWithStats} />
      </main>
    </div>
  )
}
