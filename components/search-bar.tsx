"use client"

import type React from "react"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  onSearch: (query: string) => void
  searchQuery: string
}

export function SearchBar({ onSearch, searchQuery }: SearchBarProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by onChange, so this just prevents default form submission
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    onSearch(query)
  }

  const handleClear = () => {
    onSearch("")
  }

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search movies by title, year, or IMDB ID..."
            value={searchQuery}
            onChange={handleInputChange}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground w-4 h-4"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
