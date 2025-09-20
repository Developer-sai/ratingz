"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock } from "lucide-react"

interface DatabaseMovie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
  created_at: string
}

interface MovieWithStats extends DatabaseMovie {
  ratingsCount: number
  reactionsCount: number
  averageRating: number
}

interface DatabaseRating {
  id: string
  movie_id: string
  user_id: string
  overall_rating: number | null
  story_rating: number | null
  screenplay_rating: number | null
  direction_rating: number | null
  performance_rating: number | null
  music_rating: number | null
  created_at: string
}

interface DatabaseReaction {
  id: string
  movie_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

interface AdminStats {
  totalMovies: number
  totalRatings: number
  totalReactions: number
  averageRating: number
}

const ADMIN_CREDENTIALS = {
  username: "sai",
  password: "Sai@123987",
}

export function AdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [movies, setMovies] = useState<MovieWithStats[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalMovies: 0,
    totalRatings: 0,
    totalReactions: 0,
    averageRating: 0,
  })

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem("admin_authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
      loadDashboardData()
    }
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()

    // Fetch all movies with their statistics
    const { data: moviesData } = await supabase
      .from("movies")
      .select("*")
      .order("created_at", { ascending: false })

    // Get overall statistics
    const { data: allRatings } = await supabase.from("ratings").select("*")
    const { data: allReactions } = await supabase.from("reactions").select("*")

    const typedRatings = (allRatings || []) as DatabaseRating[]
    const typedReactions = (allReactions || []) as DatabaseReaction[]

    // Calculate stats for each movie
    const moviesWithStats: MovieWithStats[] = (moviesData || []).map((movie) => {
      const movieRatings = typedRatings.filter((r) => r.movie_id === movie.id)
      const movieReactions = typedReactions.filter((r) => r.movie_id === movie.id)
      
      const averageRating = movieRatings.length > 0
        ? movieRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / movieRatings.length
        : 0

      return {
        ...movie,
        ratingsCount: movieRatings.length,
        reactionsCount: movieReactions.length,
        averageRating: Math.round(averageRating * 10) / 10,
      }
    })

    setMovies(moviesWithStats)

    // Calculate overall stats
    const totalRatings = typedRatings.length
    const totalReactions = typedReactions.length
    const overallAverageRating = totalRatings > 0
      ? typedRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalRatings
      : 0

    setStats({
      totalMovies: moviesData?.length || 0,
      totalRatings,
      totalReactions,
      averageRating: Math.round(overallAverageRating * 10) / 10,
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true)
      sessionStorage.setItem("admin_authenticated", "true")
      await loadDashboardData()
    } else {
      setError("Invalid username or password")
    }

    setLoading(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("admin_authenticated")
    setUsername("")
    setPassword("")
    setError("")
  }

  const handleDeleteMovie = async (movieId: string) => {
    const supabase = createClient()
    
    try {
      // Delete all ratings for this movie
      await supabase.from("ratings").delete().eq("movie_id", movieId)
      
      // Delete all reactions for this movie
      await supabase.from("reactions").delete().eq("movie_id", movieId)
      
      // Delete the movie
      const { error } = await supabase.from("movies").delete().eq("id", movieId)
      
      if (error) throw error
      
      // Reload data
      await loadDashboardData()
    } catch (error) {
      console.error("Error deleting movie:", error)
      alert("Failed to delete movie. Please try again.")
    }
  }

  const handleAddMovie = async (movieData: {
    title: string
    year: number
    poster_url: string
    imdb_id: string
  }) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.from("movies").insert([movieData])
      
      if (error) throw error
      
      // Reload data
      await loadDashboardData()
    } catch (error) {
      console.error("Error adding movie:", error)
      alert("Failed to add movie. Please try again.")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Admin Access
            </CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="h-12 text-base pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminDashboard
        movies={movies}
        stats={stats}
        onDeleteMovie={handleDeleteMovie}
        onAddMovie={handleAddMovie}
        onLogout={handleLogout}
        onRefresh={loadDashboardData}
      />
    </div>
  )
}
