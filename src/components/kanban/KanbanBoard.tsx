import { useMemo } from 'react'
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
import { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { CandidateCard } from './CandidateCard'
import { useUpdateCandidateStage } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { STAGES, type Candidate, type Stage } from '@/types'

interface KanbanBoardProps {
  candidates: Candidate[]
}

export function KanbanBoard({ candidates }: KanbanBoardProps) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)
  const { searchQuery, positionFilter } = useAppStore()
  const updateStage = useUpdateCandidateStage()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        const matchesSearch =
          candidate.name.toLowerCase().includes(search) ||
          candidate.email?.toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Position filter
      if (positionFilter !== 'all' && candidate.position !== positionFilter) {
        return false
      }

      return true
    })
  }, [candidates, searchQuery, positionFilter])

  // Group candidates by stage
  const candidatesByStage = useMemo(() => {
    const grouped: Record<Stage, Candidate[]> = {
      new: [],
      phone_screen: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
    }

    filteredCandidates.forEach((candidate) => {
      if (grouped[candidate.stage]) {
        grouped[candidate.stage].push(candidate)
      }
    })

    return grouped
  }, [filteredCandidates])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const candidate = candidates.find(c => c.id === active.id)
    if (candidate) {
      setActiveCandidate(candidate)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCandidate(null)

    if (!over) return

    const candidateId = active.id as string
    const candidate = candidates.find(c => c.id === candidateId)
    if (!candidate) return

    // Determine target stage
    let targetStage: Stage | null = null

    if (over.data.current?.type === 'column') {
      targetStage = over.data.current.stage as Stage
    } else if (over.data.current?.type === 'candidate') {
      const overCandidate = over.data.current.candidate as Candidate
      targetStage = overCandidate.stage
    }

    if (targetStage && targetStage !== candidate.stage) {
      updateStage.mutate({ id: candidateId, stage: targetStage })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 overflow-x-auto h-[calc(100vh-88px)]">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            candidates={candidatesByStage[stage.id]}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeCandidate ? (
          <div className="rotate-3 scale-105">
            <CandidateCard candidate={activeCandidate} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
