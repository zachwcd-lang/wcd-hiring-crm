import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store'
import type { Candidate, StageInfo } from '@/types'
import { getInitials, getDaysInStage } from '@/types'
import { cn } from '@/lib/utils'

interface SortableCandidateCardProps {
  candidate: Candidate
}

function SortableCandidateCard({ candidate }: SortableCandidateCardProps) {
  const { setSelectedCandidateId } = useAppStore()
  const daysInStage = getDaysInStage(candidate.stage_changed_at)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: { type: 'candidate', candidate },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedCandidateId(candidate.id)}
      className={cn(
        'p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer',
        'hover:shadow-sm hover:border-[var(--border)] transition-all',
        isDragging && 'opacity-50 shadow-md'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[var(--background-muted)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)] shrink-0">
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

interface KanbanColumnProps {
  stage: StageInfo
  candidates: Candidate[]
  isLoading?: boolean
}

export function KanbanColumn({ stage, candidates, isLoading }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'column', stage: stage.id },
  })

  return (
    <div className="flex flex-col w-72 min-w-[288px] h-full">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--background)] rounded-t-lg border border-b-0 border-[var(--border)]">
        <div className={cn('w-2 h-2 rounded-full', stage.bgColor)} />
        <h2 className="text-xs font-semibold text-[var(--text-primary)]">
          {stage.label}
        </h2>
        <span className="text-xs text-[var(--text-muted)] font-medium">
          {candidates.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto p-2 space-y-2 rounded-b-lg border border-t-0 border-[var(--border)] bg-[var(--background-subtle)]',
          isOver && 'bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)] ring-inset'
        )}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-xs text-[var(--text-muted)]">No candidates</p>
              </div>
            ) : (
              candidates.map((candidate) => (
                <SortableCandidateCard key={candidate.id} candidate={candidate} />
              ))
            )}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
