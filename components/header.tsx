"use client"

import Link from "next/link"
import { Film } from "lucide-react"
import { useState, useEffect } from "react"
import { AuthButton, UserAvatar } from "@/components/auth-button"
import { User } from "@supabase/supabase-js"

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if user is authenticated as admin
    const authStatus = sessionStorage.getItem("admin_authenticated")
    setIsAdmin(authStatus === "true")
  }, [])

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            <Film className="w-8 h-8 text-primary" />
            <span>Ratingz.fun</span>
          </Link>

          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Movies
              </Link>
              {user && (
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Profile
                </Link>
              )}
              {isMounted && isAdmin && (
                <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {user && <UserAvatar user={user} />}
              <AuthButton user={user} variant="outline" />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
