"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, BarChart3, Film, Users, ThumbsUp, TrendingUp } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import { AdminAnalytics } from "@/components/admin-analytics"

interface DatabaseMovie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
  created_at: string
}

interface DatabaseRating {
  id: string
  movie_id: string
  overall_rating: number
  created_at: string
}

interface DatabaseReaction {
  id: string
  movie_id: string
  created_at: string
}

interface Movie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
  ratingsCount: number
  reactionsCount: number
  averageRating: number
  created_at: string
}

interface Stats {
  totalMovies: number
  totalRatings: number
  totalReactions: number
  averageRating: number
}

interface AdminDashboardProps {
  movies: Movie[]
  stats: Stats
}

export function AdminDashboard({ movies: initialMovies, stats }: AdminDashboardProps) {
  const [movies, setMovies] = useState(initialMovies)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const supabase = createClient()

  const refreshMovies = async () => {
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false })
    if (data) {
      const typedMovies = data as DatabaseMovie[]
      const moviesWithStats = await Promise.all(
        typedMovies.map(async (movie) => {
          const { data: ratings } = await supabase.from("ratings").select("*").eq("movie_id", movie.id)
          const { data: reactions } = await supabase.from("reactions").select("*").eq("movie_id", movie.id)
          const typedRatings = ratings as DatabaseRating[] | null
          const typedReactions = reactions as DatabaseReaction[] | null

          return {
            ...movie,
            ratingsCount: typedRatings?.length || 0,
            reactionsCount: typedReactions?.length || 0,
            averageRating: typedRatings?.length
              ? typedRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / typedRatings.length
              : 0,
          }
        }),
      )
      setMovies(moviesWithStats)
    }
  }

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm("Are you sure you want to delete this movie? This will also delete all ratings and reactions.")) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("movies").delete().eq("id", movieId)
      if (error) throw error
      await refreshMovies()
    } catch (error) {
      console.error("Error deleting movie:", error)
      alert("Failed to delete movie")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage movies and view platform statistics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Movie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Movie</DialogTitle>
              </DialogHeader>
              <MovieForm
                onSuccess={() => {
                  setIsAddDialogOpen(false)
                  refreshMovies()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRatings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard Section */}
      {showAnalytics && <AdminAnalytics movies={movies} />}

      {/* Movies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movies Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movie</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>IMDB ID</TableHead>
                  <TableHead>Ratings</TableHead>
                  <TableHead>Avg Rating</TableHead>
                  <TableHead>Reactions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.poster_url || "/placeholder.svg?height=60&width=40"}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{movie.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{movie.year}</TableCell>
                    <TableCell>
                      {movie.imdb_id ? (
                        <Badge variant="outline">{movie.imdb_id}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No IMDB ID</span>
                      )}
                    </TableCell>
                    <TableCell>{movie.ratingsCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StarRating value={movie.averageRating} readonly size="sm" />
                        <span className="text-sm">{movie.averageRating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{movie.reactionsCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingMovie(movie)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMovie(movie.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Movie Dialog */}
      <Dialog open={!!editingMovie} onOpenChange={() => setEditingMovie(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Movie</DialogTitle>
          </DialogHeader>
          {editingMovie && (
            <MovieForm
              movie={editingMovie}
              onSuccess={() => {
                setEditingMovie(null)
                refreshMovies()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface MovieFormProps {
  movie?: Movie
  onSuccess: () => void
}

function MovieForm({ movie, onSuccess }: MovieFormProps) {
  const [formData, setFormData] = useState({
    title: movie?.title || "",
    year: movie?.year || new Date().getFullYear(),
    poster_url: movie?.poster_url || "",
    imdb_id: movie?.imdb_id || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(movie?.poster_url || "")

  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        setFormData({ ...formData, poster_url: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Submitting form data:", formData)

      if (movie) {
        const { error } = await supabase.from("movies").update(formData).eq("id", movie.id)
        if (error) {
          console.log("[v0] Update error:", error)
          throw error
        }
      } else {
        const movieData = {
          title: formData.title.trim(),
          year: formData.year,
          poster_url: formData.poster_url.trim() || null,
          imdb_id: formData.imdb_id.trim() || null,
        }

        console.log("[v0] Inserting movie data:", movieData)
        const { data, error } = await supabase.from("movies").insert(movieData).select()

        if (error) {
          console.log("[v0] Insert error:", error)
          throw error
        }

        console.log("[v0] Successfully inserted movie:", data)
      }

      onSuccess()
    } catch (error: any) {
      console.error("[v0] Error saving movie:", error)
      setError(error.message || "Failed to save movie. Please check all fields and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Enter movie title"
        />
      </div>

      <div>
        <Label htmlFor="year">Year *</Label>
        <Input
          id="year"
          type="number"
          min="1900"
          max={new Date().getFullYear() + 5}
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
          required
          placeholder="2024"
        />
      </div>

      <div>
        <Label htmlFor="poster_file">Movie Poster</Label>
        <Input
          id="poster_file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2"
        />
        {previewUrl && (
          <div className="mt-2">
            <img
              src={previewUrl}
              alt="Poster preview"
              className="w-20 h-28 object-cover rounded border"
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="imdb_id">IMDB ID</Label>
        <Input
          id="imdb_id"
          value={formData.imdb_id}
          onChange={(e) => setFormData({ ...formData, imdb_id: e.target.value })}
          placeholder="tt0111161 (optional)"
          pattern="tt\d{7,8}"
          title="IMDB ID should start with 'tt' followed by 7-8 digits"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : movie ? "Update Movie" : "Add Movie"}
        </Button>
      </div>
    </form>
  )
}
