import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Star,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store'
import { useUpdateCandidateStage, useDeleteCandidate } from '@/hooks/useCandidates'
import { STAGES, getStageInfo, getDaysInStage, type Candidate, type Stage } from '@/types'
import { cn } from '@/lib/utils'

interface CandidatesTableProps {
  candidates: Candidate[]
}

type SortField = 'name' | 'position' | 'stage' | 'rating' | 'created_at' | 'stage_changed_at'
type SortDirection = 'asc' | 'desc'

const sourceColors: Record<string, string> = {
  linkedin: 'bg-blue-50 text-blue-700 border-blue-200',
  indeed: 'bg-purple-50 text-purple-700 border-purple-200',
  referral: 'bg-green-50 text-green-700 border-green-200',
  website: 'bg-orange-50 text-orange-700 border-orange-200',
  other: 'bg-slate-50 text-slate-700 border-slate-200',
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const {
    searchQuery,
    positionFilter,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    setSelectedCandidateId,
  } = useAppStore()
  const updateStage = useUpdateCandidateStage()
  const deleteCandidate = useDeleteCandidate()

  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        const matchesSearch =
          candidate.name.toLowerCase().includes(search) ||
          candidate.email?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      if (positionFilter !== 'all' && candidate.position !== positionFilter) {
        return false
      }

      return true
    })
  }, [candidates, searchQuery, positionFilter])

  // Sort candidates
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

  const handleBulkStageChange = (stage: Stage) => {
    selectedIds.forEach(id => {
      updateStage.mutate({ id, stage })
    })
    clearSelection()
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} candidates?`)) {
      selectedIds.forEach(id => {
        deleteCandidate.mutate(id)
      })
      clearSelection()
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="-ml-3 h-8 hover:bg-slate-100"
    >
      {children}
      <ArrowUpDown className={cn(
        'ml-2 h-4 w-4',
        sortField === field ? 'opacity-100' : 'opacity-40'
      )} />
    </Button>
  )

  return (
    <div className="p-6">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-slate-100 border border-slate-200">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Move to <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STAGES.map(stage => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => handleBulkStageChange(stage.id)}
                >
                  <div className={cn('w-2 h-2 rounded-full mr-2', stage.bgColor)} />
                  {stage.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Cancel
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="frost-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === sortedCandidates.length && sortedCandidates.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortButton field="name">Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="position">Position</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="stage">Stage</SortButton>
              </TableHead>
              <TableHead>Source</TableHead>
              <TableHead>
                <SortButton field="rating">Rating</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="stage_changed_at">Days in Stage</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="created_at">Added</SortButton>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <p className="text-slate-400">No candidates found</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedCandidates.map((candidate) => {
                const stageInfo = getStageInfo(candidate.stage)
                const daysInStage = getDaysInStage(candidate.stage_changed_at)

                return (
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => setSelectedCandidateId(candidate.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(candidate.id)}
                        onCheckedChange={() => toggleSelection(candidate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{candidate.name}</p>
                        {candidate.email && (
                          <p className="text-xs text-slate-400">{candidate.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {candidate.position || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          stageInfo.bgColor,
                          stageInfo.color,
                          'border',
                          stageInfo.borderColor
                        )}
                      >
                        {stageInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {candidate.source ? (
                        <Badge
                          variant="outline"
                          className={cn('text-xs', sourceColors[candidate.source])}
                        >
                          {candidate.source}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {candidate.rating ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3 w-3',
                                i < candidate.rating!
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              )}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {format(new Date(candidate.created_at), 'MMM d')}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Move to
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {STAGES.map(stage => (
                                <DropdownMenuItem
                                  key={stage.id}
                                  onClick={() => updateStage.mutate({ id: candidate.id, stage: stage.id })}
                                  disabled={stage.id === candidate.stage}
                                >
                                  <div className={cn('w-2 h-2 rounded-full mr-2', stage.bgColor)} />
                                  {stage.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm('Delete this candidate?')) {
                                deleteCandidate.mutate(candidate.id)
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
