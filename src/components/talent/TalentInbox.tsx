import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Search,
  Star,
  MoreHorizontal,
  Sparkles,
  ArrowRight,
  X,
  Archive,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useCandidates } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { STAGES, getInitials, type Stage } from '@/types'
import { cn } from '@/lib/utils'
import { RapidReviewDrawer } from './RapidReviewDrawer'
import { ActionBar } from './ActionBar'

// Match score badge component
function MatchScoreBadge({ score }: { score?: number | null }) {
  if (!score) return null

  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
    : score >= 60 ? 'text-blue-600 bg-blue-50 border-blue-100'
    : 'text-slate-500 bg-slate-50 border-slate-100'

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border backdrop-blur-sm',
      color
    )}>
      {score}% Match
    </span>
  )
}

// Stage indicator pill
function StagePill({ stage }: { stage: Stage }) {
  const stageConfig = STAGES.find(s => s.id === stage)
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
      `status-${stage}`
    )}>
      {stageConfig?.label || stage}
    </span>
  )
}

// Relative time display
function RelativeTime({ date }: { date: string }) {
  const formatted = formatDistanceToNow(new Date(date), { addSuffix: false })
    .replace('about ', '')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace('less than a minute', 'now')

  return (
    <span className="text-xs text-[var(--text-muted)] tabular-nums">
      {formatted}
    </span>
  )
}

export function TalentInbox() {
  const { data: candidates, isLoading } = useCandidates()
  const {
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    setSelectedCandidateId,
    selectedCandidateId,
  } = useAppStore()

  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    if (!candidates) return []

    return candidates.filter(c => {
      if (c.archived) return false
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        return c.name.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.position?.toLowerCase().includes(search)
      }
      return true
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [candidates, searchQuery])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    if (selectedCandidateId) return // Don't navigate when drawer is open

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, filteredCandidates.length - 1))
        break
      case 'k':
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && filteredCandidates[focusedIndex]) {
          setSelectedCandidateId(filteredCandidates[focusedIndex].id)
        }
        break
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && filteredCandidates[focusedIndex]) {
          toggleSelection(filteredCandidates[focusedIndex].id)
        }
        break
      case 'x':
        // Quick reject - handled by ActionBar
        break
      case 'g':
        // Quick advance - handled by ActionBar
        break
      case 's':
        e.preventDefault()
        // Star/favorite toggle
        break
      case 'Escape':
        clearSelection()
        setFocusedIndex(-1)
        break
    }
  }, [focusedIndex, filteredCandidates, selectedCandidateId, setSelectedCandidateId, toggleSelection, clearSelection])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Select all handler
  const handleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      clearSelection()
    } else {
      selectAll(filteredCandidates.map(c => c.id))
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Glass Header */}
      <header className="sticky top-0 z-30 glass-heavy border-b border-[var(--border)]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-title text-[var(--text-primary)]">Talent Inbox</h1>
              <p className="text-small text-[var(--text-muted)] mt-0.5">
                {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:bg-[var(--accent-blue-hover)] transition-all shadow-sm hover:shadow-md">
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                AI Screen All
              </button>
            </div>
          </div>

          {/* Search Bar - Raycast style */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search candidates..."
              className={cn(
                'pl-10 h-10 bg-white border-transparent text-sm transition-all',
                isSearchFocused
                  ? 'border-[var(--accent-blue)] ring-2 ring-[var(--accent-blue)]/20'
                  : 'hover:border-[var(--border)]'
              )}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2">/</kbd>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-[var(--background)] border-b border-[var(--border)]">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="rounded border-[var(--border)]"
                />
              </th>
              <th className="w-24 px-4 py-3 text-left">
                <span className="text-label">Match</span>
              </th>
              <th className="px-4 py-3 text-left min-w-[240px]">
                <span className="text-label">Candidate</span>
              </th>
              <th className="px-4 py-3 text-left w-[300px]">
                <span className="text-label">AI Vibe</span>
              </th>
              <th className="w-28 px-4 py-3 text-left">
                <span className="text-label">Stage</span>
              </th>
              <th className="w-20 px-4 py-3 text-right">
                <span className="text-label">Activity</span>
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="h-[52px] border-b border-[var(--border-subtle)]">
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-16 h-6 bg-slate-100 rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
                          <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="w-48 h-4 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-16 h-5 bg-slate-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="w-10 h-4 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue-light)] flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-[var(--accent-blue)]" strokeWidth={1.5} />
                      </div>
                      <p className="text-[var(--text-secondary)] font-medium">No candidates found</p>
                      <p className="text-small text-[var(--text-muted)] mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate, index) => {
                  const isSelected = selectedIds.has(candidate.id)
                  const isFocused = focusedIndex === index
                  const isNew = new Date(candidate.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000

                  return (
                    <motion.tr
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className={cn(
                        'h-[52px] border-b border-[var(--border-subtle)] cursor-pointer transition-all',
                        isNew && !isSelected && 'row-unread',
                        isSelected && 'row-selected',
                        isFocused && !isSelected && 'bg-slate-50',
                        !isSelected && !isFocused && 'row-hover'
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(candidate.id)}
                          className="rounded border-[var(--border)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <MatchScoreBadge score={candidate.ai_score} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border border-[var(--border)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)]">
                            {getInitials(candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {candidate.name}
                            </p>
                            <p className="font-mono text-xs text-[var(--text-muted)] truncate">
                              {candidate.position || candidate.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-[var(--text-muted)] truncate max-w-[280px]">
                          {candidate.ai_analysis?.summary || 'Awaiting AI screening...'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StagePill stage={candidate.stage} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RelativeTime date={candidate.stage_changed_at || candidate.created_at} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-slate-100 text-[var(--text-muted)] hover:text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedCandidateId(candidate.id)}>
                              <ArrowRight className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              Open Review
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Star className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              Star
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <X className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Action Bar - slides up when candidates selected */}
      <ActionBar
        selectedCount={selectedIds.size}
        onAdvance={() => {}}
        onReject={() => {}}
        onArchive={() => {}}
        onClear={clearSelection}
      />

      {/* Rapid Review Drawer */}
      <RapidReviewDrawer />
    </div>
  )
}
