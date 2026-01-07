import { cn } from '@/lib/utils'
import type { AIRecommendation } from '@/types'

interface AIScoreBadgeProps {
  score: number | null
  recommendation?: AIRecommendation | null
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function AIScoreBadge({ score, recommendation, onClick, size = 'sm' }: AIScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <span className="text-[var(--text-muted)]">—</span>
  }

  const getScoreStyle = (score: number) => {
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  const getRecommendationLabel = (rec: AIRecommendation) => {
    const labels: Record<AIRecommendation, string> = {
      'STRONG_YES': 'Strong Yes',
      'YES': 'Yes',
      'MAYBE': 'Maybe',
      'LEAN_NO': 'Lean No',
      'NO': 'No',
    }
    return labels[rec] || rec
  }

  return (
    <div className="group relative inline-flex">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center rounded-full border font-medium transition-all',
          'hover:shadow-sm cursor-pointer',
          getScoreStyle(score),
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        {score}
      </button>
      {recommendation && (
        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[var(--text-primary)] text-white text-xs rounded-md whitespace-nowrap z-50 shadow-lg">
          {getRecommendationLabel(recommendation)}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary)]" />
        </div>
      )}
    </div>
  )
}

// Larger score display for slideout header
interface AIScoreDisplayProps {
  score: number
  recommendation: AIRecommendation
}

export function AIScoreDisplay({ score, recommendation }: AIScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRecommendationStyle = (rec: AIRecommendation) => {
    const styles: Record<AIRecommendation, string> = {
      'STRONG_YES': 'bg-emerald-100 text-emerald-700',
      'YES': 'bg-emerald-50 text-emerald-600',
      'MAYBE': 'bg-amber-50 text-amber-600',
      'LEAN_NO': 'bg-orange-50 text-orange-600',
      'NO': 'bg-red-50 text-red-600',
    }
    return styles[rec] || 'bg-gray-50 text-gray-600'
  }

  const getRecommendationLabel = (rec: AIRecommendation) => {
    const labels: Record<AIRecommendation, string> = {
      'STRONG_YES': 'Strong Yes',
      'YES': 'Yes',
      'MAYBE': 'Maybe',
      'LEAN_NO': 'Lean No',
      'NO': 'No',
    }
    return labels[rec] || rec
  }

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--background-subtle)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-4xl font-bold', getScoreColor(score))}>{score}</span>
        <span className={cn('px-3 py-1.5 rounded-full text-sm font-medium', getRecommendationStyle(recommendation))}>
          {getRecommendationLabel(recommendation)}
        </span>
      </div>
      <div className="h-2 bg-[var(--background-muted)] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getProgressColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
