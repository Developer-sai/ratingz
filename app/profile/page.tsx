import { createClient } from "@/lib/supabase/server"
import { getUser, requireAuth } from "@/lib/auth"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/star-rating"
import { ThumbsUp, ThumbsDown, Calendar, Film } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

interface UserRating {
  id: string
  overall_rating: number
  story_rating: number | null
  acting_rating: number | null
  cinematography_rating: number | null
  music_rating: number | null
  created_at: string
  movie: {
    id: string
    title: string
    year: number
    poster_url: string
    imdb_id: string
  }
}

interface UserReaction {
  id: string
  reaction_type: string
  created_at: string
  movie: {
    id: string
    title: string
    year: number
    poster_url: string
  }
}

export default async function ProfilePage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/')
  }

  const supabase = await createClient()

  // Fetch user's ratings with movie details
  const { data: ratingsData } = await supabase
    .from('ratings')
    .select(`
      id,
      overall_rating,
      story_rating,
      acting_rating,
      cinematography_rating,
      music_rating,
      created_at,
      movie:movies (
        id,
        title,
        year,
        poster_url,
        imdb_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch user's reactions with movie details
  const { data: reactionsData } = await supabase
    .from('reactions')
    .select(`
      id,
      reaction_type,
      created_at,
      movie:movies (
        id,
        title,
        year,
        poster_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const ratings = (ratingsData || []) as UserRating[]
  const reactions = (reactionsData || []) as UserReaction[]

  const totalRatings = ratings.length
  const averageRating = totalRatings > 0 
    ? ratings.reduce((sum, rating) => sum + rating.overall_rating, 0) / totalRatings 
    : 0

  const thumbsUpCount = reactions.filter(r => r.reaction_type === 'thumbs_up').length
  const thumbsDownCount = reactions.filter(r => r.reaction_type === 'thumbs_down').length

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || user.email}
                className="w-16 h-16 rounded-full border-4 border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Film className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {user.user_metadata?.full_name || 'Movie Enthusiast'}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{totalRatings}</p>
                    <p className="text-sm text-muted-foreground">Movies Rated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <StarRating value={averageRating} readonly size="sm" />
                  <div>
                    <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{thumbsUpCount}</p>
                    <p className="text-sm text-muted-foreground">Thumbs Up</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{thumbsDownCount}</p>
                    <p className="text-sm text-muted-foreground">Thumbs Down</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rated Movies */}
        <Card>
          <CardHeader>
            <CardTitle>Your Movie Ratings</CardTitle>
            <CardDescription>
              {totalRatings > 0 
                ? `You've rated ${totalRatings} movie${totalRatings === 1 ? '' : 's'}. Your ratings are read-only here - visit individual movie pages to update them.`
                : "You haven't rated any movies yet. Start exploring and rating movies to build your profile!"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalRatings > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ratings.map((rating) => (
                  <Link key={rating.id} href={`/movie/${rating.movie.id}`}>
                    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-16 h-24 flex-shrink-0">
                            <img
                              src={rating.movie.poster_url || "/placeholder.svg?height=96&width=64&query=movie poster"}
                              alt={rating.movie.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                              {rating.movie.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2">{rating.movie.year}</p>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <StarRating value={rating.overall_rating} readonly size="xs" />
                                <span className="text-xs font-medium">{rating.overall_rating.toFixed(1)}</span>
                              </div>
                              
                              {(rating.story_rating || rating.acting_rating || rating.cinematography_rating || rating.music_rating) && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {rating.story_rating && (
                                    <div className="flex justify-between">
                                      <span>Story:</span>
                                      <span>{rating.story_rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {rating.acting_rating && (
                                    <div className="flex justify-between">
                                      <span>Acting:</span>
                                      <span>{rating.acting_rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {rating.cinematography_rating && (
                                    <div className="flex justify-between">
                                      <span>Cinematography:</span>
                                      <span>{rating.cinematography_rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {rating.music_rating && (
                                    <div className="flex justify-between">
                                      <span>Music:</span>
                                      <span>{rating.music_rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(rating.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-4">No ratings yet</p>
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Start Rating Movies
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}