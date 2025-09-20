"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getDeviceId, getUserIP, getNetworkFingerprint } from "@/lib/device-id"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { RatingDistributionChart } from "@/components/rating-distribution-chart"
import { CategoryRatingsChart } from "@/components/category-ratings-chart"
import { ThumbsUp, ThumbsDown, Share2, BarChart3 } from "lucide-react"

interface DatabaseRating {
  id: string
  movie_id: string
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
  const [deviceId, setDeviceId] = useState("")
  const [userIP, setUserIP] = useState("")
  const [networkFingerprint, setNetworkFingerprint] = useState("")
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0])
  const [categoryData, setCategoryData] = useState<{category: string, average: number, count: number}[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const initializeDevice = async () => {
      const id = getDeviceId()
      const ip = await getUserIP()
      const fingerprint = getNetworkFingerprint()
      
      setDeviceId(id)
      setUserIP(ip)
      setNetworkFingerprint(fingerprint)
      
      await fetchUserData(id, ip)
      await fetchAnalyticsData()
    }

    initializeDevice()
  }, [movie.id])

  const fetchUserData = async (deviceId: string, ip?: string) => {
    try {
      // Check for existing rating using both device_id and user_ip for better restriction
      const { data: existingRating } = await supabase
        .from("ratings")
        .select("*")
        .eq("movie_id", movie.id)
        .eq("device_id", deviceId)
        .eq("user_ip", ip || userIP)
        .single()

      if (existingRating) {
        setUserRating(existingRating)
      }

      // Check for existing reaction
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("*")
        .eq("movie_id", movie.id)
        .eq("device_id", deviceId)
        .eq("user_ip", ip || userIP)
        .single()

      if (existingReaction) {
        setUserReaction(existingReaction.reaction_type)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchAnalyticsData = async () => {
    const { data: ratings } = await supabase.from("ratings").select("*").eq("movie_id", movie.id)

    if (ratings) {
      const typedRatings = ratings as DatabaseRating[]
      const distribution = [0, 0, 0, 0, 0]
      typedRatings.forEach((rating: DatabaseRating) => {
        const overallRating = Math.floor(rating.overall_rating || 0)
        if (overallRating >= 1 && overallRating <= 5) {
          distribution[overallRating - 1]++
        }
      })
      setRatingDistribution(distribution)

      const categories = [
        { name: "Story", key: "story_rating" as keyof DatabaseRating },
        { name: "Screenplay", key: "screenplay_rating" as keyof DatabaseRating },
        { name: "Direction", key: "direction_rating" as keyof DatabaseRating },
        { name: "Performance", key: "performance_rating" as keyof DatabaseRating },
        { name: "Music", key: "music_rating" as keyof DatabaseRating },
      ]

      const categoryStats = categories.map((category) => {
        const validRatings = typedRatings.filter((r: DatabaseRating) => r[category.key] !== null)
        const average = validRatings.length
          ? validRatings.reduce((sum, r: DatabaseRating) => sum + (r[category.key] as number), 0) / validRatings.length
          : 0
        return {
          category: category.name,
          average: Number(average.toFixed(1)),
          count: validRatings.length,
        }
      })

      setCategoryData(categoryStats)
    }
  }

  const handleRatingSubmit = async (ratings: RatingSubmission) => {
    if (!deviceId || !userIP) {
      alert("Unable to submit rating. Please refresh the page and try again.")
      return
    }
    
    // Check if user already has a rating - prevent updates
    if (userRating?.id) {
      alert("You have already rated this movie. Ratings cannot be changed once submitted.")
      return
    }
    
    setIsLoading(true)

    try {
      const ratingData = {
        movie_id: movie.id,
        device_id: deviceId,
        user_ip: userIP,
        network_fingerprint: networkFingerprint,
        overall_rating: ratings.overall,
        story_rating: ratings.story,
        screenplay_rating: ratings.screenplay,
        direction_rating: ratings.direction,
        performance_rating: ratings.performance,
        music_rating: ratings.music,
      }

      // Only allow new ratings, no updates
      const result = await supabase
        .from("ratings")
        .insert(ratingData)
        .select()

      if (result.error) {
        if (result.error.code === '23505') { // Unique constraint violation
          alert("You have already rated this movie. You can only rate once per movie.")
          return
        }
        throw result.error
      }

      // Update local state with the new rating
      if (result.data && result.data[0]) {
        setUserRating(result.data[0])
      }

      await refreshStats()
      await fetchAnalyticsData()
      
      alert("Rating submitted successfully! Thank you for your feedback.")
    } catch (error) {
      console.error("Error submitting rating:", error)
      alert("Failed to submit rating. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (reactionType: "thumbs_up" | "thumbs_down") => {
    if (!deviceId || !userIP) {
      alert("Unable to submit reaction. Please refresh the page and try again.")
      return
    }
    
    // Check if user already has any reaction - prevent any changes
    if (userReaction) {
      alert("You have already reacted to this movie. Reactions cannot be changed once submitted.")
      return
    }
    
    setIsLoading(true)

    try {
      // Only allow new reactions, no updates or deletions
      const reactionData = {
        movie_id: movie.id,
        device_id: deviceId,
        user_ip: userIP,
        network_fingerprint: networkFingerprint,
        reaction_type: reactionType,
      }

      const result = await supabase
        .from("reactions")
        .insert(reactionData)
        .select()

      if (result.error) {
        if (result.error.code === '23505') { // Unique constraint violation
          alert("You have already reacted to this movie. You can only react once per movie.")
          return
        }
        throw result.error
      }

      setUserReaction(reactionType)
      await refreshStats()
      
      alert("Reaction submitted successfully! Thank you for your feedback.")
    } catch (error) {
      console.error("Error submitting reaction:", error)
      alert("Failed to submit reaction. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = async () => {
    const { data: ratings } = await supabase.from("ratings").select("*").eq("movie_id", movie.id)
    const typedRatings = ratings as DatabaseRating[] | null

    const { data: reactions } = await supabase.from("reactions").select("*").eq("movie_id", movie.id)
    const typedReactions = reactions as DatabaseReaction[] | null

    // Helper function to calculate average for a specific rating type
    const calculateAverage = (ratingKey: keyof DatabaseRating) => {
      if (!typedRatings || typedRatings.length === 0) return 0
      const validRatings = typedRatings.filter((r: DatabaseRating) => 
        r[ratingKey] !== null && r[ratingKey] !== undefined && (r[ratingKey] as number) > 0
      )
      if (validRatings.length === 0) return 0
      const sum = validRatings.reduce((acc, r: DatabaseRating) => acc + (r[ratingKey] as number), 0)
      return Number((sum / validRatings.length).toFixed(2))
    }

    const newStats = {
      totalRatings: typedRatings?.length || 0,
      averageOverall: calculateAverage('overall_rating'),
      averageStory: calculateAverage('story_rating'),
      averageScreenplay: calculateAverage('screenplay_rating'),
      averageDirection: calculateAverage('direction_rating'),
      averagePerformance: calculateAverage('performance_rating'),
      averageMusic: calculateAverage('music_rating'),
      thumbsUp: typedReactions?.filter((r: DatabaseReaction) => r.reaction_type === "thumbs_up").length || 0,
      thumbsDown: typedReactions?.filter((r: DatabaseReaction) => r.reaction_type === "thumbs_down").length || 0,
    }

    setStats(newStats)
    await fetchAnalyticsData()
  }

  const shareMovie = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Rate ${movie.title} on Ratingz.fun`,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="flex-shrink-0 lg:w-80">
            <div className="relative group">
              <img
                src={movie.poster_url || "/placeholder.svg"}
                alt={movie.title}
                className="w-full h-[480px] object-cover rounded-2xl shadow-2xl mx-auto transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-tight">
                {movie.title}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-slate-600 dark:text-slate-400">{movie.year}</span>
                {movie.imdb_id && (
                  <a 
                    href={`https://www.imdb.com/title/${movie.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors duration-200"
                  >
                    IMDb
                  </a>
                )}
              </div>
            </div>

            {/* Overall Rating Card */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-2xl">
                  <span className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                    Overall Rating
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={shareMovie}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    {stats.averageOverall.toFixed(1)}
                  </div>
                  <div className="flex-1">
                    <StarRating value={stats.averageOverall} readonly size="lg" />
                    <div className="text-sm text-muted-foreground mt-1">
                      Based on {stats.totalRatings} {stats.totalRatings === 1 ? 'rating' : 'ratings'}
                    </div>
                  </div>
                </div>

                {/* Reaction Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant={userReaction === "thumbs_up" ? "default" : "outline"}
                    onClick={() => handleReaction("thumbs_up")}
                    disabled={isLoading || !!userReaction}
                    className={`flex-1 h-12 text-lg transition-all duration-200 ${
                      userReaction === "thumbs_up" 
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg" 
                        : userReaction
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    {stats.thumbsUp}
                  </Button>
                  <Button
                    variant={userReaction === "thumbs_down" ? "default" : "outline"}
                    onClick={() => handleReaction("thumbs_down")}
                    disabled={isLoading || !!userReaction}
                    className={`flex-1 h-12 text-lg transition-all duration-200 ${
                      userReaction === "thumbs_down" 
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" 
                        : userReaction
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    {stats.thumbsDown}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Ratings Preview */}
            {stats.totalRatings > 0 && (
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Category Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Story", value: stats.averageStory, color: "from-blue-500 to-cyan-500" },
                      { label: "Screenplay", value: stats.averageScreenplay, color: "from-purple-500 to-pink-500" },
                      { label: "Direction", value: stats.averageDirection, color: "from-green-500 to-emerald-500" },
                      { label: "Performance", value: stats.averagePerformance, color: "from-orange-500 to-red-500" },
                      { label: "Music", value: stats.averageMusic, color: "from-indigo-500 to-purple-500" },
                    ].map((category) => (
                      <div key={category.label} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <div className={`text-2xl font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
                          {category.value.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">{category.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && stats.totalRatings > 0 && (
          <div className="space-y-8 mb-12">
            <h2 className="text-3xl font-bold text-center">Detailed Analytics</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                    Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RatingDistributionChart data={ratingDistribution} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryRatingsChart data={categoryData} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Rating Form */}
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {userRating ? "Your Rating" : "Rate This Movie"}
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              {userRating ? "Thank you for rating this movie! Ratings cannot be changed once submitted." : "Share your thoughts and help others discover great movies"}
            </p>
          </CardHeader>
          <CardContent>
            <RatingForm userRating={userRating} onSubmit={handleRatingSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
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

  const handleSubmit = () => {
    if (ratings.overall > 0) {
      onSubmit(ratings)
    }
  }

  const categoryIcons = {
    story: "📖",
    screenplay: "✍️", 
    direction: "🎬",
    performance: "🎭",
    music: "🎵"
  }

  const categoryColors = {
    story: "from-blue-500 to-cyan-500",
    screenplay: "from-purple-500 to-pink-500",
    direction: "from-green-500 to-emerald-500",
    performance: "from-orange-500 to-red-500",
    music: "from-indigo-500 to-purple-500"
  }

  return (
    <div className="space-y-8">
      {/* Overall Rating Section */}
      <div className="text-center space-y-4 p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-500 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-3xl">⭐</div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Overall Rating
          </h3>
          <div className="text-3xl">⭐</div>
        </div>
        <p className="text-muted-foreground mb-6">How would you rate this movie overall?</p>
        <div className="flex justify-center">
          <StarRating
            value={ratings.overall}
            onChange={(value) => setRatings({ ...ratings, overall: value })}
            size="lg"
          />
        </div>
        {ratings.overall > 0 && (
          <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 animate-fade-in">
            {ratings.overall === 5 ? "Masterpiece! 🏆" : 
             ratings.overall >= 4 ? "Excellent! 👏" :
             ratings.overall >= 3 ? "Good! 👍" :
             ratings.overall >= 2 ? "Fair 👌" : "Poor 👎"}
          </div>
        )}
      </div>

      {/* Category Ratings */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Category Ratings</h3>
          <p className="text-muted-foreground">Rate specific aspects (optional)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { key: "story", label: "Story", description: "Plot, narrative, and storytelling" },
            { key: "screenplay", label: "Screenplay", description: "Dialogue and script quality" },
            { key: "direction", label: "Direction", description: "Visual style and pacing" },
            { key: "performance", label: "Performance", description: "Acting and character portrayal" },
            { key: "music", label: "Music", description: "Soundtrack and score" },
          ].map(({ key, label, description }) => (
            <div 
              key={key} 
              className="group p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{categoryIcons[key as keyof typeof categoryIcons]}</span>
                  <h4 className={`font-bold text-lg bg-gradient-to-r ${categoryColors[key as keyof typeof categoryColors]} bg-clip-text text-transparent`}>
                    {label}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="flex justify-center">
                  <StarRating
                    value={ratings[key as keyof typeof ratings]}
                    onChange={(value) => setRatings({ ...ratings, [key]: value })}
                    size="md"
                  />
                </div>
                {ratings[key as keyof typeof ratings] > 0 && (
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-fade-in">
                    {ratings[key as keyof typeof ratings]}/5 stars
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center pt-6">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || ratings.overall === 0} 
          className={`px-12 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
            ratings.overall === 0 
              ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{userRating ? "Update Rating" : "Submit Rating"}</span>
              <span className="text-xl">🚀</span>
            </div>
          )}
        </Button>
        
        {ratings.overall === 0 && (
          <p className="text-sm text-muted-foreground mt-3 animate-pulse">
            Please provide an overall rating to continue
          </p>
        )}
      </div>
    </div>
  )
}
