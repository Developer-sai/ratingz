"use client"

import Link from "next/link"
import { Film } from "lucide-react"

export function Header() {
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
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
