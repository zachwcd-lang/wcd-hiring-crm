import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  Archive,
  ArrowRight,
  Star,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCandidates, useUpdateCandidateStage, useArchiveCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { STAGES, POSITIONS, SOURCES, getStageInfo, getDaysInStage, getInitials, type Stage } from '@/types'
import { cn } from '@/lib/utils'

type SortField = 'name' | 'position' | 'stage' | 'rating' | 'created_at' | 'stage_changed_at'
type SortDirection = 'asc' | 'desc'

export function Candidates() {
  const { data: candidates, isLoading } = useCandidates(true) // Include archived
  const updateStage = useUpdateCandidateStage()
  const archiveCandidate = useArchiveCandidate()
  const deleteCandidate = useDeleteCandidate()

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

  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showArchived, setShowArchived] = useState(false)

  const filteredCandidates = useMemo(() => {
    if (!candidates) return []

    return candidates.filter((candidate) => {
      if (!showArchived && candidate.archived) return false

      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        if (!candidate.name.toLowerCase().includes(search) &&
            !candidate.email?.toLowerCase().includes(search)) {
          return false
        }
      }

      if (positionFilter !== 'all' && candidate.position !== positionFilter) return false
      if (sourceFilter !== 'all' && candidate.source !== sourceFilter) return false

      return true
    })
  }, [candidates, searchQuery, positionFilter, sourceFilter, showArchived])

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
      const candidate = candidates?.find(c => c.id === id)
      updateStage.mutate({ id, stage, candidateName: candidate?.name })
    })
    clearSelection()
  }

  const handleBulkArchive = () => {
    selectedIds.forEach(id => {
      archiveCandidate.mutate({ id, archived: true })
    })
    clearSelection()
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Stage', 'Source', 'Rating', 'Created']
    const rows = sortedCandidates.map(c => [
      c.name,
      c.email || '',
      c.phone || '',
      c.position || '',
      c.stage,
      c.source || '',
      c.rating?.toString() || '',
      format(new Date(c.created_at), 'yyyy-MM-dd'),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="-ml-3 h-8 hover:bg-slate-100"
    >
      {children}
      <ArrowUpDown className={cn('ml-2 h-4 w-4', sortField === field ? 'opacity-100' : 'opacity-40')} />
    </Button>
  )

  return (
    <div className="p-6">
      <PageHeader
        title="All Candidates"
        description={`${filteredCandidates.length} candidates`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/80"
          />
        </div>

        <Select value={positionFilter} onValueChange={(v) => setPositionFilter(v as typeof positionFilter)}>
          <SelectTrigger className="w-40 bg-white/80">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
          <SelectTrigger className="w-36 bg-white/80">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((src) => (
              <SelectItem key={src.value} value={src.value}>{src.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className={showArchived ? 'bg-slate-800' : 'bg-white/80'}
        >
          <Archive className="w-4 h-4 mr-2" />
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-slate-100 border border-slate-200">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Move to Stage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STAGES.map(stage => (
                <DropdownMenuItem key={stage.id} onClick={() => handleBulkStageChange(stage.id)}>
                  {stage.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleBulkArchive}>
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Cancel
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white/80 backdrop-blur border border-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === sortedCandidates.length && sortedCandidates.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead><SortButton field="name">Name</SortButton></TableHead>
              <TableHead><SortButton field="position">Position</SortButton></TableHead>
              <TableHead><SortButton field="stage">Stage</SortButton></TableHead>
              <TableHead>Source</TableHead>
              <TableHead><SortButton field="rating">Rating</SortButton></TableHead>
              <TableHead><SortButton field="stage_changed_at">Days</SortButton></TableHead>
              <TableHead><SortButton field="created_at">Added</SortButton></TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : sortedCandidates.length === 0 ? (
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
                    className={cn(
                      'cursor-pointer hover:bg-slate-50/80',
                      candidate.archived && 'opacity-60'
                    )}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(candidate.id)}
                        onCheckedChange={() => toggleSelection(candidate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {getInitials(candidate.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{candidate.name}</p>
                          {candidate.email && (
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{candidate.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{candidate.position || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(stageInfo.bgColor, stageInfo.color, 'border', stageInfo.borderColor)}>
                        {stageInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {candidate.source ? (
                        <span className="text-sm text-slate-600 capitalize">{candidate.source}</span>
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
                                'w-3 h-3',
                                i < candidate.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
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
                                  onClick={() => updateStage.mutate({ id: candidate.id, stage: stage.id, candidateName: candidate.name })}
                                  disabled={stage.id === candidate.stage}
                                >
                                  {stage.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => archiveCandidate.mutate({ id: candidate.id, archived: !candidate.archived })}>
                            <Archive className="h-4 w-4 mr-2" />
                            {candidate.archived ? 'Restore' : 'Archive'}
                          </DropdownMenuItem>
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
