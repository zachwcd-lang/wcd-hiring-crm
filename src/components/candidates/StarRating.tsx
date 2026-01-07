import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function StarRating({ rating, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i + 1 === rating ? 0 : i + 1)}
          className={cn(
            'transition-colors',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              i < rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 hover:text-amber-200'
            )}
          />
        </button>
      ))}
    </div>
  )
}
