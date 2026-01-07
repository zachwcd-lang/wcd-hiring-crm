import { useState } from 'react'
import { X, User, Mail, Phone, Briefcase, Instagram, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCreateCandidate } from '@/hooks/useCandidates'
import { useAppStore } from '@/store'
import { POSITIONS, SOURCES, type Position, type Source } from '@/types'

export function AddCandidateModal() {
  const { isAddModalOpen, setIsAddModalOpen } = useAppStore()
  const createCandidate = useCreateCandidate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '' as Position | '',
    source: '' as Source | '',
    notes: '',
    whatnot_username: '',
    instagram_handle: '',
    tiktok_handle: '',
    experience: '',
    availability: '',
  })

  const handleClose = () => {
    setIsAddModalOpen(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      source: '',
      notes: '',
      whatnot_username: '',
      instagram_handle: '',
      tiktok_handle: '',
      experience: '',
      availability: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const notes = formData.notes.trim()
      ? [{ id: crypto.randomUUID(), content: formData.notes.trim(), created_at: new Date().toISOString() }]
      : []

    createCandidate.mutate({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      position: formData.position || null,
      source: formData.source || null,
      notes,
      whatnot_username: formData.whatnot_username || null,
      instagram_handle: formData.instagram_handle || null,
      tiktok_handle: formData.tiktok_handle || null,
      experience: formData.experience || null,
      availability: formData.availability || null,
    }, {
      onSuccess: handleClose,
    })
  }

  const isStreamer = formData.position?.toLowerCase().includes('streamer')

  return (
    <Dialog open={isAddModalOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-white/95 backdrop-blur-xl z-10 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Add New Candidate
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    placeholder="john@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

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
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Position
                </label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value as Position })}
                >
                  <SelectTrigger>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Source
                </label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value as Source })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How did they apply?" />
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
          </div>

          {/* Streamer Fields */}
          {isStreamer && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="text-lg">🎥</span>
                  Streaming Info
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Whatnot
                    </label>
                    <Input
                      value={formData.whatnot_username}
                      onChange={(e) => setFormData({ ...formData, whatnot_username: e.target.value })}
                      placeholder="@username"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Instagram
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-pink-400" />
                      <Input
                        value={formData.instagram_handle}
                        onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                        placeholder="@handle"
                        className="pl-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      TikTok
                    </label>
                    <Input
                      value={formData.tiktok_handle}
                      onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                      placeholder="@handle"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Streaming Experience
                  </label>
                  <Textarea
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="Previous streaming experience, platforms used, audience size..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Availability
                  </label>
                  <Input
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    placeholder="e.g., Weekdays 6pm-10pm, Weekends flexible"
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Notes & Resume */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Initial Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this candidate..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Resume
              </label>
              <div className="flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Resume upload</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Coming soon via Supabase Storage
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || createCandidate.isPending}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {createCandidate.isPending ? 'Adding...' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
