export type Stage = 'new' | 'phone_screen' | 'interview' | 'offer' | 'hired' | 'rejected'

export type Position = 'Streamer' | 'Streamer (Part-time)' | 'Warehouse' | 'Operations' | 'Other'

export type Source = 'calendly' | 'referral' | 'indeed' | 'linkedin' | 'website' | 'manual' | 'other'

export type PositionStatus = 'open' | 'closed' | 'paused'

export interface Note {
  id: string
  content: string
  created_at: string
  author?: string
}

export interface Scorecard {
  communication?: number
  energy?: number
  product_knowledge?: number
  tech_setup?: number
  overall_notes?: string
}

// AI Screening Types
export type AIRecommendation = 'STRONG_YES' | 'YES' | 'MAYBE' | 'LEAN_NO' | 'NO'

export interface AIScoreBreakdown {
  location: { score: number; note: string }
  availability: { score: number; note: string }
  streaming_experience: { score: number; note: string }
  product_knowledge: { score: number; note: string }
  social_presence: { score: number; note: string }
  sales_experience: { score: number; note: string }
  culture_fit: { score: number; note: string }
}

export interface AIAnalysis {
  score: number
  breakdown: AIScoreBreakdown
  red_flags: string[]
  green_flags: string[]
  recommendation: AIRecommendation
  summary: string
  suggested_questions: string[]
}

export interface ScreeningAnswers {
  distance_from_97210?: string
  availability?: string
  streaming_experience?: string
  product_knowledge?: string
  social_links?: string
  age?: string
  gender?: string
  sales_experience?: string
  why_wcd?: string
  // Allow any additional Calendly fields
  [key: string]: string | undefined
}

export interface CriterionConfig {
  weight: number
  description: string
}

export interface ScreeningCriteria {
  id: string
  created_at: string
  updated_at: string
  name: string
  criteria: Record<string, CriterionConfig>
  prompt_template: string
  is_active: boolean
}

export interface Candidate {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string | null
  phone: string | null
  position: Position | null
  stage: Stage
  source: Source | null
  rating: number | null
  resume_url: string | null
  notes: Note[]
  calendly_event_id: string | null
  stage_changed_at: string
  // New fields
  whatnot_username: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  availability: string | null
  experience: string | null
  archived: boolean
  interview_date: string | null
  scorecard: Scorecard | null
  // AI Screening fields
  ai_score: number | null
  ai_analysis: AIAnalysis | null
  screening_answers: ScreeningAnswers | null
  ai_screened_at: string | null
}

export interface PositionRecord {
  id: string
  created_at: string
  title: string
  type: string | null
  description: string | null
  requirements: string | null
  status: PositionStatus
}

export interface EmailTemplate {
  id: string
  created_at: string
  name: string
  subject: string | null
  body: string | null
}

export interface ActivityLog {
  id: string
  created_at: string
  candidate_id: string | null
  action: string
  details: Record<string, unknown> | null
  candidate?: Candidate
}

export interface StageInfo {
  id: Stage
  label: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

export const STAGES: StageInfo[] = [
  { id: 'new', label: 'New', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200', textColor: 'slate' },
  { id: 'phone_screen', label: 'Phone Screen', color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', textColor: 'sky' },
  { id: 'interview', label: 'Interview', color: 'text-violet-700', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', textColor: 'violet' },
  { id: 'offer', label: 'Offer', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'amber' },
  { id: 'hired', label: 'Hired', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'emerald' },
  { id: 'rejected', label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'red' },
]

export const PIPELINE_STAGES = STAGES.filter(s => s.id !== 'rejected')

export const POSITIONS: Position[] = ['Streamer', 'Streamer (Part-time)', 'Warehouse', 'Operations', 'Other']

export const SOURCES: { value: Source; label: string }[] = [
  { value: 'calendly', label: 'Calendly' },
  { value: 'referral', label: 'Referral' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
]

export function getStageInfo(stage: Stage): StageInfo {
  return STAGES.find(s => s.id === stage) || STAGES[0]
}

export function getDaysInStage(stageChangedAt: string): number {
  const changed = new Date(stageChangedAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - changed.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export function getDaysInPipeline(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
