import { useState } from 'react'
import { Plus, Edit2, Trash2, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePositions, useCreatePosition, useUpdatePosition, useDeletePosition } from '@/hooks/usePositions'
import { useCandidates } from '@/hooks/useCandidates'
import type { PositionRecord, PositionStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusColors: Record<PositionStatus, string> = {
  open: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-slate-50 text-slate-700 border-slate-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
}

export function Positions() {
  const { data: positions, isLoading } = usePositions()
  const { data: candidates } = useCandidates()
  const createPosition = useCreatePosition()
  const updatePosition = useUpdatePosition()
  const deletePosition = useDeletePosition()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionRecord | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    requirements: '',
    status: 'open' as PositionStatus,
  })

  const handleOpenModal = (position?: PositionRecord) => {
    if (position) {
      setEditingPosition(position)
      setFormData({
        title: position.title,
        type: position.type || '',
        description: position.description || '',
        requirements: position.requirements || '',
        status: position.status,
      })
    } else {
      setEditingPosition(null)
      setFormData({ title: '', type: '', description: '', requirements: '', status: 'open' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (editingPosition) {
      updatePosition.mutate({ id: editingPosition.id, updates: formData })
    } else {
      createPosition.mutate(formData)
    }
    setIsModalOpen(false)
  }

  const getCandidateCount = (title: string) => {
    return candidates?.filter(c => c.position?.includes(title.split(' ')[0]) && !c.archived).length || 0
  }

  const getHiredCount = (title: string) => {
    return candidates?.filter(c => c.position?.includes(title.split(' ')[0]) && c.stage === 'hired').length || 0
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Positions"
        description="Manage open positions"
        actions={
          <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Position
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur border-slate-200/50">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : positions?.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">No positions yet</h3>
            <p className="text-sm text-slate-500 mb-4">Add your first open position</p>
            <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions?.map((position) => (
            <Card key={position.id} className="bg-white/80 backdrop-blur border-slate-200/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{position.title}</CardTitle>
                    {position.type && (
                      <p className="text-sm text-slate-500">{position.type}</p>
                    )}
                  </div>
                  <Badge className={cn('text-xs', statusColors[position.status])}>
                    {position.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {position.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{position.description}</p>
                )}

                <div className="flex items-center gap-4 py-3 px-4 rounded-lg bg-slate-50 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium">{getCandidateCount(position.title)}</span>
                    <span className="text-xs text-slate-500">in pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{getHiredCount(position.title)}</span>
                    <span className="text-xs text-slate-500">hired</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(position)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this position?')) {
                        deletePosition.mutate(position.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Edit Position' : 'Add Position'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Streamer (Full-time)"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <Input
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Full-time, Part-time, Contract"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as PositionStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Job description..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Requirements</label>
              <Textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Required qualifications..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim()} className="bg-slate-900 hover:bg-slate-800">
              {editingPosition ? 'Save Changes' : 'Add Position'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
