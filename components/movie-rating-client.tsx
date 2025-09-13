"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getDeviceId } from "@/lib/device-id"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { RatingDistributionChart } from "@/components/rating-distribution-chart"
import { CategoryRatingsChart } from "@/components/category-ratings-chart"
import { ThumbsUp, ThumbsDown, Share2, BarChart3 } from "lucide-react"

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
  const [userRating, setUserRating] = useState<any>(null)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deviceId, setDeviceId] = useState("")
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const id = getDeviceId()
    setDeviceId(id)
    fetchUserData(id)
    fetchAnalyticsData()
  }, [])

  const fetchUserData = async (deviceId: string) => {
    const { data: rating } = await supabase
      .from("ratings")
      .select("*")
      .eq("movie_id", movie.id)
      .eq("device_id", deviceId)
      .single()

    if (rating) {
      setUserRating(rating)
    }

    const { data: reaction } = await supabase
      .from("reactions")
      .select("*")
      .eq("movie_id", movie.id)
      .eq("device_id", deviceId)
      .single()

    if (reaction) {
      setUserReaction(reaction.reaction_type)
    }
  }

  const fetchAnalyticsData = async () => {
    const { data: ratings } = await supabase.from("ratings").select("*").eq("movie_id", movie.id)

    if (ratings) {
      const distribution = [0, 0, 0, 0, 0]
      ratings.forEach((rating) => {
        const overallRating = Math.floor(rating.overall_rating || 0)
        if (overallRating >= 1 && overallRating <= 5) {
          distribution[overallRating - 1]++
        }
      })
      setRatingDistribution(distribution)

      const categories = [
        { name: "Story", key: "story_rating" },
        { name: "Screenplay", key: "screenplay_rating" },
        { name: "Direction", key: "direction_rating" },
        { name: "Performance", key: "performance_rating" },
        { name: "Music", key: "music_rating" },
      ]

      const categoryStats = categories.map((category) => {
        const validRatings = ratings.filter((r) => r[category.key] !== null)
        const average = validRatings.length
          ? validRatings.reduce((sum, r) => sum + r[category.key], 0) / validRatings.length
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

  const handleRatingSubmit = async (ratings: any) => {
    if (!deviceId) return
    setIsLoading(true)

    try {
      const ratingData = {
        movie_id: movie.id,
        device_id: deviceId,
        overall_rating: ratings.overall,
        story_rating: ratings.story || null,
        screenplay_rating: ratings.screenplay || null,
        direction_rating: ratings.direction || null,
        performance_rating: ratings.performance || null,
        music_rating: ratings.music || null,
      }

      if (userRating) {
        await supabase.from("ratings").update(ratingData).eq("id", userRating.id)
      } else {
        await supabase.from("ratings").insert(ratingData)
      }

      await refreshStats()
      await fetchUserData(deviceId)
    } catch (error) {
      console.error("Error submitting rating:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (reactionType: "thumbs_up" | "thumbs_down") => {
    if (!deviceId) return
    setIsLoading(true)

    try {
      if (userReaction === reactionType) {
        await supabase.from("reactions").delete().eq("movie_id", movie.id).eq("device_id", deviceId)
        setUserReaction(null)
      } else {
        await supabase.from("reactions").upsert({
          movie_id: movie.id,
          device_id: deviceId,
          reaction_type: reactionType,
        })
        setUserReaction(reactionType)
      }

      await refreshStats()
    } catch (error) {
      console.error("Error submitting reaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = async () => {
    const { data: ratings } = await supabase.from("ratings").select("*").eq("movie_id", movie.id)

    const { data: reactions } = await supabase.from("reactions").select("*").eq("movie_id", movie.id)

    const newStats = {
      totalRatings: ratings?.length || 0,
      averageOverall: ratings?.length
        ? ratings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / ratings.length
        : 0,
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-shrink-0">
          <img
            src={movie.poster_url || "/placeholder.svg"}
            alt={movie.title}
            className="w-64 h-96 object-cover rounded-lg shadow-lg mx-auto md:mx-0"
          />
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-balance">{movie.title}</h1>
            <p className="text-xl text-muted-foreground">{movie.year}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Overall Rating
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareMovie}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{stats.averageOverall.toFixed(1)}</div>
                <StarRating value={stats.averageOverall} readonly size="lg" />
                <div className="text-sm text-muted-foreground">({stats.totalRatings} ratings)</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant={userReaction === "thumbs_up" ? "default" : "outline"}
              onClick={() => handleReaction("thumbs_up")}
              disabled={isLoading}
              className="flex-1"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              {stats.thumbsUp}
            </Button>
            <Button
              variant={userReaction === "thumbs_down" ? "default" : "outline"}
              onClick={() => handleReaction("thumbs_down")}
              disabled={isLoading}
              className="flex-1"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              {stats.thumbsDown}
            </Button>
          </div>
        </div>
      </div>

      {showAnalytics && stats.totalRatings > 0 && (
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
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryRatingsChart data={categoryData} />
            </CardContent>
          </Card>
        </div>
      )}

      <RatingForm userRating={userRating} onSubmit={handleRatingSubmit} isLoading={isLoading} />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Story", value: stats.averageStory },
              { label: "Screenplay", value: stats.averageScreenplay },
              { label: "Direction", value: stats.averageDirection },
              { label: "Performance", value: stats.averagePerformance },
              { label: "Music", value: stats.averageMusic },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <StarRating value={value} readonly size="sm" />
                  <span className="text-sm text-muted-foreground w-8">{value > 0 ? value.toFixed(1) : "-"}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface RatingFormProps {
  userRating: any
  onSubmit: (ratings: any) => void
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate This Movie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Overall Rating *</label>
          <StarRating
            value={ratings.overall}
            onChange={(value) => setRatings({ ...ratings, overall: value })}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: "story", label: "Story" },
            { key: "screenplay", label: "Screenplay" },
            { key: "direction", label: "Direction" },
            { key: "performance", label: "Performance" },
            { key: "music", label: "Music" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-2">{label} (Optional)</label>
              <StarRating
                value={ratings[key as keyof typeof ratings]}
                onChange={(value) => setRatings({ ...ratings, [key]: value })}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={isLoading || ratings.overall === 0} className="w-full">
          {isLoading ? "Submitting..." : userRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </CardContent>
    </Card>
  )
}
