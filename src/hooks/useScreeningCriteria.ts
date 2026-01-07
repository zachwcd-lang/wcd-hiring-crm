import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScreeningCriteria, CriterionConfig } from '@/types'
import { toast } from 'sonner'

// Helper to transform DB row to ScreeningCriteria type
function transformScreeningCriteria(row: Record<string, unknown>): ScreeningCriteria {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    name: row.name as string,
    criteria: row.criteria as Record<string, CriterionConfig>,
    prompt_template: row.prompt_template as string,
    is_active: row.is_active as boolean,
  }
}

export function useScreeningCriteria() {
  return useQuery({
    queryKey: ['screening_criteria'],
    queryFn: async (): Promise<ScreeningCriteria[]> => {
      const { data, error } = await supabase
        .from('screening_criteria')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(row => transformScreeningCriteria(row as Record<string, unknown>))
    },
  })
}

export function useActiveScreeningCriteria() {
  return useQuery({
    queryKey: ['screening_criteria', 'active'],
    queryFn: async (): Promise<ScreeningCriteria | null> => {
      const { data, error } = await supabase
        .from('screening_criteria')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }

      return transformScreeningCriteria(data as Record<string, unknown>)
    },
  })
}

export function useCreateScreeningCriteria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (criteria: Partial<ScreeningCriteria>) => {
      // If setting as active, deactivate others first
      if (criteria.is_active) {
        await supabase
          .from('screening_criteria')
          .update({ is_active: false } as never)
          .eq('is_active', true)
      }

      const insertData = {
        name: criteria.name || 'New Criteria',
        criteria: criteria.criteria || {},
        prompt_template: criteria.prompt_template || '',
        is_active: criteria.is_active ?? false,
      }

      const { data, error } = await supabase
        .from('screening_criteria')
        .insert(insertData as never)
        .select()
        .single()

      if (error) throw error
      return transformScreeningCriteria(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screening_criteria'] })
      toast.success('Screening criteria created')
    },
    onError: (error) => {
      toast.error('Failed to create criteria', { description: error.message })
    },
  })
}

export function useUpdateScreeningCriteria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<ScreeningCriteria>
    }) => {
      // If setting as active, deactivate others first
      if (updates.is_active) {
        await supabase
          .from('screening_criteria')
          .update({ is_active: false } as never)
          .eq('is_active', true)
          .neq('id', id)
      }

      const { data, error } = await supabase
        .from('screening_criteria')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return transformScreeningCriteria(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screening_criteria'] })
      toast.success('Screening criteria updated')
    },
    onError: (error) => {
      toast.error('Failed to update criteria', { description: error.message })
    },
  })
}

export function useDeleteScreeningCriteria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('screening_criteria')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screening_criteria'] })
      toast.success('Screening criteria deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete criteria', { description: error.message })
    },
  })
}

// Default criteria config for new setups
export const DEFAULT_CRITERIA: Record<string, CriterionConfig> = {
  location: {
    weight: 15,
    description: 'Proximity to Portland/97210 area',
  },
  availability: {
    weight: 15,
    description: 'Schedule flexibility and hours available',
  },
  streaming_experience: {
    weight: 20,
    description: 'Prior live streaming or video content creation experience',
  },
  product_knowledge: {
    weight: 15,
    description: 'Familiarity with sports cards, collectibles, or similar products',
  },
  social_presence: {
    weight: 10,
    description: 'Social media following and engagement',
  },
  sales_experience: {
    weight: 15,
    description: 'Sales or customer-facing experience',
  },
  culture_fit: {
    weight: 10,
    description: 'Enthusiasm, communication style, and team fit',
  },
}

export const DEFAULT_PROMPT_TEMPLATE = `You are an AI assistant helping screen candidates for a Streamer position at West Coast Deals, a live commerce company on Whatnot.

Evaluate this candidate based on their screening responses:

{{screening_answers}}

Score each criterion from 1-10 and provide a brief note explaining your score:
- Location (weight: {{weights.location}}%): How close are they to Portland/97210?
- Availability (weight: {{weights.availability}}%): Can they work flexible hours including evenings/weekends?
- Streaming Experience (weight: {{weights.streaming_experience}}%): Do they have live streaming experience?
- Product Knowledge (weight: {{weights.product_knowledge}}%): Are they familiar with sports cards/collectibles?
- Social Presence (weight: {{weights.social_presence}}%): Do they have social media following?
- Sales Experience (weight: {{weights.sales_experience}}%): Have they done sales or customer service?
- Culture Fit (weight: {{weights.culture_fit}}%): Do they seem enthusiastic and a good team fit?

Provide:
1. An overall weighted score (0-100)
2. A recommendation: STRONG_YES, YES, MAYBE, LEAN_NO, or NO
3. Key green flags (positives)
4. Key red flags (concerns)
5. A brief summary (2-3 sentences)
6. Suggested interview questions based on their responses`
