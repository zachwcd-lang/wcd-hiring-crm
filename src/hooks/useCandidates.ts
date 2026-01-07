import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Candidate, Stage, Note, Scorecard, InterviewFeedback, InterviewTranscript } from '@/types'
import { toast } from 'sonner'

// Helper to transform DB row to Candidate type
function transformCandidate(row: Record<string, unknown>): Candidate {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    name: row.name as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    position: row.position as Candidate['position'],
    stage: row.stage as Stage,
    source: row.source as Candidate['source'],
    rating: row.rating as number | null,
    resume_url: row.resume_url as string | null,
    notes: (row.notes as Note[]) || [],
    calendly_event_id: row.calendly_event_id as string | null,
    stage_changed_at: row.stage_changed_at as string,
    whatnot_username: row.whatnot_username as string | null,
    instagram_handle: row.instagram_handle as string | null,
    tiktok_handle: row.tiktok_handle as string | null,
    availability: row.availability as string | null,
    experience: row.experience as string | null,
    archived: (row.archived as boolean) || false,
    interview_date: row.interview_date as string | null,
    scorecard: row.scorecard as Scorecard | null,
    ai_score: row.ai_score as number | null,
    ai_analysis: row.ai_analysis as Candidate['ai_analysis'],
    screening_answers: row.screening_answers as Candidate['screening_answers'],
    ai_screened_at: row.ai_screened_at as string | null,
    interview_feedback: row.interview_feedback as InterviewFeedback | null,
    interview_transcripts: (row.interview_transcripts as InterviewTranscript[]) || null,
  }
}

export function useCandidates(includeArchived = false) {
  return useQuery({
    queryKey: ['candidates', { includeArchived }],
    queryFn: async (): Promise<Candidate[]> => {
      let query = supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('archived', false)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(row => transformCandidate(row as Record<string, unknown>))
    },
  })
}

export function useCandidate(id: string | null) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: async (): Promise<Candidate | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return transformCandidate(data as Record<string, unknown>)
    },
    enabled: !!id,
  })
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (candidate: Partial<Candidate>) => {
      const insertData = {
        name: candidate.name || 'New Candidate',
        email: candidate.email || null,
        phone: candidate.phone || null,
        position: candidate.position || null,
        stage: candidate.stage || 'new',
        source: candidate.source || null,
        rating: candidate.rating || null,
        notes: candidate.notes || [],
        whatnot_username: candidate.whatnot_username || null,
        instagram_handle: candidate.instagram_handle || null,
        tiktok_handle: candidate.tiktok_handle || null,
        availability: candidate.availability || null,
        experience: candidate.experience || null,
      }

      const { data, error } = await supabase
        .from('candidates')
        .insert(insertData as never)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        candidate_id: (data as Record<string, unknown>).id,
        action: 'candidate_created',
        details: { name: candidate.name, position: candidate.position },
      } as never)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      toast.success('Candidate added successfully')
    },
    onError: (error) => {
      toast.error('Failed to add candidate: ' + (error as Error).message)
    },
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Candidate> }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      // Map all fields
      const fields = [
        'name', 'email', 'phone', 'position', 'source', 'rating',
        'resume_url', 'notes', 'whatnot_username', 'instagram_handle',
        'tiktok_handle', 'availability', 'experience', 'archived',
        'interview_date', 'scorecard', 'calendly_event_id',
        'interview_feedback', 'interview_transcripts'
      ]

      fields.forEach(field => {
        if (updates[field as keyof Candidate] !== undefined) {
          updateData[field] = updates[field as keyof Candidate]
        }
      })

      // If stage is being updated, also update stage_changed_at
      if (updates.stage !== undefined) {
        updateData.stage = updates.stage
        updateData.stage_changed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
    },
  })
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage, candidateName }: { id: string; stage: Stage; candidateName?: string }) => {
      const updateData = {
        stage,
        stage_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        candidate_id: id,
        action: 'stage_changed',
        details: { stage, name: candidateName },
      } as never)

      return data
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['candidates'] })
      const previousCandidates = queryClient.getQueryData<Candidate[]>(['candidates', { includeArchived: false }])

      queryClient.setQueryData<Candidate[]>(['candidates', { includeArchived: false }], old =>
        old?.map(c => c.id === id ? { ...c, stage, stage_changed_at: new Date().toISOString() } : c)
      )

      return { previousCandidates }
    },
    onError: (_, __, context) => {
      if (context?.previousCandidates) {
        queryClient.setQueryData(['candidates', { includeArchived: false }], context.previousCandidates)
      }
      toast.error('Failed to update stage')
    },
    onSuccess: (_, { stage }) => {
      toast.success(`Moved to ${stage.replace('_', ' ')}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useArchiveCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({ archived, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success(archived ? 'Candidate archived' : 'Candidate restored')
    },
  })
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate deleted')
    },
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, note, candidateName }: { id: string; note: string; candidateName?: string }) => {
      const { data: candidate, error: fetchError } = await supabase
        .from('candidates')
        .select('notes')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const currentNotes = ((candidate as Record<string, unknown>)?.notes as Note[]) || []
      const newNote: Note = {
        id: crypto.randomUUID(),
        content: note,
        created_at: new Date().toISOString(),
      }

      const updateData = {
        notes: [...currentNotes, newNote],
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        candidate_id: id,
        action: 'note_added',
        details: { preview: note.slice(0, 50), name: candidateName },
      } as never)

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      toast.success('Note added')
    },
  })
}

export function useUpdateScorecard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, scorecard }: { id: string; scorecard: Scorecard }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({ scorecard, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
      toast.success('Scorecard updated')
    },
  })
}

export function useScheduleInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, interview_date }: { id: string; interview_date: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          interview_date,
          stage: 'interview',
          stage_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('activity_log').insert({
        candidate_id: id,
        action: 'interview_scheduled',
        details: { date: interview_date },
      } as never)

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      toast.success('Interview scheduled')
    },
  })
}

export function useUpdateInterviewFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, feedback, candidateName }: { id: string; feedback: InterviewFeedback; candidateName?: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({
          interview_feedback: feedback,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('activity_log').insert({
        candidate_id: id,
        action: 'interview_feedback_added',
        details: { feedback, name: candidateName },
      } as never)

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      const feedbackLabels = { good: 'Good', bad: 'Bad', meh: 'Meh' }
      toast.success(`Marked interview as ${feedbackLabels[variables.feedback]}`)
    },
  })
}

export function useUploadTranscript() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, file, candidateName }: { id: string; file: File; candidateName?: string }) => {
      // Read file content
      const content = await file.text()

      // Get current transcripts
      const { data: candidate, error: fetchError } = await supabase
        .from('candidates')
        .select('interview_transcripts')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const currentTranscripts = ((candidate as Record<string, unknown>)?.interview_transcripts as InterviewTranscript[]) || []

      const newTranscript: InterviewTranscript = {
        id: crypto.randomUUID(),
        filename: file.name,
        file_url: null,
        content,
        uploaded_at: new Date().toISOString(),
        ai_analysis: null,
      }

      const { data, error } = await supabase
        .from('candidates')
        .update({
          interview_transcripts: [...currentTranscripts, newTranscript],
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('activity_log').insert({
        candidate_id: id,
        action: 'transcript_uploaded',
        details: { filename: file.name, name: candidateName },
      } as never)

      return { data, transcriptId: newTranscript.id }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      toast.success('Transcript uploaded')
    },
    onError: (error) => {
      toast.error('Failed to upload transcript: ' + (error as Error).message)
    },
  })
}

export function useAnalyzeTranscript() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, transcriptId, candidateName }: { id: string; transcriptId: string; candidateName?: string }) => {
      // Get current transcripts
      const { data: candidate, error: fetchError } = await supabase
        .from('candidates')
        .select('interview_transcripts, name, position')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const candidateData = candidate as Record<string, unknown>
      const transcripts = (candidateData.interview_transcripts as InterviewTranscript[]) || []
      const transcript = transcripts.find(t => t.id === transcriptId)

      if (!transcript) throw new Error('Transcript not found')

      // Call the analyze function
      const { analyzeTranscript } = await import('@/lib/analyzeTranscript')
      const analysis = await analyzeTranscript(
        transcript.content,
        candidateData.name as string,
        candidateData.position as string | null
      )

      // Update the transcript with analysis
      const updatedTranscripts = transcripts.map(t =>
        t.id === transcriptId ? { ...t, ai_analysis: analysis } : t
      )

      const { data, error } = await supabase
        .from('candidates')
        .update({
          interview_transcripts: updatedTranscripts,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('activity_log').insert({
        candidate_id: id,
        action: 'transcript_analyzed',
        details: { transcriptId, name: candidateName },
      } as never)

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      toast.success('Transcript analyzed')
    },
    onError: (error) => {
      toast.error('Failed to analyze transcript: ' + (error as Error).message)
    },
  })
}
