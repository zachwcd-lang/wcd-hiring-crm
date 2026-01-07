import { Check, Circle } from 'lucide-react'
import { STAGES, type Stage } from '@/types'
import { cn } from '@/lib/utils'

interface StageTimelineProps {
  currentStage: Stage
  onStageChange?: (stage: Stage) => void
}

export function StageTimeline({ currentStage, onStageChange }: StageTimelineProps) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage)
  const mainStages = STAGES.filter(s => s.id !== 'rejected')
  const isRejected = currentStage === 'rejected'

  return (
    <div className="space-y-4">
      {/* Main Pipeline */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {mainStages.map((stage, index) => {
            const isPast = !isRejected && index < currentIndex
            const isCurrent = !isRejected && stage.id === currentStage
            const isFuture = !isRejected && index > currentIndex

            return (
              <div key={stage.id} className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => onStageChange?.(stage.id)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    'border-2',
                    isPast && 'bg-green-500 border-green-500 text-white',
                    isCurrent && cn(stage.bgColor, stage.borderColor, stage.color),
                    isFuture && 'bg-white border-slate-200 text-slate-400',
                    isRejected && 'bg-white border-slate-200 text-slate-400',
                    !isRejected && 'hover:scale-110 cursor-pointer'
                  )}
                >
                  {isPast ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3 fill-current" />
                  )}
                </button>
                <span className={cn(
                  'mt-2 text-xs font-medium',
                  isCurrent && !isRejected ? stage.color : 'text-slate-400'
                )}>
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress Line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2">
          <div
            className={cn(
              'h-full bg-green-500 transition-all duration-300',
              isRejected && 'bg-slate-200'
            )}
            style={{
              width: isRejected ? '0%' : `${(currentIndex / (mainStages.length - 1)) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Rejected Button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => onStageChange?.('rejected')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'border-2',
            isRejected
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600'
          )}
        >
          {isRejected ? 'Rejected' : 'Mark as Rejected'}
        </button>
      </div>
    </div>
  )
}
