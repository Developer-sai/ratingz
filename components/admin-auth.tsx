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

    const typedMovies = (moviesData || []) as DatabaseMovie[]
    const typedRatings = (allRatings || []) as DatabaseRating[]
    const typedReactions = (allReactions || []) as DatabaseReaction[]

    const statsData: AdminStats = {
      totalMovies: typedMovies.length,
      totalRatings: typedRatings.length,
      totalReactions: typedReactions.length,
      averageRating: typedRatings.length
        ? typedRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / typedRatings.length
        : 0,
    }

    // Calculate individual movie stats
    const moviesWithStats: MovieWithStats[] = await Promise.all(
      typedMovies.map(async (movie) => {
        const { data: ratings } = await supabase
          .from("ratings")
          .select("*")
          .eq("movie_id", movie.id)
        const { data: reactions } = await supabase
          .from("reactions")
          .select("*")
          .eq("movie_id", movie.id)

        const typedMovieRatings = (ratings || []) as DatabaseRating[]
        const typedMovieReactions = (reactions || []) as DatabaseReaction[]

        return {
          ...movie,
          ratingsCount: typedMovieRatings.length,
          reactionsCount: typedMovieReactions.length,
          averageRating: typedMovieRatings.length
            ? typedMovieRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / typedMovieRatings.length
            : 0,
        }
      }),
    )

    setMovies(moviesWithStats)
    setStats(statsData)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate a brief loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem("admin_authenticated", "true")
      setIsAuthenticated(true)
      await loadDashboardData()
    } else {
      setError("Invalid username or password")
    }

    setLoading(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated")
    setIsAuthenticated(false)
    setUsername("")
    setPassword("")
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
          <AdminDashboard movies={movies} stats={stats} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
