"use client"

import { createClient } from "@/lib/supabase/client"
import { MovieGrid } from "@/components/movie-grid"
import { SearchBar } from "@/components/search-bar"
import { Header } from "@/components/header"
import { HomepageAnalytics } from "@/components/homepage-analytics"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [movies, setMovies] = useState([])
  const [filteredMovies, setFilteredMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Fetch all movies with their rating statistics
  const fetchMovies = async () => {
    try {
      const { data: moviesData } = await supabase.from("movies").select("*").order("title")

      // Fetch ratings for each movie to calculate averages
      const moviesWithStats = await Promise.all(
        (moviesData || []).map(async (movie) => {
          const { data: ratings } = await supabase.from("ratings").select("overall_rating").eq("movie_id", movie.id)

          const { data: reactions } = await supabase.from("reactions").select("reaction_type").eq("movie_id", movie.id)

          const averageRating = ratings?.length
            ? ratings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / ratings.length
            : 0

          const totalRatings = ratings?.length || 0
          const thumbsUp = reactions?.filter((r) => r.reaction_type === "thumbs_up").length || 0
          const thumbsDown = reactions?.filter((r) => r.reaction_type === "thumbs_down").length || 0

          return {
            ...movie,
            averageRating,
            totalRatings,
            thumbsUp,
            thumbsDown,
          }
        }),
      )

      setMovies(moviesWithStats)
      setFilteredMovies(moviesWithStats)
    } catch (error) {
      console.error("Error fetching movies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter movies based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredMovies(movies)
    } else {
      const filtered = movies.filter((movie) =>
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.year.toString().includes(query) ||
        movie.imdb_id.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredMovies(filtered)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Loading movies...</p>
          </div>
        </main>
      </div>
    )
  }

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

        <HomepageAnalytics movies={movies} />

        <SearchBar onSearch={handleSearch} searchQuery={searchQuery} />

        <MovieGrid movies={filteredMovies} />
        
        {searchQuery && filteredMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No movies found for "{searchQuery}". Try a different search term.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
