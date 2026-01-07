import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Star, Clock, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store'
import type { Candidate } from '@/types'
import { getDaysInStage } from '@/types'
import { cn } from '@/lib/utils'

interface CandidateCardProps {
  candidate: Candidate
}

const sourceColors: Record<string, string> = {
  linkedin: 'bg-blue-50 text-blue-700 border-blue-200',
  indeed: 'bg-purple-50 text-purple-700 border-purple-200',
  referral: 'bg-green-50 text-green-700 border-green-200',
  website: 'bg-orange-50 text-orange-700 border-orange-200',
  other: 'bg-slate-50 text-slate-700 border-slate-200',
}

export function CandidateCard({ candidate }: CandidateCardProps) {
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
    data: {
      type: 'candidate',
      candidate,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group frost-card rounded-xl p-4 cursor-pointer transition-all duration-200',
        'hover:shadow-frost-md hover:-translate-y-0.5',
        isDragging && 'opacity-50 shadow-frost-lg rotate-2 scale-105'
      )}
      onClick={() => setSelectedCandidateId(candidate.id)}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 -ml-2 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-opacity cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-medium text-slate-800 truncate">{candidate.name}</h3>
              {candidate.position && (
                <p className="text-sm text-slate-500">{candidate.position}</p>
              )}
            </div>
            {candidate.source && (
              <Badge
                variant="outline"
                className={cn('text-xs shrink-0', sourceColors[candidate.source])}
              >
                {candidate.source}
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-1 mb-3 text-xs text-slate-500">
            {candidate.email && (
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{candidate.phone}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Days in Stage */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>
                {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
              </span>
            </div>

            {/* Rating */}
            {candidate.rating && candidate.rating > 0 && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
