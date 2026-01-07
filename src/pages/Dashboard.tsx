import { useMemo } from 'react'
import { format, startOfWeek, endOfWeek, isWithinInterval, differenceInDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  UserPlus,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCandidates } from '@/hooks/useCandidates'
import { useActivity } from '@/hooks/useActivity'
import { useAppStore } from '@/store'
import { STAGES, getInitials } from '@/types'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const navigate = useNavigate()
  const { setIsAddModalOpen, setSelectedCandidateId } = useAppStore()
  const { data: candidates, isLoading: candidatesLoading } = useCandidates()
  const { data: activities, isLoading: activitiesLoading } = useActivity(10)

  const stats = useMemo(() => {
    if (!candidates) return null

    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const activeCandidates = candidates.filter(c => !['hired', 'rejected'].includes(c.stage))
    const interviewsThisWeek = candidates.filter(c => {
      if (!c.interview_date) return false
      const interviewDate = new Date(c.interview_date)
      return isWithinInterval(interviewDate, { start: weekStart, end: weekEnd })
    })
    const hiredCandidates = candidates.filter(c => c.stage === 'hired')
    const avgDaysToHire = hiredCandidates.length > 0
      ? Math.round(hiredCandidates.reduce((acc, c) => {
          return acc + differenceInDays(new Date(c.stage_changed_at), new Date(c.created_at))
        }, 0) / hiredCandidates.length)
      : 0
    const addedThisMonth = candidates.filter(c => new Date(c.created_at) >= monthStart)

    return {
      activeCandidates: activeCandidates.length,
      interviewsThisWeek: interviewsThisWeek.length,
      avgDaysToHire,
      addedThisMonth: addedThisMonth.length,
    }
  }, [candidates])

  const upcomingInterviews = useMemo(() => {
    if (!candidates) return []
    const now = new Date()
    return candidates
      .filter(c => c.interview_date && new Date(c.interview_date) >= now)
      .sort((a, b) => new Date(a.interview_date!).getTime() - new Date(b.interview_date!).getTime())
      .slice(0, 5)
  }, [candidates])

  const pipelineOverview = useMemo(() => {
    if (!candidates) return []
    return STAGES.filter(s => s.id !== 'rejected').map(stage => ({
      ...stage,
      count: candidates.filter(c => c.stage === stage.id).length,
    }))
  }, [candidates])

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'candidate_created': return <UserPlus className="w-4 h-4 text-emerald-500" />
      case 'stage_changed': return <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
      case 'note_added': return <MessageSquare className="w-4 h-4 text-amber-500" />
      case 'interview_scheduled': return <Calendar className="w-4 h-4 text-violet-500" />
      default: return <Clock className="w-4 h-4 text-[var(--text-muted)]" />
    }
  }

  const getActivityText = (action: string, details: Record<string, unknown> | null) => {
    switch (action) {
      case 'candidate_created':
        return `${details?.name || 'New candidate'} was added`
      case 'stage_changed':
        return `${details?.name || 'Candidate'} moved to ${String(details?.stage || '').replace('_', ' ')}`
      case 'note_added':
        return `Note added for ${details?.name || 'candidate'}`
      case 'interview_scheduled':
        return `Interview scheduled`
      default:
        return action.replace('_', ' ')
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Page Header */}
      <div className="border-b border-[var(--border)] px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-section-title text-[var(--text-primary)]">{getGreeting()}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {candidatesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <div className="h-4 w-24 bg-[var(--background-muted)] rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-[var(--background-muted)] rounded animate-pulse" />
              </div>
            ))
          ) : (
            <>
              <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Active Candidates</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats?.activeCandidates}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                    <Users className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Interviews This Week</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats?.interviewsThisWeek}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Avg. Days to Hire</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats?.avgDaysToHire || '-'}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Added This Month</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats?.addedThisMonth}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Overview */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-subhead text-[var(--text-primary)]">Pipeline Overview</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/pipeline')} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                View Pipeline <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {pipelineOverview.map((stage) => (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-[var(--text-secondary)]">{stage.label}</div>
                  <div className="flex-1 h-8 bg-[var(--background-muted)] rounded-lg overflow-hidden">
                    <div
                      className={cn('h-full rounded-lg transition-all duration-500', stage.bgColor)}
                      style={{
                        width: `${Math.max((stage.count / Math.max(candidates?.length || 1, 1)) * 100, stage.count > 0 ? 5 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="w-8 text-right font-semibold text-[var(--text-primary)] tabular-nums">{stage.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-subhead text-[var(--text-primary)]">Upcoming Interviews</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                Calendar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">No upcoming interviews</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Schedule interviews from candidate profiles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingInterviews.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-subtle)] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
                      {getInitials(candidate.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{candidate.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {format(new Date(candidate.interview_date!), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {candidate.position && (
                      <span className="text-xs text-[var(--text-muted)] shrink-0">
                        {candidate.position}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 p-5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
          <h2 className="text-subhead text-[var(--text-primary)] mb-4">Recent Activity</h2>
          {activitiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--background-muted)] animate-pulse" />
                  <div className="flex-1 h-4 bg-[var(--background-muted)] rounded animate-pulse" />
                  <div className="h-4 w-20 bg-[var(--background-muted)] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : activities?.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-muted)]">No recent activity</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Activity will appear here as you work</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities?.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--background-subtle)] flex items-center justify-center">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {getActivityText(activity.action, activity.details)}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0 tabular-nums">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors">
              <UserPlus className="w-6 h-6 text-[var(--accent)] group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Add Candidate</p>
              <p className="text-xs text-[var(--text-muted)]">Add a new candidate to the pipeline</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/pipeline')}
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
              <Users className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">View Pipeline</p>
              <p className="text-xs text-[var(--text-muted)]">Manage your hiring pipeline</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/positions')}
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
              <Briefcase className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Job Postings</p>
              <p className="text-xs text-[var(--text-muted)]">Manage open positions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
