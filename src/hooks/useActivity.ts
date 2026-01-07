import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

interface ActivityRow {
  id: string
  created_at: string
  candidate_id: string
  action: string
  details: Record<string, unknown> | null
  candidate: { name: string } | null
}

export function useActivity(limit = 10) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, candidate:candidates(name)')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map((row: ActivityRow) => ({
        id: row.id,
        created_at: row.created_at,
        candidate_id: row.candidate_id,
        action: row.action,
        details: row.details,
        candidate: row.candidate,
      })) as ActivityLog[]
    },
  })
}

export function useCandidateActivity(candidateId: string | null) {
  return useQuery({
    queryKey: ['activity', 'candidate', candidateId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!candidateId) return []

      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []) as ActivityLog[]
    },
    enabled: !!candidateId,
  })
}
