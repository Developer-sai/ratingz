"use client"

import Link from "next/link"
import { Film } from "lucide-react"
import { useState, useEffect } from "react"

export function Header() {
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

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Movies
            </Link>
            {isMounted && isAdmin && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
