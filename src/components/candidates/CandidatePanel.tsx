import { useState, useEffect, useCallback } from 'react'
import { format, isValid } from 'date-fns'
import {
  X,
  Mail,
  Phone,
  Copy,
  Archive,
  Trash2,
  Star,
  Calendar,
  ExternalLink,
  Instagram,
  Clock,
  FileText,
  MessageSquare,
  ClipboardList,
  Send,
  Upload,
  User,
  Activity,
  Video,
  File,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { AIScreeningTab } from './AIScreeningTab'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useCandidate,
  useUpdateCandidate,
  useAddNote,
  useArchiveCandidate,
  useDeleteCandidate,
  useScheduleInterview,
  useUpdateScorecard,
  useUpdateInterviewFeedback,
  useUploadTranscript,
  useAnalyzeTranscript,
} from '@/hooks/useCandidates'
import { useCandidateActivity } from '@/hooks/useActivity'
import { useAppStore } from '@/store'
import { STAGES, getDaysInPipeline, getInitials, type Stage, type Scorecard, type InterviewFeedback } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Safe date formatting helper
function safeFormatDate(dateStr: string | undefined | null, formatStr: string, fallback = '-'): string {
  if (!dateStr) return fallback
  try {
    const date = new Date(dateStr)
    if (!isValid(date)) return fallback
    return format(date, formatStr)
  } catch {
    return fallback
  }
}

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i + 1 === rating ? 0 : i + 1)}
          className={cn('transition-colors', !readonly && 'hover:scale-110 cursor-pointer')}
        >
          <Star className={cn('w-4 h-4', i < rating ? 'fill-[#635BFF] text-[#635BFF]' : 'text-[var(--border)]')} />
        </button>
      ))}
    </div>
  )
}

function ScorecardRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1 === value ? 0 : i + 1)}
            className={cn(
              'w-6 h-6 rounded text-xs font-medium transition-all hover:scale-105',
              i < value
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--background-muted)] text-[var(--text-muted)]'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CandidatePanel() {
  const { selectedCandidateId, setSelectedCandidateId } = useAppStore()
  const { data: candidate, isLoading } = useCandidate(selectedCandidateId)
  const { data: activities } = useCandidateActivity(selectedCandidateId)
  const updateCandidate = useUpdateCandidate()
  const addNote = useAddNote()
  const archiveCandidate = useArchiveCandidate()
  const deleteCandidate = useDeleteCandidate()
  const scheduleInterview = useScheduleInterview()
  const updateScorecard = useUpdateScorecard()
  const updateInterviewFeedback = useUpdateInterviewFeedback()
  const uploadTranscript = useUploadTranscript()
  const analyzeTranscript = useAnalyzeTranscript()

  const [newNote, setNewNote] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [scorecard, setScorecard] = useState<Scorecard>({})
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<string | null>(null)
  const [pastedTranscript, setPastedTranscript] = useState('')

  useEffect(() => {
    if (candidate?.scorecard) {
      setScorecard(candidate.scorecard)
    }
  }, [candidate?.scorecard])

  // Reset tab when opening new candidate
  useEffect(() => {
    if (selectedCandidateId) {
      setActiveTab('overview')
    }
  }, [selectedCandidateId])

  const handleClose = useCallback(() => setSelectedCandidateId(null), [setSelectedCandidateId])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCandidateId) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedCandidateId, handleClose])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const handleStageChange = (stage: Stage) => {
    if (!candidate) return
    updateCandidate.mutate({ id: candidate.id, updates: { stage } })
  }

  const handleRatingChange = (rating: number) => {
    if (!candidate) return
    updateCandidate.mutate({ id: candidate.id, updates: { rating } })
  }

  const handleAddNote = () => {
    if (!candidate || !newNote.trim()) return
    addNote.mutate({ id: candidate.id, note: newNote.trim(), candidateName: candidate.name })
    setNewNote('')
  }

  const handleArchive = () => {
    if (!candidate) return
    archiveCandidate.mutate({ id: candidate.id, archived: !candidate.archived })
  }

  const handleDelete = () => {
    if (!candidate) return
    deleteCandidate.mutate(candidate.id)
    handleClose()
  }

  const handleScheduleInterview = () => {
    if (!candidate || !interviewDate) return
    scheduleInterview.mutate({ id: candidate.id, interview_date: new Date(interviewDate).toISOString() })
    setInterviewDate('')
  }

  const handleScorecardChange = (key: keyof Scorecard, value: number) => {
    if (!candidate) return
    const updated = { ...scorecard, [key]: value }
    setScorecard(updated)
    updateScorecard.mutate({ id: candidate.id, scorecard: updated })
  }

  const handleFeedbackChange = (feedback: InterviewFeedback) => {
    if (!candidate) return
    updateInterviewFeedback.mutate({ id: candidate.id, feedback, candidateName: candidate.name })
  }

  const handlePasteTranscript = () => {
    if (!candidate || !pastedTranscript.trim()) return
    const blob = new Blob([pastedTranscript], { type: 'text/plain' })
    const file = new window.File([blob], `Transcript-${new Date().toISOString().slice(0, 10)}.txt`, { type: 'text/plain' })
    uploadTranscript.mutate({ id: candidate.id, file, candidateName: candidate.name })
    setPastedTranscript('')
  }

  const handleAnalyzeTranscript = (transcriptId: string) => {
    if (!candidate) return
    analyzeTranscript.mutate({ id: candidate.id, transcriptId, candidateName: candidate.name })
  }

  const isStreamer = candidate?.position?.toLowerCase().includes('streamer')

  return (
    <Dialog open={!!selectedCandidateId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-[1600px] w-[calc(100vw-48px)] h-[calc(100vh-48px)] p-0 overflow-auto flex flex-col"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Candidate Details</DialogTitle>
        </VisuallyHidden>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-[var(--background)]">
            <div className="w-8 h-8 border-2 border-[#635BFF] border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-sm text-[var(--text-muted)]">Loading candidate...</div>
          </div>
        ) : !candidate ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-[var(--background)]">
            <div className="text-sm text-[var(--text-muted)]">Candidate not found</div>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 text-sm bg-[var(--background-muted)] hover:bg-[var(--background-elevated)] rounded-md text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--background)]">
              {/* Close button */}
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-lg font-medium text-[var(--text-secondary)]">
                    {getInitials(candidate.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {candidate.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {candidate.position && (
                        <span className="text-sm text-[var(--text-muted)]">{candidate.position}</span>
                      )}
                      {candidate.email && (
                        <span className="text-sm text-[var(--text-muted)]">• {candidate.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-[var(--background-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rating & Stage Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StarRating rating={candidate.rating || 0} onChange={handleRatingChange} />
                  <span className="text-sm text-[var(--text-muted)]">
                    {getDaysInPipeline(candidate.created_at)} days in pipeline
                  </span>
                </div>
              </div>

              {/* Stage Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageChange(stage.id)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      candidate.stage === stage.id
                        ? `status-${stage.id}`
                        : 'bg-[var(--background-subtle)] text-[var(--text-muted)] hover:bg-[var(--background-muted)] hover:text-[var(--text-secondary)]'
                    )}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="px-8 pt-4 pb-0 justify-start bg-transparent border-b border-[var(--border)] rounded-none h-auto gap-6 overflow-x-auto flex-nowrap">
                <TabsTrigger
                  value="overview"
                  className="pb-3 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--accent)] rounded-none text-sm flex items-center gap-1.5 shrink-0"
                >
                  <User className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="pb-3 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--accent)] rounded-none text-sm flex items-center gap-1.5 shrink-0"
                >
                  <Activity className="w-4 h-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger
                  value="interview"
                  className="pb-3 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--accent)] rounded-none text-sm flex items-center gap-1.5 shrink-0"
                >
                  <Video className="w-4 h-4" />
                  Interview
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="pb-3 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--accent)] rounded-none text-sm flex items-center gap-1.5 shrink-0"
                >
                  <File className="w-4 h-4" />
                  Docs
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="pb-3 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--accent)] rounded-none text-sm flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  AI
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 overflow-auto">
                {/* Overview Tab */}
                <TabsContent value="overview" className="p-8 m-0 space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">Contact</h3>
                    {candidate.email && (
                      <button
                        onClick={() => handleCopy(candidate.email!, 'Email')}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] transition-colors text-left group"
                      >
                        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{candidate.email}</span>
                        <Copy className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                    {candidate.phone && (
                      <button
                        onClick={() => handleCopy(candidate.phone!, 'Phone')}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] transition-colors text-left group"
                      >
                        <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="flex-1 text-sm text-[var(--text-primary)]">{candidate.phone}</span>
                        <Copy className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                    {!candidate.email && !candidate.phone && (
                      <p className="text-sm text-[var(--text-muted)] py-2">No contact information</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-[var(--background-subtle)]">
                        <p className="text-xs text-[var(--text-muted)] mb-1">Source</p>
                        <p className="text-sm text-[var(--text-primary)] capitalize">{candidate.source || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--background-subtle)]">
                        <p className="text-xs text-[var(--text-muted)] mb-1">Added</p>
                        <p className="text-sm text-[var(--text-primary)]">{safeFormatDate(candidate.created_at, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Streamer Fields */}
                  {isStreamer && (candidate.whatnot_username || candidate.instagram_handle || candidate.tiktok_handle || candidate.experience || candidate.availability) && (
                    <div className="space-y-3">
                      <h3 className="text-label text-[var(--text-muted)]">Streaming</h3>
                      <div className="space-y-2">
                        {candidate.whatnot_username && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-subtle)]">
                            <span className="text-xs text-[var(--text-muted)] w-20">Whatnot</span>
                            <span className="text-sm text-[var(--text-primary)]">@{candidate.whatnot_username}</span>
                          </div>
                        )}
                        {candidate.instagram_handle && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-subtle)]">
                            <Instagram className="w-4 h-4 text-pink-500" />
                            <span className="text-sm text-[var(--text-primary)]">@{candidate.instagram_handle}</span>
                          </div>
                        )}
                        {candidate.tiktok_handle && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-subtle)]">
                            <span className="text-xs text-[var(--text-muted)] w-20">TikTok</span>
                            <span className="text-sm text-[var(--text-primary)]">@{candidate.tiktok_handle}</span>
                          </div>
                        )}
                        {candidate.experience && (
                          <div className="p-3 rounded-lg bg-[var(--background-subtle)]">
                            <p className="text-xs text-[var(--text-muted)] mb-1">Experience</p>
                            <p className="text-sm text-[var(--text-primary)]">{candidate.experience}</p>
                          </div>
                        )}
                        {candidate.availability && (
                          <div className="p-3 rounded-lg bg-[var(--background-subtle)]">
                            <p className="text-xs text-[var(--text-muted)] mb-1">Availability</p>
                            <p className="text-sm text-[var(--text-primary)]">{candidate.availability}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-label text-[var(--text-muted)]">Actions</h3>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={handleArchive} className="flex-1">
                        <Archive className="w-4 h-4 mr-2" />
                        {candidate.archived ? 'Restore' : 'Archive'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-red-50 border-red-200">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {candidate.name}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-[var(--destructive)] hover:bg-red-600">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="p-8 m-0 space-y-6">
                  {/* Add Note */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px] resize-none bg-[var(--background-subtle)] border-[var(--border)]"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addNote.isPending}
                      className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">Timeline</h3>
                    {candidate.notes.length === 0 && (!activities || activities.length === 0) ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--text-muted)]">No activity yet</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Add a note to start tracking</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...candidate.notes].reverse().map((note) => (
                          <div key={note.id} className="p-4 rounded-lg bg-[var(--background-muted)] border border-[var(--border)]">
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                              {safeFormatDate(note.created_at, 'MMM d, h:mm a')}
                            </p>
                          </div>
                        ))}
                        {activities?.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--background-muted)] flex items-center justify-center mt-0.5">
                              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                            </div>
                            <div>
                              <p className="text-sm text-[var(--text-secondary)]">
                                {activity.action.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {safeFormatDate(activity.created_at, 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Interview Tab */}
                <TabsContent value="interview" className="p-8 m-0 space-y-6">
                  {/* Scheduled Interview */}
                  {candidate.interview_date && (
                    <div className="p-4 rounded-lg bg-violet-50 border border-violet-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Interview Scheduled</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {safeFormatDate(candidate.interview_date, 'EEEE, MMMM d · h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interview Feedback */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">How did it go?</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedbackChange('good')}
                        disabled={updateInterviewFeedback.isPending}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          candidate.interview_feedback === 'good'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-[var(--border)] hover:border-emerald-300 hover:bg-emerald-50/50'
                        )}
                      >
                        <ThumbsUp className={cn(
                          'w-6 h-6',
                          candidate.interview_feedback === 'good' ? 'text-emerald-600' : 'text-[var(--text-muted)]'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          candidate.interview_feedback === 'good' ? 'text-emerald-700' : 'text-[var(--text-secondary)]'
                        )}>Good</span>
                      </button>
                      <button
                        onClick={() => handleFeedbackChange('meh')}
                        disabled={updateInterviewFeedback.isPending}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          candidate.interview_feedback === 'meh'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-[var(--border)] hover:border-amber-300 hover:bg-amber-50/50'
                        )}
                      >
                        <Meh className={cn(
                          'w-6 h-6',
                          candidate.interview_feedback === 'meh' ? 'text-amber-600' : 'text-[var(--text-muted)]'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          candidate.interview_feedback === 'meh' ? 'text-amber-700' : 'text-[var(--text-secondary)]'
                        )}>Meh</span>
                      </button>
                      <button
                        onClick={() => handleFeedbackChange('bad')}
                        disabled={updateInterviewFeedback.isPending}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          candidate.interview_feedback === 'bad'
                            ? 'border-red-500 bg-red-50'
                            : 'border-[var(--border)] hover:border-red-300 hover:bg-red-50/50'
                        )}
                      >
                        <ThumbsDown className={cn(
                          'w-6 h-6',
                          candidate.interview_feedback === 'bad' ? 'text-red-600' : 'text-[var(--text-muted)]'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          candidate.interview_feedback === 'bad' ? 'text-red-700' : 'text-[var(--text-secondary)]'
                        )}>Bad</span>
                      </button>
                    </div>
                  </div>

                  {/* Schedule Form */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">Schedule Interview</h3>
                    <Input
                      type="datetime-local"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="bg-[var(--background-subtle)] border-[var(--border)]"
                    />
                    <Button
                      size="sm"
                      onClick={handleScheduleInterview}
                      disabled={!interviewDate}
                      className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>

                  {/* Scorecard */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[var(--text-muted)]" />
                      <h3 className="text-label text-[var(--text-muted)]">Scorecard</h3>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--background-subtle)] space-y-1">
                      <ScorecardRating label="Communication" value={scorecard.communication || 0} onChange={(v) => handleScorecardChange('communication', v)} />
                      <ScorecardRating label="Energy" value={scorecard.energy || 0} onChange={(v) => handleScorecardChange('energy', v)} />
                      <ScorecardRating label="Product Knowledge" value={scorecard.product_knowledge || 0} onChange={(v) => handleScorecardChange('product_knowledge', v)} />
                      <ScorecardRating label="Tech Setup" value={scorecard.tech_setup || 0} onChange={(v) => handleScorecardChange('tech_setup', v)} />
                    </div>
                  </div>

                  {/* Interview Transcripts */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                      <h3 className="text-label text-[var(--text-muted)]">Interview Transcripts</h3>
                    </div>

                    {/* Paste Transcript */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Paste your Granola transcript here..."
                        value={pastedTranscript}
                        onChange={(e) => setPastedTranscript(e.target.value)}
                        className="min-h-[100px] resize-none bg-[var(--background-subtle)] border-[var(--border)] text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handlePasteTranscript}
                        disabled={!pastedTranscript.trim() || uploadTranscript.isPending}
                        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                      >
                        {uploadTranscript.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Save Transcript
                      </Button>
                    </div>

                    {/* Transcript List */}
                    {candidate.interview_transcripts && candidate.interview_transcripts.length > 0 && (
                      <div className="space-y-2">
                        {candidate.interview_transcripts.map((transcript) => (
                          <div key={transcript.id} className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <div
                              className="flex items-center gap-3 p-3 bg-[var(--background-subtle)] cursor-pointer hover:bg-[var(--background-muted)] transition-colors"
                              onClick={() => setExpandedTranscriptId(
                                expandedTranscriptId === transcript.id ? null : transcript.id
                              )}
                            >
                              <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{transcript.filename}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  {safeFormatDate(transcript.uploaded_at, 'MMM d, h:mm a')}
                                </p>
                              </div>
                              {transcript.ai_analysis ? (
                                <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded">
                                  Analyzed
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAnalyzeTranscript(transcript.id)
                                  }}
                                  disabled={analyzeTranscript.isPending}
                                  className="h-7 text-xs"
                                >
                                  {analyzeTranscript.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Analyze
                                    </>
                                  )}
                                </Button>
                              )}
                              {expandedTranscriptId === transcript.id ? (
                                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                              )}
                            </div>

                            {expandedTranscriptId === transcript.id && (
                              <div className="p-4 border-t border-[var(--border)] space-y-4">
                                {transcript.ai_analysis ? (
                                  <>
                                    <div>
                                      <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Summary</h4>
                                      <p className="text-sm text-[var(--text-primary)]">{transcript.ai_analysis.summary}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Key Points</h4>
                                      <ul className="space-y-1">
                                        {transcript.ai_analysis.key_points.map((point, i) => (
                                          <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                            <span className="text-[var(--text-muted)]">•</span>
                                            {point}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">Strengths</h4>
                                        <ul className="space-y-1">
                                          {transcript.ai_analysis.strengths.map((s, i) => (
                                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                              <span className="text-emerald-500">+</span>
                                              {s}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">Concerns</h4>
                                        <ul className="space-y-1">
                                          {transcript.ai_analysis.concerns.map((c, i) => (
                                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                              <span className="text-red-500">-</span>
                                              {c}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[var(--background-muted)]">
                                      <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">Recommendation</h4>
                                      <p className="text-sm text-[var(--text-primary)]">{transcript.ai_analysis.recommendation}</p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-sm text-[var(--text-muted)]">Click "Analyze" to get AI insights on this transcript</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="p-8 m-0 space-y-6">
                  {/* Resume */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">Resume</h3>
                    {candidate.resume_url ? (
                      <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg bg-[var(--background-subtle)] hover:bg-[var(--background-muted)] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">Resume.pdf</p>
                          <p className="text-xs text-[var(--text-muted)]">Click to view</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                      </a>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed border-[var(--border)] text-center">
                        <Upload className="w-8 h-8 text-[var(--text-muted)] mb-3" />
                        <p className="text-sm text-[var(--text-muted)]">No resume uploaded</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Drag and drop or click to upload</p>
                      </div>
                    )}
                  </div>

                  {/* Other Documents */}
                  <div className="space-y-3">
                    <h3 className="text-label text-[var(--text-muted)]">Other Documents</h3>
                    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed border-[var(--border)] text-center">
                      <File className="w-8 h-8 text-[var(--text-muted)] mb-3" />
                      <p className="text-sm text-[var(--text-muted)]">No additional documents</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* AI Screening Tab */}
                <TabsContent value="ai" className="p-8 m-0">
                  <AIScreeningTab
                    aiAnalysis={candidate.ai_analysis}
                    screeningAnswers={candidate.screening_answers}
                    aiScreenedAt={candidate.ai_screened_at}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
