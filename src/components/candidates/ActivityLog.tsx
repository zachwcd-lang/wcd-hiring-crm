import { useState } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Note } from '@/types'

interface ActivityLogProps {
  notes: Note[]
  onAddNote: (content: string) => void
  isLoading?: boolean
}

export function ActivityLog({ notes, onAddNote, isLoading }: ActivityLogProps) {
  const [newNote, setNewNote] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newNote.trim()) {
      onAddNote(newNote.trim())
      setNewNote('')
    }
  }

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px] resize-none bg-white/60 border-slate-200/60 focus:bg-white"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newNote.trim() || isLoading}
            className="bg-slate-800 hover:bg-slate-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">No notes yet</p>
            <p className="text-xs text-slate-300 mt-1">Add a note above to get started</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg bg-slate-50/80 border border-slate-100"
            >
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {format(new Date(note.created_at), 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
