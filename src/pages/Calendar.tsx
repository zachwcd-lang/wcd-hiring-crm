import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCandidates } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { getInitials } from '@/types'
import { cn } from '@/lib/utils'

export function Calendar() {
  const { data: candidates } = useCandidates()
  const { setSelectedCandidateId } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get day of week for first day (0 = Sunday)
  const startDay = monthStart.getDay()

  const interviewsByDate = useMemo(() => {
    if (!candidates) return {}

    const map: Record<string, typeof candidates> = {}
    candidates.forEach(c => {
      if (c.interview_date) {
        const dateKey = format(new Date(c.interview_date), 'yyyy-MM-dd')
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(c)
      }
    })
    return map
  }, [candidates])

  const selectedDayInterviews = selectedDate
    ? interviewsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : []

  return (
    <div className="p-6">
      <PageHeader
        title="Calendar"
        description="Interview schedule"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur border-slate-200/50">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before start of month */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24" />
              ))}

              {daysInMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const interviews = interviewsByDate[dateKey] || []
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'h-24 p-2 rounded-lg border text-left transition-all',
                      'hover:bg-slate-50',
                      isToday && 'border-slate-400 bg-slate-50',
                      isSelected && 'ring-2 ring-slate-900',
                      !isToday && !isSelected && 'border-slate-100'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isToday ? 'text-slate-900 font-semibold' : 'text-slate-700'
                    )}>
                      {format(day, 'd')}
                    </span>

                    {interviews.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {interviews.slice(0, 2).map(c => (
                          <div
                            key={c.id}
                            className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 truncate"
                          >
                            {format(new Date(c.interview_date!), 'h:mm a')} - {c.name.split(' ')[0]}
                          </div>
                        ))}
                        {interviews.length > 2 && (
                          <div className="text-xs text-slate-400">
                            +{interviews.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day */}
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              {selectedDate
                ? format(selectedDate, 'EEEE, MMMM d')
                : 'Select a date'}
            </h3>

            {!selectedDate ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Click a date to see interviews</p>
              </div>
            ) : selectedDayInterviews.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No interviews scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayInterviews.map(candidate => (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className="w-full p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-sm font-medium text-violet-600">
                        {getInitials(candidate.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800">{candidate.name}</p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(candidate.interview_date!), 'h:mm a')}
                        </p>
                      </div>
                      {candidate.position && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {candidate.position}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
