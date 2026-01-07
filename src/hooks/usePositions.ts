import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PositionRecord } from '@/types'
import { toast } from 'sonner'

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async (): Promise<PositionRecord[]> => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []) as PositionRecord[]
    },
  })
}

export function useCreatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (position: Partial<PositionRecord>) => {
      const { data, error } = await supabase
        .from('positions')
        .insert({
          title: position.title || 'New Position',
          type: position.type || null,
          description: position.description || null,
          requirements: position.requirements || null,
          status: position.status || 'open',
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      toast.success('Position created')
    },
  })
}

export function useUpdatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PositionRecord> }) => {
      const { data, error } = await supabase
        .from('positions')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      toast.success('Position updated')
    },
  })
}

export function useDeletePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      toast.success('Position deleted')
    },
  })
}
