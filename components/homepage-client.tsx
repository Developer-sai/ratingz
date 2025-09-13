"use client"

import { MovieGrid } from "@/components/movie-grid"
import { SearchBar } from "@/components/search-bar"
import { HomepageAnalytics } from "@/components/homepage-analytics"
import { useState } from "react"

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

interface HomePageClientProps {
  initialMovies: Movie[]
}

export function HomePageClient({ initialMovies }: HomePageClientProps) {
  const [filteredMovies, setFilteredMovies] = useState(initialMovies)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter movies based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredMovies(initialMovies)
    } else {
      const filtered = initialMovies.filter((movie) =>
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.year.toString().includes(query) ||
        movie.imdb_id.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredMovies(filtered)
    }
  }

  return (
    <>
      <HomepageAnalytics movies={initialMovies} />
      
      <SearchBar onSearch={handleSearch} searchQuery={searchQuery} />
      
      <MovieGrid movies={filteredMovies} />
      
      {searchQuery && filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No movies found for "{searchQuery}". Try a different search term.
          </p>
        </div>
      )}
    </>
  )
}