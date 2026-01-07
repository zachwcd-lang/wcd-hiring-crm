import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Briefcase, Upload, FileText, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StarRating } from './StarRating'
import { ActivityLog } from './ActivityLog'
import { StageTimeline } from './StageTimeline'
import { useCandidate, useUpdateCandidate, useAddNote, useDeleteCandidate } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { POSITIONS, SOURCES, getStageInfo, getDaysInStage, type Position, type Source, type Stage } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function CandidateModal() {
  const { selectedCandidateId, setSelectedCandidateId } = useAppStore()
  const { data: candidate, isLoading } = useCandidate(selectedCandidateId)
  const updateCandidate = useUpdateCandidate()
  const addNote = useAddNote()
  const deleteCandidate = useDeleteCandidate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '' as Position | '',
    source: '' as Source | '',
    rating: 0,
  })

  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details')

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name,
        email: candidate.email || '',
        phone: candidate.phone || '',
        position: candidate.position || '',
        source: candidate.source || '',
        rating: candidate.rating || 0,
      })
    }
  }, [candidate])

  const handleClose = () => {
    setSelectedCandidateId(null)
    setActiveTab('details')
  }

  const handleSave = () => {
    if (!selectedCandidateId) return
    updateCandidate.mutate({
      id: selectedCandidateId,
      updates: {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        position: formData.position || null,
        source: formData.source || null,
        rating: formData.rating || null,
      },
    })
  }

  const handleStageChange = (stage: Stage) => {
    if (!selectedCandidateId) return
    updateCandidate.mutate({
      id: selectedCandidateId,
      updates: { stage },
    })
  }

  const handleAddNote = (content: string) => {
    if (!selectedCandidateId) return
    addNote.mutate({ id: selectedCandidateId, note: content })
  }

  const handleDelete = () => {
    if (!selectedCandidateId) return
    if (confirm('Are you sure you want to delete this candidate?')) {
      deleteCandidate.mutate(selectedCandidateId)
      handleClose()
    }
  }

  const stageInfo = candidate ? getStageInfo(candidate.stage) : null
  const daysInStage = candidate ? getDaysInStage(candidate.stage_changed_at) : 0

  return (
    <Dialog open={!!selectedCandidateId} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl">
        {isLoading || !candidate ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse text-slate-400">Loading...</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <User className="h-7 w-7 text-slate-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-slate-800">
                      {candidate.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {stageInfo && (
                        <Badge className={cn(stageInfo.bgColor, stageInfo.color, 'border', stageInfo.borderColor)}>
                          {stageInfo.label}
                        </Badge>
                      )}
                      <span className="text-sm text-slate-400">
                        {daysInStage === 0 ? 'Added today' : `${daysInStage} days in stage`}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex border-b border-slate-200/60 px-6 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'details'
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'notes'
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                Notes ({candidate.notes.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {activeTab === 'details' ? (
                <div className="space-y-6">
                  {/* Stage Timeline */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-700 mb-4">Pipeline Stage</h3>
                    <StageTimeline
                      currentStage={candidate.stage}
                      onStageChange={handleStageChange}
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          onBlur={handleSave}
                          className="pl-10 bg-white/60 border-slate-200/60 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          onBlur={handleSave}
                          className="pl-10 bg-white/60 border-slate-200/60 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          onBlur={handleSave}
                          className="pl-10 bg-white/60 border-slate-200/60 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Position
                      </label>
                      <Select
                        value={formData.position}
                        onValueChange={(value) => {
                          setFormData({ ...formData, position: value as Position })
                          setTimeout(handleSave, 0)
                        }}
                      >
                        <SelectTrigger className="bg-white/60 border-slate-200/60">
                          <Briefcase className="h-4 w-4 text-slate-400 mr-2" />
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {pos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Source */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Source
                      </label>
                      <Select
                        value={formData.source}
                        onValueChange={(value) => {
                          setFormData({ ...formData, source: value as Source })
                          setTimeout(handleSave, 0)
                        }}
                      >
                        <SelectTrigger className="bg-white/60 border-slate-200/60">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((src) => (
                            <SelectItem key={src.value} value={src.value}>
                              {src.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rating
                    </label>
                    <StarRating
                      rating={formData.rating}
                      onChange={(rating) => {
                        setFormData({ ...formData, rating })
                        setTimeout(handleSave, 0)
                      }}
                      size="lg"
                    />
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Resume
                    </label>
                    {candidate.resume_url ? (
                      <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                      >
                        <FileText className="h-8 w-8 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Resume</p>
                          <p className="text-xs text-slate-400">Click to view</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center justify-center p-8 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No resume uploaded</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Upload via Supabase Storage
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                    <span>Created {format(new Date(candidate.created_at), 'MMM d, yyyy')}</span>
                    <span>Updated {format(new Date(candidate.updated_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ) : (
                <ActivityLog
                  notes={candidate.notes}
                  onAddNote={handleAddNote}
                  isLoading={addNote.isPending}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200/60 bg-slate-50/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button onClick={handleClose} className="bg-slate-800 hover:bg-slate-700">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
