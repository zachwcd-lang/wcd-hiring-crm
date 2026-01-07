import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  X,
  Sparkles,
  Zap,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Mail,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react'
import { useCandidate, useUpdateCandidateStage } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { STAGES, getInitials, type Stage, type AIRecommendation } from '@/types'
import { cn } from '@/lib/utils'

// Vibe score card component
function VibeCard({
  label,
  score,
  note,
  icon: Icon,
}: {
  label: string
  score: number
  note: string
  icon: React.ElementType
}) {
  const getScoreColor = (s: number) => {
    if (s >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    if (s >= 6) return 'text-blue-600 bg-blue-50 border-blue-100'
    if (s >= 4) return 'text-amber-600 bg-amber-50 border-amber-100'
    return 'text-red-600 bg-red-50 border-red-100'
  }

  return (
    <div className="p-4 rounded-xl bg-white border border-[var(--border)] hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        </div>
        <span className={cn(
          'px-2 py-0.5 text-xs font-semibold rounded-full border',
          getScoreColor(score)
        )}>
          {score}/10
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{note}</p>
    </div>
  )
}

// Recommendation badge
function RecommendationBadge({ recommendation }: { recommendation: AIRecommendation }) {
  const config: Record<AIRecommendation, { label: string; color: string }> = {
    STRONG_YES: { label: 'Strong Yes', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    YES: { label: 'Yes', color: 'bg-green-100 text-green-700 border-green-200' },
    MAYBE: { label: 'Maybe', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    LEAN_NO: { label: 'Lean No', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    NO: { label: 'No', color: 'bg-red-100 text-red-700 border-red-200' },
  }

  const { label, color } = config[recommendation] || config.MAYBE

  return (
    <span className={cn('px-3 py-1 text-sm font-medium rounded-full border', color)}>
      {label}
    </span>
  )
}

// Stage pill
function StagePill({ stage }: { stage: Stage }) {
  const stageConfig = STAGES.find(s => s.id === stage)
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full',
      `status-${stage}`
    )}>
      {stageConfig?.label || stage}
    </span>
  )
}

export function RapidReviewDrawer() {
  const { selectedCandidateId, setSelectedCandidateId } = useAppStore()
  const { data: candidate, isLoading } = useCandidate(selectedCandidateId)
  const updateStage = useUpdateCandidateStage()

  const handleClose = () => setSelectedCandidateId(null)

  const handleAdvance = () => {
    if (!candidate) return
    const stages: Stage[] = ['new', 'phone_screen', 'interview', 'offer', 'hired']
    const currentIndex = stages.indexOf(candidate.stage)
    if (currentIndex < stages.length - 1) {
      updateStage.mutate({
        id: candidate.id,
        stage: stages[currentIndex + 1],
        candidateName: candidate.name,
      })
    }
  }

  const handleReject = () => {
    if (!candidate) return
    updateStage.mutate({
      id: candidate.id,
      stage: 'rejected',
      candidateName: candidate.name,
    })
    handleClose()
  }

  const safeFormat = (date: string | null, formatStr: string) => {
    if (!date) return 'N/A'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return 'N/A'
      return format(d, formatStr)
    } catch {
      return 'N/A'
    }
  }

  return (
    <AnimatePresence>
      {selectedCandidateId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 slideout-backdrop"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[600px] z-50 bg-[var(--background)] border-l border-[var(--border)] shadow-xl overflow-hidden flex flex-col"
          >
            {isLoading || !candidate ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-5 border-b border-[var(--border)] glass-heavy">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border border-[var(--border)] flex items-center justify-center text-lg font-semibold text-[var(--text-secondary)]">
                        {getInitials(candidate.name)}
                      </div>
                      <div>
                        <h2 className="text-title text-[var(--text-primary)]">{candidate.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <StagePill stage={candidate.stage} />
                          {candidate.position && (
                            <span className="text-small text-[var(--text-muted)]">
                              {candidate.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Quick Info Row */}
                  <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
                    {candidate.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="font-mono">{candidate.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Applied {safeFormat(candidate.created_at, 'MMM d, yyyy')}</span>
                    </div>
                    {candidate.screening_answers?.distance_from_97210 && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{candidate.screening_answers.distance_from_97210}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* AI Vibe Summary */}
                  {candidate.ai_analysis ? (
                    <>
                      {/* Vibe Header */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--accent-blue-light)] to-white border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[var(--accent-blue)]" strokeWidth={1.5} />
                            <span className="text-sm font-semibold text-[var(--text-primary)]">AI Vibe Check</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-[var(--accent-blue)]">
                              {candidate.ai_score || candidate.ai_analysis.score}%
                            </span>
                            <RecommendationBadge recommendation={candidate.ai_analysis.recommendation} />
                          </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {candidate.ai_analysis.summary}
                        </p>
                      </div>

                      {/* Vibe Scorecard Grid */}
                      <div>
                        <h3 className="text-label mb-3">Vibe Scorecard</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <VibeCard
                            label="Availability"
                            score={candidate.ai_analysis.breakdown.availability.score}
                            note={candidate.ai_analysis.breakdown.availability.note}
                            icon={Clock}
                          />
                          <VibeCard
                            label="Streaming XP"
                            score={candidate.ai_analysis.breakdown.streaming_experience.score}
                            note={candidate.ai_analysis.breakdown.streaming_experience.note}
                            icon={Zap}
                          />
                          <VibeCard
                            label="Product Knowledge"
                            score={candidate.ai_analysis.breakdown.product_knowledge.score}
                            note={candidate.ai_analysis.breakdown.product_knowledge.note}
                            icon={Target}
                          />
                          <VibeCard
                            label="Culture Fit"
                            score={candidate.ai_analysis.breakdown.culture_fit.score}
                            note={candidate.ai_analysis.breakdown.culture_fit.note}
                            icon={Users}
                          />
                        </div>
                      </div>

                      {/* Flags */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Green Flags */}
                        {candidate.ai_analysis.green_flags.length > 0 && (
                          <div>
                            <h3 className="text-label mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                              Green Flags
                            </h3>
                            <ul className="space-y-1.5">
                              {candidate.ai_analysis.green_flags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                  {flag}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Red Flags */}
                        {candidate.ai_analysis.red_flags.length > 0 && (
                          <div>
                            <h3 className="text-label mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
                              Red Flags
                            </h3>
                            <ul className="space-y-1.5">
                              {candidate.ai_analysis.red_flags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                  {flag}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Suggested Questions */}
                      {candidate.ai_analysis.suggested_questions.length > 0 && (
                        <div>
                          <h3 className="text-label mb-2">Suggested Questions</h3>
                          <ul className="space-y-2">
                            {candidate.ai_analysis.suggested_questions.map((q, i) => (
                              <li key={i} className="p-3 rounded-lg bg-slate-50 text-xs text-[var(--text-secondary)]">
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    /* No AI Analysis */
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue-light)] flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-[var(--accent-blue)]" strokeWidth={1.5} />
                      </div>
                      <p className="text-[var(--text-secondary)] font-medium">No AI screening yet</p>
                      <p className="text-small text-[var(--text-muted)] mt-1">
                        This candidate hasn't been screened by AI
                      </p>
                      <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:bg-[var(--accent-blue-hover)] transition-all">
                        <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                        Run AI Screening
                      </button>
                    </div>
                  )}

                  {/* Screening Answers */}
                  {candidate.screening_answers && Object.keys(candidate.screening_answers).length > 0 && (
                    <div>
                      <h3 className="text-label mb-3">Screening Answers</h3>
                      <div className="space-y-3">
                        {Object.entries(candidate.screening_answers)
                          .filter(([_, value]) => value && value.trim() !== '')
                          .map(([key, value]) => {
                            // Format the key into a readable label
                            const labelMap: Record<string, string> = {
                              distance_from_97210: 'Distance from Portland',
                              availability: 'Availability',
                              streaming_experience: 'Streaming Experience',
                              product_knowledge: 'Product Knowledge',
                              social_links: 'Social Media Links',
                              age: 'Age',
                              gender: 'Gender',
                              sales_experience: 'Sales Experience',
                              why_wcd: 'Why WCD?',
                            }
                            const label = labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

                            return (
                              <div key={key} className="p-3 rounded-lg bg-slate-50">
                                <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                                  {value}
                                </p>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {candidate.notes && candidate.notes.length > 0 && (
                    <div>
                      <h3 className="text-label mb-3">Notes</h3>
                      <div className="space-y-2">
                        {candidate.notes.map((note) => (
                          <div key={note.id} className="p-3 rounded-lg bg-slate-50">
                            <p className="text-sm text-[var(--text-secondary)]">{note.content}</p>
                            <span className="text-xs text-[var(--text-muted)] mt-2 block">
                              {safeFormat(note.created_at, 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-[var(--border)] glass-heavy">
                  <div className="flex items-center justify-between">
                    {/* Kill Switch */}
                    <button
                      onClick={handleReject}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
                        'bg-red-50 text-red-600 border border-red-100',
                        'hover:bg-red-100 hover:border-red-200'
                      )}
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                      Reject & Send AI Ghost Email
                    </button>

                    {/* Advance */}
                    <button
                      onClick={handleAdvance}
                      disabled={candidate.stage === 'hired' || candidate.stage === 'rejected'}
                      className={cn(
                        'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all',
                        'bg-[var(--accent-blue)] text-white',
                        'hover:bg-[var(--accent-blue-hover)] hover:shadow-md',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      Advance to Next Stage
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
