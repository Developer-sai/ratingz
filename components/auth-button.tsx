"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, User } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthButtonProps {
  user: SupabaseUser | null
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function AuthButton({ user, className, variant = "default", size = "default" }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('Error signing in:', error)
        alert('Failed to sign in. Please try again.')
      }
    } catch (error) {
      console.error('Error signing in:', error)
      alert('Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        alert('Failed to sign out. Please try again.')
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <Button
        onClick={handleSignOut}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Signing out...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </div>
        )}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Signing in...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </div>
      )}
    </Button>
  )
}

interface UserAvatarProps {
  user: SupabaseUser | null
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) return null

  const avatarUrl = user.user_metadata?.avatar_url
  const fullName = user.user_metadata?.full_name || user.email

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName}
          className="w-8 h-8 rounded-full border-2 border-border"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
      <span className="text-sm font-medium truncate max-w-32">
        {fullName}
      </span>
    </div>
  )
}