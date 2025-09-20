"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { RatingDistributionChart } from "@/components/rating-distribution-chart"
import { CategoryRatingsChart } from "@/components/category-ratings-chart"
import { ThumbsUp, ThumbsDown, Share2, BarChart3, LogIn } from "lucide-react"
import { User } from "@supabase/supabase-js"

interface DatabaseRating {
  id: string
  movie_id: string
  user_id: string
  overall_rating: number
  story_rating: number
  screenplay_rating: number
  direction_rating: number
  performance_rating: number
  music_rating: number
  created_at: string
}

interface DatabaseReaction {
  id: string
  movie_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

interface Movie {
  id: string
  title: string
  year: number
  poster_url: string
  imdb_id: string
}

interface RatingStats {
  totalRatings: number
  averageOverall: number
  averageStory: number
  averageScreenplay: number
  averageDirection: number
  averagePerformance: number
  averageMusic: number
  thumbsUp: number
  thumbsDown: number
}

interface MovieRatingClientProps {
  movie: Movie
  initialStats: RatingStats
}

export function MovieRatingClient({ movie, initialStats }: MovieRatingClientProps) {
  const [stats, setStats] = useState(initialStats)
  const [userRating, setUserRating] = useState<UserRating | null>(null)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0])
  const [categoryData, setCategoryData] = useState<{category: string, average: number, count: number}[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await fetchUserData(user.id)
      }
      await fetchAnalyticsData()
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserData(session.user.id)
      } else {
        setUserRating(null)
        setUserReaction(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [movie.id])

  const fetchUserData = async (userId: string) => {
    try {
      // Check for existing rating
      const { data: existingRating } = await supabase
        .from("ratings")
        .select("*")
        .eq("movie_id", movie.id)
        .eq("user_id", userId)
        .single()

      if (existingRating) {
        setUserRating(existingRating)
      }

      // Check for existing reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("*")
        .eq("movie_id", movie.id)
        .eq("user_id", userId)
        .single()

      if (existingReaction) {
        setUserReaction(existingReaction.reaction_type)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      // Fetch rating distribution
      const { data: ratings } = await supabase
        .from("ratings")
        .select("overall_rating")
        .eq("movie_id", movie.id)

      if (ratings) {
        const distribution = [0, 0, 0, 0, 0]
        ratings.forEach((rating) => {
          const ratingValue = Math.floor(rating.overall_rating)
          if (ratingValue >= 1 && ratingValue <= 5) {
            distribution[ratingValue - 1]++
          }
        })
        setRatingDistribution(distribution)
      }

      // Fetch category averages
      const { data: categoryRatings } = await supabase
        .from("ratings")
        .select("story_rating, screenplay_rating, direction_rating, performance_rating, music_rating")
        .eq("movie_id", movie.id)

      if (categoryRatings && categoryRatings.length > 0) {
        const categories = [
          { name: "Story", key: "story_rating" },
          { name: "Screenplay", key: "screenplay_rating" },
          { name: "Direction", key: "direction_rating" },
          { name: "Performance", key: "performance_rating" },
          { name: "Music", key: "music_rating" },
        ]

        const categoryData = categories.map((category) => {
          const values = categoryRatings
            .map((r) => r[category.key as keyof typeof r])
            .filter((v) => v !== null) as number[]
          
          const average = values.length > 0 
            ? values.reduce((sum, val) => sum + val, 0) / values.length 
            : 0
          
          return {
            category: category.name,
            average: Math.round(average * 10) / 10,
            count: values.length,
          }
        })

        setCategoryData(categoryData)
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    }
  }

  const refreshStats = async () => {
    try {
      const { data: ratings } = await supabase
        .from("ratings")
        .select("overall_rating, story_rating, screenplay_rating, direction_rating, performance_rating, music_rating")
        .eq("movie_id", movie.id)

      const { data: reactions } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("movie_id", movie.id)

      if (ratings) {
        const totalRatings = ratings.length
        const averageOverall = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.overall_rating, 0) / totalRatings 
          : 0
        const averageStory = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.story_rating, 0) / totalRatings 
          : 0
        const averageScreenplay = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.screenplay_rating, 0) / totalRatings 
          : 0
        const averageDirection = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.direction_rating, 0) / totalRatings 
          : 0
        const averagePerformance = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.performance_rating, 0) / totalRatings 
          : 0
        const averageMusic = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.music_rating, 0) / totalRatings 
          : 0

        const thumbsUp = reactions?.filter(r => r.reaction_type === "thumbs_up").length || 0
        const thumbsDown = reactions?.filter(r => r.reaction_type === "thumbs_down").length || 0

        setStats({
          totalRatings,
          averageOverall: Math.round(averageOverall * 10) / 10,
          averageStory: Math.round(averageStory * 10) / 10,
          averageScreenplay: Math.round(averageScreenplay * 10) / 10,
          averageDirection: Math.round(averageDirection * 10) / 10,
          averagePerformance: Math.round(averagePerformance * 10) / 10,
          averageMusic: Math.round(averageMusic * 10) / 10,
          thumbsUp,
          thumbsDown,
        })
      }

      await fetchAnalyticsData()
    } catch (error) {
      console.error("Error refreshing stats:", error)
    }
  }

  const handleRatingSubmit = async (ratings: RatingSubmission) => {
    if (!user) {
      alert("Please sign in to submit a rating.")
      return
    }
    
    setIsLoading(true)

    try {
      const ratingData = {
        movie_id: movie.id,
        user_id: user.id,
        overall_rating: ratings.overall,
        story_rating: ratings.story,
        screenplay_rating: ratings.screenplay,
        direction_rating: ratings.direction,
        performance_rating: ratings.performance,
        music_rating: ratings.music,
      }

      let result
      if (userRating?.id) {
        // Update existing rating
        result = await supabase
          .from("ratings")
          .update(ratingData)
          .eq("id", userRating.id)
          .select()
      } else {
        // Insert new rating
        result = await supabase
          .from("ratings")
          .insert(ratingData)
          .select()
      }

      if (result.error) {
        if (result.error.code === '23505') { // Unique constraint violation
          alert("You have already rated this movie. You can only rate once per movie.")
          return
        }
        throw result.error
      }

      // Update local state with the new/updated rating
      if (result.data && result.data[0]) {
        setUserRating(result.data[0])
      }

      await refreshStats()
      alert(userRating?.id ? "Rating updated successfully!" : "Rating submitted successfully!")
    } catch (error) {
      console.error("Error submitting rating:", error)
      alert("Failed to submit rating. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (reactionType: "thumbs_up" | "thumbs_down") => {
    if (!user) {
      alert("Please sign in to react to this movie.")
      return
    }
    
    setIsLoading(true)

    try {
      if (userReaction === reactionType) {
        // Remove existing reaction
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("movie_id", movie.id)
          .eq("user_id", user.id)
        
        if (error) throw error
        setUserReaction(null)
      } else {
        // Add or update reaction
        const reactionData = {
          movie_id: movie.id,
          user_id: user.id,
          reaction_type: reactionType,
        }

        const { error } = await supabase
          .from("reactions")
          .upsert(reactionData, {
            onConflict: 'movie_id,user_id'
          })

        if (error) throw error
        setUserReaction(reactionType)
      }

      await refreshStats()
    } catch (error) {
      console.error("Error submitting reaction:", error)
      alert("Failed to submit reaction. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/movie/${movie.id}`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error("Error signing in with Google:", error)
      alert("Failed to sign in with Google. Please try again.")
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const shareMovie = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${movie.title} (${movie.year}) - Ratingz`,
          text: `Check out the ratings for ${movie.title} on Ratingz!`,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert("Movie URL copied to clipboard!")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Movie Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-shrink-0">
          <img
            src={movie.poster_url || "/placeholder.svg"}
            alt={`${movie.title} poster`}
            className="w-64 h-96 object-cover rounded-lg shadow-lg mx-auto md:mx-0"
          />
        </div>
        
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">({movie.year})</p>
            {movie.imdb_id && (
              <a
                href={`https://www.imdb.com/title/${movie.imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View on IMDb
              </a>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.averageOverall || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Overall Rating</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalRatings}</div>
              <div className="text-sm text-muted-foreground">Total Ratings</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.thumbsUp}</div>
              <div className="text-sm text-muted-foreground">Thumbs Up</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.thumbsDown}</div>
              <div className="text-sm text-muted-foreground">Thumbs Down</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleReaction("thumbs_up")}
              variant={userReaction === "thumbs_up" ? "default" : "outline"}
              disabled={isLoading || !user}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {userReaction === "thumbs_up" ? "Liked" : "Like"}
            </Button>
            
            <Button
              onClick={() => handleReaction("thumbs_down")}
              variant={userReaction === "thumbs_down" ? "default" : "outline"}
              disabled={isLoading || !user}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              {userReaction === "thumbs_down" ? "Disliked" : "Dislike"}
            </Button>
            
            <Button onClick={shareMovie} variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            
            <Button
              onClick={() => setShowAnalytics(!showAnalytics)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {showAnalytics ? "Hide" : "Show"} Analytics
            </Button>
          </div>

          {/* Authentication Status */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-sm text-muted-foreground">Signed in</p>
                  </div>
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="font-medium">Sign in to rate and react</p>
                  <p className="text-sm text-muted-foreground">Connect with Google to get started</p>
                </div>
                <Button onClick={handleGoogleSignIn} className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign in with Google
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Form */}
      {user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {userRating ? "Update Your Rating" : "Rate This Movie"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingForm
              userRating={userRating}
              onSubmit={handleRatingSubmit}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <RatingDistributionChart data={ratingDistribution} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Category Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryRatingsChart data={categoryData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">{stats.averageStory || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Story</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">{stats.averageScreenplay || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Screenplay</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">{stats.averageDirection || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Direction</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">{stats.averagePerformance || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Performance</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">{stats.averageMusic || "N/A"}</div>
              <div className="text-sm text-muted-foreground">Music</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface UserRating {
  id?: string
  overall_rating?: number
  story_rating?: number
  screenplay_rating?: number
  direction_rating?: number
  performance_rating?: number
  music_rating?: number
}

interface RatingSubmission {
  overall: number
  story: number
  screenplay: number
  direction: number
  performance: number
  music: number
}

interface RatingFormProps {
  userRating: UserRating | null
  onSubmit: (ratings: RatingSubmission) => void
  isLoading: boolean
}

function RatingForm({ userRating, onSubmit, isLoading }: RatingFormProps) {
  const [ratings, setRatings] = useState({
    overall: userRating?.overall_rating || 0,
    story: userRating?.story_rating || 0,
    screenplay: userRating?.screenplay_rating || 0,
    direction: userRating?.direction_rating || 0,
    performance: userRating?.performance_rating || 0,
    music: userRating?.music_rating || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that all ratings are provided
    const ratingValues = Object.values(ratings)
    if (ratingValues.some(rating => rating === 0)) {
      alert("Please provide ratings for all categories.")
      return
    }

    onSubmit(ratings)
  }

  const updateRating = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Overall Rating</label>
          <StarRating
            rating={ratings.overall}
            onRatingChange={(value) => updateRating("overall", value)}
            size="lg"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Story</label>
          <StarRating
            rating={ratings.story}
            onRatingChange={(value) => updateRating("story", value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Screenplay</label>
          <StarRating
            rating={ratings.screenplay}
            onRatingChange={(value) => updateRating("screenplay", value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Direction</label>
          <StarRating
            rating={ratings.direction}
            onRatingChange={(value) => updateRating("direction", value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Performance</label>
          <StarRating
            rating={ratings.performance}
            onRatingChange={(value) => updateRating("performance", value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Music</label>
          <StarRating
            rating={ratings.music}
            onRatingChange={(value) => updateRating("music", value)}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Submitting..." : userRating ? "Update Rating" : "Submit Rating"}
      </Button>
    </form>
  )
}
