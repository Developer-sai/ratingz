"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StarRating({ value, onChange, readonly = false, size = "md", className }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0)
    }
  }

  const displayValue = hoverValue || value

  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          onMouseEnter={() => handleMouseEnter(rating)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          className={cn(
            "transition-colors",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default",
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              rating <= displayValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
            )}
          />
        </button>
      ))}
    </div>
  )
}
