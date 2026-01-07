import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EmailTemplate } from '@/types'
import { toast } from 'sonner'

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email_templates'],
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []) as EmailTemplate[]
    },
  })
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: template.name || 'New Template',
          subject: template.subject || null,
          body: template.body || null,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] })
      toast.success('Template created')
    },
  })
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] })
      toast.success('Template saved')
    },
  })
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] })
      toast.success('Template deleted')
    },
  })
}
