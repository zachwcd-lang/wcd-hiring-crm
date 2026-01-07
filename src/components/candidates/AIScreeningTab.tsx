import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Lightbulb, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { AIAnalysis, ScreeningAnswers } from '@/types'

interface AIScreeningTabProps {
  aiAnalysis: AIAnalysis | null
  screeningAnswers: ScreeningAnswers | null
  aiScreenedAt: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  location: 'Location',
  availability: 'Availability',
  streaming_experience: 'Streaming Experience',
  product_knowledge: 'Product Knowledge',
  social_presence: 'Social Presence',
  sales_experience: 'Sales Experience',
  culture_fit: 'Culture Fit',
}

const ANSWER_LABELS: Record<keyof ScreeningAnswers, string> = {
  distance_from_97210: 'Distance from 97210',
  availability: 'Availability',
  streaming_experience: 'Streaming Experience',
  product_knowledge: 'Product Knowledge',
  social_links: 'Social Links',
  age: 'Age',
  gender: 'Gender',
  sales_experience: 'Sales Experience',
  why_wcd: 'Why West Coast Deals?',
}

function ScoreBar({ score, maxScore, label, note }: { score: number; maxScore: number; label: string; note: string }) {
  const percentage = (score / maxScore) * 100

  const getBarColor = (pct: number) => {
    if (pct >= 70) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {note && (
        <p className="text-xs text-slate-500">{note}</p>
      )}
    </div>
  )
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: number
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
        <span className="text-sm font-medium text-slate-700">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-600">
            {badge}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

export function AIScreeningTab({ aiAnalysis, screeningAnswers, aiScreenedAt }: AIScreeningTabProps) {
  if (!aiAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No AI screening data</p>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          AI screening will be performed when candidate applies via form
        </p>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getRecommendationStyle = (rec: string) => {
    const styles: Record<string, string> = {
      'STRONG_YES': 'bg-emerald-100 text-emerald-700',
      'YES': 'bg-emerald-50 text-emerald-700',
      'MAYBE': 'bg-amber-50 text-amber-700',
      'LEAN_NO': 'bg-orange-50 text-orange-700',
      'NO': 'bg-red-50 text-red-700',
    }
    return styles[rec] || 'bg-slate-50 text-slate-700'
  }

  const getRecommendationLabel = (rec: string) => {
    const labels: Record<string, string> = {
      'STRONG_YES': 'STRONG YES',
      'YES': 'YES',
      'MAYBE': 'MAYBE',
      'LEAN_NO': 'LEAN NO',
      'NO': 'NO',
    }
    return labels[rec] || rec
  }

  return (
    <div className="space-y-5">
      {/* Main Score Display */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <span className={cn('text-5xl font-bold tabular-nums', getScoreColor(aiAnalysis.score))}>
            {aiAnalysis.score}
          </span>
          <span className={cn('px-3 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide', getRecommendationStyle(aiAnalysis.recommendation))}>
            {getRecommendationLabel(aiAnalysis.recommendation)}
          </span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getScoreBg(aiAnalysis.score))}
            style={{ width: `${aiAnalysis.score}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Summary
        </h4>
        <p className="text-sm text-slate-700 leading-relaxed">
          {aiAnalysis.summary}
        </p>
      </div>

      {/* Score Breakdown */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Breakdown
        </h4>
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          {Object.entries(aiAnalysis.breakdown).map(([key, data]) => (
            <ScoreBar
              key={key}
              score={data.score}
              maxScore={key === 'streaming_experience' ? 15 : 20}
              label={CATEGORY_LABELS[key] || key}
              note={data.note}
            />
          ))}
        </div>
      </div>

      {/* Green Flags */}
      {aiAnalysis.green_flags.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Green Flags
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.green_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 mt-0.5">•</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Red Flags */}
      {aiAnalysis.red_flags.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Watch For
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.red_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-amber-500 mt-0.5">•</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Questions */}
      {aiAnalysis.suggested_questions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            Questions to Ask
          </h4>
          <ul className="space-y-2">
            {aiAnalysis.suggested_questions.map((question, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-slate-600 font-medium">{i + 1}.</span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Screening Answers */}
      {screeningAnswers && Object.keys(screeningAnswers).length > 0 && (
        <CollapsibleSection title="Their Screening Answers">
          <dl className="space-y-3">
            {Object.entries(screeningAnswers).map(([key, value]) => {
              if (!value) return null
              const label = ANSWER_LABELS[key as keyof ScreeningAnswers] || key
              return (
                <div key={key}>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {value}
                  </dd>
                </div>
              )
            })}
          </dl>
        </CollapsibleSection>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        {aiScreenedAt && (
          <p className="text-xs text-slate-400">
            Screened {formatDate(aiScreenedAt)}
          </p>
        )}
        <Button variant="outline" size="sm" className="text-xs h-7">
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Re-screen
        </Button>
      </div>
    </div>
  )
}
