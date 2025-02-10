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
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          phone?: string | null
          language?: string
          theme?: string
          semi_auto_complete?: boolean
          ai_data_retention?: boolean
          ai_model?: string
          image_model?: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          language?: string
          theme?: string
          semi_auto_complete?: boolean
          ai_data_retention?: boolean
          ai_model?: string
          image_model?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          language?: string
          theme?: string
          semi_auto_complete?: boolean
          ai_data_retention?: boolean
          ai_model?: string
          image_model?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          last_seen_at: string
          device_info: Json
        }
        Insert: {
          id?: string
          user_id: string
          device_info: Json
        }
        Update: {
          last_seen_at?: string
          device_info?: Json
        }
      }
    }
  }
} 