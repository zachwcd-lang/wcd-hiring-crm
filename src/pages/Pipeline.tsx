import { useMemo, useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Table2,
  ChevronDown,
  Check,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { AIScoreBadge } from '@/components/candidates/AIScoreBadge'
import { useCandidates, useUpdateCandidateStage } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import {
  PIPELINE_STAGES,
  STAGES,
  POSITIONS,
  SOURCES,
  getInitials,
  getDaysInStage,
  getStageInfo,
  type Candidate,
  type Stage,
} from '@/types'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'list' | 'kanban'
type SortField = 'name' | 'position' | 'stage' | 'rating' | 'created_at' | 'interview_date' | 'stage_changed_at'
type SortDirection = 'asc' | 'desc'

// Kanban card component
function CandidateCard({ candidate, isDragging = false }: { candidate: Candidate; isDragging?: boolean }) {
  const { setSelectedCandidateId } = useAppStore()
  const daysInStage = getDaysInStage(candidate.stage_changed_at)

  return (
    <div
      onClick={() => !isDragging && setSelectedCandidateId(candidate.id)}
      className={cn(
        'p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer',
        'hover:border-[var(--border-subtle)] hover:shadow-sm transition-all',
        isDragging && 'shadow-lg rotate-1 scale-105 opacity-90'
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
          {getInitials(candidate.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{candidate.name}</p>
          {candidate.position && (
            <p className="text-xs text-[var(--text-muted)]">{candidate.position}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--text-muted)]">
          {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
        </span>
        {candidate.rating && candidate.rating > 0 && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: candidate.rating }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Inline stage selector component
function InlineStageSelect({
  candidate,
  onStageChange
}: {
  candidate: Candidate
  onStageChange: (stage: Stage) => void
}) {
  const stageInfo = getStageInfo(candidate.stage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
            'hover:opacity-80',
            `status-${candidate.stage}`
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {stageInfo.label}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {STAGES.map((stage) => (
          <DropdownMenuItem
            key={stage.id}
            onClick={() => onStageChange(stage.id)}
            className="text-xs"
          >
            <div className={cn('w-2 h-2 rounded-full mr-2', stage.bgColor)} />
            {stage.label}
            {stage.id === candidate.stage && (
              <Check className="w-3 h-3 ml-auto text-[var(--accent)]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Pipeline() {
  const { data: candidates, isLoading } = useCandidates()
  const updateStage = useUpdateCandidateStage()
  const {
    searchQuery,
    setSearchQuery,
    positionFilter,
    setPositionFilter,
    sourceFilter,
    setSourceFilter,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    setSelectedCandidateId,
    setIsAddModalOpen,
  } = useAppStore()

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filteredCandidates = useMemo(() => {
    if (!candidates) return []

    return candidates.filter((candidate) => {
      if (candidate.archived) return false

      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        if (!candidate.name.toLowerCase().includes(search) &&
            !candidate.email?.toLowerCase().includes(search)) {
          return false
        }
      }

      if (positionFilter !== 'all' && candidate.position !== positionFilter) return false
      if (sourceFilter !== 'all' && candidate.source !== sourceFilter) return false
      if (stageFilter !== 'all' && candidate.stage !== stageFilter) return false

      return true
    })
  }, [candidates, searchQuery, positionFilter, sourceFilter, stageFilter])

  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'position':
          aVal = a.position?.toLowerCase() || ''
          bVal = b.position?.toLowerCase() || ''
          break
        case 'stage':
          aVal = STAGES.findIndex(s => s.id === a.stage)
          bVal = STAGES.findIndex(s => s.id === b.stage)
          break
        case 'rating':
          aVal = a.rating || 0
          bVal = b.rating || 0
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'interview_date':
          aVal = a.interview_date ? new Date(a.interview_date).getTime() : 0
          bVal = b.interview_date ? new Date(b.interview_date).getTime() : 0
          break
        case 'stage_changed_at':
          aVal = new Date(a.stage_changed_at).getTime()
          bVal = new Date(b.stage_changed_at).getTime()
          break
      }

      if (aVal === null || bVal === null) return 0
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredCandidates, sortField, sortDirection])

  const candidatesByStage = useMemo(() => {
    const grouped: Record<Stage, Candidate[]> = {
      new: [],
      phone_screen: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    }

    sortedCandidates.forEach((candidate) => {
      if (grouped[candidate.stage]) {
        grouped[candidate.stage].push(candidate)
      }
    })

    return grouped
  }, [sortedCandidates])

  // Keyboard navigation (J/K to navigate, Enter to open)
  const handleKeyboardNavigation = useCallback((e: KeyboardEvent) => {
    if (viewMode === 'kanban') return
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => Math.min(prev + 1, sortedCandidates.length - 1))
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault()
      const candidate = sortedCandidates[focusedIndex]
      if (candidate) setSelectedCandidateId(candidate.id)
    } else if (e.key === 'Escape') {
      setFocusedIndex(-1)
    }
  }, [viewMode, sortedCandidates, focusedIndex, setSelectedCandidateId])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardNavigation)
    return () => document.removeEventListener('keydown', handleKeyboardNavigation)
  }, [handleKeyboardNavigation])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === sortedCandidates.length) {
      clearSelection()
    } else {
      selectAll(sortedCandidates.map(c => c.id))
    }
  }

  const handleStageChange = (candidateId: string, stage: Stage, candidateName?: string) => {
    updateStage.mutate({ id: candidateId, stage, candidateName })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const candidate = candidates?.find(c => c.id === event.active.id)
    if (candidate) setActiveCandidate(candidate)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCandidate(null)
    const { active, over } = event
    if (!over) return

    const candidateId = active.id as string
    const candidate = candidates?.find(c => c.id === candidateId)
    if (!candidate) return

    let targetStage: Stage | null = null
    if (over.data.current?.type === 'column') {
      targetStage = over.data.current.stage as Stage
    } else if (over.data.current?.type === 'candidate') {
      const overCandidate = over.data.current.candidate as Candidate
      targetStage = overCandidate.stage
    }

    if (targetStage && targetStage !== candidate.stage) {
      updateStage.mutate({ id: candidateId, stage: targetStage, candidateName: candidate.name })
    }
  }

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1d ago'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return format(date, 'MMM d')
  }

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors',
        sortField === field && 'text-[var(--text-secondary)]',
        className
      )}
    >
      {children}
      {sortField === field && (
        <span className="text-[#635BFF]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  )

  // List view item component
  const ListItem = ({ candidate, index }: { candidate: Candidate; index: number }) => {
    const daysInStage = getDaysInStage(candidate.stage_changed_at)
    const isFocused = focusedIndex === index

    return (
      <div
        onClick={() => setSelectedCandidateId(candidate.id)}
        className={cn(
          'flex items-center gap-4 px-4 py-3 border-b border-[var(--border-subtle)] cursor-pointer transition-colors',
          'hover:bg-[var(--background-subtle)]',
          isFocused && 'bg-[var(--accent-subtle)] border-l-2 border-l-[var(--accent)]'
        )}
      >
        {/* Checkbox */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(candidate.id)}
            onCheckedChange={() => toggleSelection(candidate.id)}
          />
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] shrink-0">
            {getInitials(candidate.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{candidate.name}</p>
            {candidate.email && (
              <p className="text-xs text-[var(--text-muted)] truncate">{candidate.email}</p>
            )}
          </div>
        </div>

        {/* Metadata on right */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Position */}
          {candidate.position && (
            <span className="text-xs text-[var(--text-secondary)] w-20 text-right">{candidate.position}</span>
          )}

          {/* Stage */}
          <div onClick={(e) => e.stopPropagation()}>
            <InlineStageSelect
              candidate={candidate}
              onStageChange={(stage) => handleStageChange(candidate.id, stage, candidate.name)}
            />
          </div>

          {/* Days */}
          <span className="text-xs text-[var(--text-muted)] w-12 text-right tabular-nums">
            {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
          </span>

          {/* Rating */}
          <div className="flex items-center gap-0.5 w-16 justify-end">
            {candidate.rating && candidate.rating > 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    i < candidate.rating! ? 'bg-[#635BFF]' : 'bg-[var(--border)]'
                  )}
                />
              ))
            ) : (
              <span className="text-xs text-[var(--text-muted)]">-</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Page Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-page-title text-[var(--text-primary)]">Pipeline</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {sortedCandidates.length} candidate{sortedCandidates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#635BFF] rounded-lg hover:bg-[#7C75FF] transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-[var(--background-subtle)] border-[var(--border)] focus:border-[var(--accent)] focus:bg-[var(--background)]"
            />
          </div>

          {/* Filters */}
          <Select value={positionFilter} onValueChange={(v) => setPositionFilter(v as typeof positionFilter)}>
            <SelectTrigger className="h-9 w-36 text-sm bg-[var(--background-subtle)] border-[var(--border)]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as typeof stageFilter)}>
            <SelectTrigger className="h-9 w-36 text-sm bg-[var(--background-subtle)] border-[var(--border)]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
            <SelectTrigger className="h-9 w-32 text-sm bg-[var(--background-subtle)] border-[var(--border)]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCES.map((src) => (
                <SelectItem key={src.value} value={src.value}>{src.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-[var(--border)] bg-[var(--background-subtle)] p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'table'
                  ? 'bg-[var(--background)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
              title="Table View"
            >
              <Table2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--background)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'kanban'
                  ? 'bg-[var(--background)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[var(--background-subtle)] border-b border-[var(--border)]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={selectedIds.size === sortedCandidates.length && sortedCandidates.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left px-4 py-3 min-w-[200px]">
                  <SortableHeader field="name">Name</SortableHeader>
                </th>
                <th className="text-left px-4 py-3 w-32">
                  <SortableHeader field="position">Position</SortableHeader>
                </th>
                <th className="text-left px-4 py-3 w-32">
                  <SortableHeader field="stage">Stage</SortableHeader>
                </th>
                <th className="text-left px-4 py-3 w-24">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Source</span>
                </th>
                <th className="text-left px-4 py-3 w-20">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">AI Score</span>
                </th>
                <th className="text-left px-4 py-3 w-32">
                  <SortableHeader field="interview_date">Interview</SortableHeader>
                </th>
                <th className="text-left px-4 py-3 w-20">
                  <SortableHeader field="stage_changed_at">Days</SortableHeader>
                </th>
                <th className="text-left px-4 py-3 w-24">
                  <SortableHeader field="rating">Rating</SortableHeader>
                </th>
                <th className="text-left px-4 py-3 w-24">
                  <SortableHeader field="created_at">Added</SortableHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]">
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-32 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-16 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-20 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-14 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-10 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-16 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-8 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-12 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-14 h-4 bg-[var(--background-muted)] rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : sortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <div className="text-[var(--text-muted)]">
                      <p className="text-sm">No candidates found</p>
                      <p className="text-xs mt-1">Try adjusting your filters or add a new candidate</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedCandidates.map((candidate, index) => {
                  const daysInStage = getDaysInStage(candidate.stage_changed_at)
                  const isFocused = focusedIndex === index

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className={cn(
                        'border-b border-[var(--border)] cursor-pointer transition-colors',
                        'hover:bg-[var(--background-muted)]',
                        isFocused && 'bg-[var(--background-muted)]'
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(candidate.id)}
                          onCheckedChange={() => toggleSelection(candidate.id)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] shrink-0">
                            {getInitials(candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {candidate.name}
                            </p>
                            {candidate.email && (
                              <p className="text-xs text-[var(--text-muted)] truncate">{candidate.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {candidate.position ? (
                          <span className="text-sm text-[var(--text-secondary)]">{candidate.position}</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineStageSelect
                          candidate={candidate}
                          onStageChange={(stage) => handleStageChange(candidate.id, stage, candidate.name)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        {candidate.source ? (
                          <span className="text-xs text-[var(--text-muted)] capitalize">{candidate.source}</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <AIScoreBadge
                          score={candidate.ai_score}
                          recommendation={candidate.ai_analysis?.recommendation}
                          onClick={() => setSelectedCandidateId(candidate.id)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        {candidate.interview_date ? (
                          <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                            {format(new Date(candidate.interview_date), 'MMM d, h:mm a')}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-muted)] tabular-nums">
                          {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {candidate.rating && candidate.rating > 0 ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  i < candidate.rating! ? 'bg-[#635BFF]' : 'bg-[var(--border)]'
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--text-muted)] tabular-nums">
                          {formatRelativeDate(candidate.created_at)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-[var(--background-muted)] rounded animate-pulse" />
              ))}
            </div>
          ) : sortedCandidates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-[var(--text-muted)]">
                <p className="text-sm">No candidates found</p>
                <p className="text-xs mt-1">Try adjusting your filters or add a new candidate</p>
              </div>
            </div>
          ) : (
            <div>
              {sortedCandidates.map((candidate, index) => (
                <ListItem key={candidate.id} candidate={candidate} index={index} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* KANBAN VIEW */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto p-4 bg-[var(--background-subtle)]">
            <div className="flex gap-4 h-full min-w-max">
              {PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  candidates={candidatesByStage[stage.id]}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeCandidate && <CandidateCard candidate={activeCandidate} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 rounded-xl bg-[var(--text-primary)] text-white shadow-lg animate-scale-in">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-white/20" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Move to...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STAGES.map(stage => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => {
                    selectedIds.forEach(id => {
                      const c = candidates?.find(c => c.id === id)
                      handleStageChange(id, stage.id, c?.name)
                    })
                    clearSelection()
                  }}
                >
                  <div className={cn('w-2 h-2 rounded-full mr-2', stage.bgColor)} />
                  {stage.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="text-white/60 hover:text-white hover:bg-white/10 h-8"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
