export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          phone: string | null
          position: string | null
          stage: string
          source: string | null
          rating: number | null
          resume_url: string | null
          notes: Json
          calendly_event_id: string | null
          stage_changed_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          phone?: string | null
          position?: string | null
          stage?: string
          source?: string | null
          rating?: number | null
          resume_url?: string | null
          notes?: Json
          calendly_event_id?: string | null
          stage_changed_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          position?: string | null
          stage?: string
          source?: string | null
          rating?: number | null
          resume_url?: string | null
          notes?: Json
          calendly_event_id?: string | null
          stage_changed_at?: string
        }
      }
    }
  }
}
