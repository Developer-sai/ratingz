"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, BarChart3, Film, Users, ThumbsUp, TrendingUp, QrCode, Download } from "lucide-react"
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
  movie_id?: number
  qr_code_url?: string
  ratingsCount: number
  reactionsCount: number
  averageRating: number
  created_at: string
}

interface Stats {
  totalMovies: number
  totalRatings: number
  totalReactions: number
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

  useEffect(() => {
    refreshMovies()
  }, [])

  const refreshMovies = async () => {
    try {
      const { data: moviesData, error: moviesError } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false })

      if (moviesError) throw moviesError

      const moviesWithStats = await Promise.all(
         moviesData.map(async (movie: DatabaseMovie) => {
           const [ratingsResult, reactionsResult] = await Promise.all([
             supabase
               .from("ratings")
               .select("overall_rating")
               .eq("movie_id", movie.id),
             supabase
               .from("reactions")
               .select("id")
               .eq("movie_id", movie.id)
           ])

           const ratings = ratingsResult.data || []
           const reactions = reactionsResult.data || []
           const averageRating = ratings.length > 0 
             ? ratings.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / ratings.length 
             : 0

          return {
            ...movie,
            ratingsCount: ratings.length,
            reactionsCount: reactions.length,
            averageRating
          }
        })
      )

      setMovies(moviesWithStats)
    } catch (error) {
      console.error("Error refreshing movies:", error)
    }
  }

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm("Are you sure you want to delete this movie?")) {
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase.from("movies").delete().eq("id", movieId)
      if (error) throw error
      await refreshMovies()
    } catch (error) {
      console.error("Error deleting movie:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCode = async (movieId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId })
      })

      if (!response.ok) throw new Error("Failed to generate QR code")

      const { qrCodeUrl } = await response.json()
      
      const { error } = await supabase
        .from("movies")
        .update({ qr_code_url: qrCodeUrl })
        .eq("id", movieId)

      if (error) throw error
      await refreshMovies()
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQRCode = async (movieId: string) => {
    try {
      const movie = movies.find(m => m.id === movieId)
      if (!movie?.qr_code_url) {
        alert("QR code not generated yet")
        return
      }

      const response = await fetch(movie.qr_code_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${movie.title}-qr-code.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading QR code:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-2">Manage movies and view platform statistics</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-white/50 hover:bg-white/80 border-blue-200 text-blue-700 shadow-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Movie
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-800">Add New Movie</DialogTitle>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Movies</CardTitle>
              <Film className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMovies}</div>
              <p className="text-blue-100 text-sm mt-1">Movies in database</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Total Ratings</CardTitle>
              <BarChart3 className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRatings}</div>
              <p className="text-green-100 text-sm mt-1">User ratings received</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Total Reactions</CardTitle>
              <ThumbsUp className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalReactions}</div>
              <p className="text-purple-100 text-sm mt-1">Thumbs up/down reactions</p>
            </CardContent>
          </Card>
        </div>

        {showAnalytics && <AdminAnalytics movies={movies} />}

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Film className="h-6 w-6 text-blue-600" />
              Movies Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/80">
                    <TableHead className="font-semibold text-slate-700">Movie</TableHead>
                    <TableHead className="font-semibold text-slate-700">Year</TableHead>
                    <TableHead className="font-semibold text-slate-700">IMDB ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ratings</TableHead>
                    <TableHead className="font-semibold text-slate-700">Avg Rating</TableHead>
                    <TableHead className="font-semibold text-slate-700">Reactions</TableHead>
                    <TableHead className="font-semibold text-slate-700">QR Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <Film className="h-16 w-16 text-slate-300" />
                          <div className="text-slate-500 text-lg font-medium">No movies found</div>
                          <div className="text-slate-400 text-sm">Add your first movie to get started</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movies.map((movie) => (
                      <TableRow key={movie.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={movie.poster_url || "/placeholder.svg?height=60&width=40"}
                              alt={movie.title}
                              className="w-10 h-14 object-cover rounded-md shadow-sm"
                            />
                            <div>
                              <div className="font-medium text-slate-800">{movie.title}</div>
                              <div className="text-sm text-slate-500">ID: {movie.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700 font-medium">{movie.year}</TableCell>
                        <TableCell>
                          {movie.imdb_id ? (
                            <Badge variant="outline" className="font-mono text-sm">{movie.imdb_id}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No IMDB ID</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
                            {movie.ratingsCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StarRating value={movie.averageRating} readonly size="sm" />
                            <span className="text-sm font-semibold text-slate-700">{movie.averageRating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                            {movie.reactionsCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateQRCode(movie.id)}
                              disabled={isLoading}
                              className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 text-purple-700 hover:text-purple-800"
                            >
                              <QrCode className="w-4 h-4 mr-1" />
                              Generate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQRCode(movie.id)}
                              disabled={isLoading}
                              className="bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-indigo-200 text-indigo-700 hover:text-indigo-800"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingMovie(movie)}
                              className="bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-emerald-200 text-emerald-700 hover:text-emerald-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMovie(movie.id)}
                              disabled={isLoading}
                              className="bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 text-red-700 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingMovie} onOpenChange={() => setEditingMovie(null)}>
          <DialogContent className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-2xl">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Edit className="h-6 w-6 text-blue-600" />
                Edit Movie
              </DialogTitle>
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
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setFormData({ ...formData, poster_url: "" })
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
        <Label htmlFor="poster_url">Or Poster URL</Label>
        <Input
          id="poster_url"
          value={formData.poster_url}
          onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
          placeholder="https://example.com/poster.jpg"
        />
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="w-20 h-28 object-cover rounded-md" />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="imdb_id">IMDB ID</Label>
        <Input
          id="imdb_id"
          value={formData.imdb_id}
          onChange={(e) => setFormData({ ...formData, imdb_id: e.target.value })}
          placeholder="tt1234567"
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
