export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      classes: {
        Row: {
          id: string
          title: string
          subject: string
          grade_level: string
          description: string | null
          teacher_id: string
          class_code: string
          schedule_day: string | null
          schedule_time: string | null
          duration_minutes: number | null
          max_students: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          subject: string
          grade_level: string
          description?: string | null
          teacher_id: string
          class_code: string
          schedule_day?: string | null
          schedule_time?: string | null
          duration_minutes?: number | null
          max_students?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          subject?: string
          grade_level?: string
          description?: string | null
          teacher_id?: string
          class_code?: string
          schedule_day?: string | null
          schedule_time?: string | null
          duration_minutes?: number | null
          max_students?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          student_number: string | null
          first_name: string
          last_name: string
          email: string
          grade_level: string | null
          date_of_birth: string | null
          parent_email: string | null
          phone_number: string | null
          address: string | null
          enrollment_date: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          student_number?: string | null
          first_name: string
          last_name: string
          email: string
          grade_level?: string | null
          date_of_birth?: string | null
          parent_email?: string | null
          phone_number?: string | null
          address?: string | null
          enrollment_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          student_number?: string | null
          first_name?: string
          last_name?: string
          email?: string
          grade_level?: string | null
          date_of_birth?: string | null
          parent_email?: string | null
          phone_number?: string | null
          address?: string | null
          enrollment_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      class_enrollments: {
        Row: {
          id: string
          class_id: string
          student_id: string
          enrolled_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          enrolled_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          enrolled_at?: string | null
          is_active?: boolean | null
        }
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          title: string
          description: string | null
          assignment_type: string | null
          total_points: number | null
          due_date: string | null
          instructions: string | null
          attachments: Json | null
          is_published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          description?: string | null
          assignment_type?: string | null
          total_points?: number | null
          due_date?: string | null
          instructions?: string | null
          attachments?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          title?: string
          description?: string | null
          assignment_type?: string | null
          total_points?: number | null
          due_date?: string | null
          instructions?: string | null
          attachments?: Json | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      grades: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          points_earned: number | null
          percentage: number | null
          letter_grade: string | null
          feedback: string | null
          submitted_at: string | null
          graded_at: string | null
          is_late: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          points_earned?: number | null
          percentage?: number | null
          letter_grade?: string | null
          feedback?: string | null
          submitted_at?: string | null
          graded_at?: string | null
          is_late?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          points_earned?: number | null
          percentage?: number | null
          letter_grade?: string | null
          feedback?: string | null
          submitted_at?: string | null
          graded_at?: string | null
          is_late?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          class_id: string
          student_id: string
          class_date: string
          status: string | null
          notes: string | null
          recorded_by: string | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          class_date: string
          status?: string | null
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          class_date?: string
          status?: string | null
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string | null
        }
      }
      class_sessions: {
        Row: {
          id: string
          class_id: string
          session_title: string | null
          session_date: string | null
          duration_minutes: number | null
          recording_url: string | null
          meeting_link: string | null
          session_notes: string | null
          attendance_count: number | null
          is_recorded: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          class_id: string
          session_title?: string | null
          session_date?: string | null
          duration_minutes?: number | null
          recording_url?: string | null
          meeting_link?: string | null
          session_notes?: string | null
          attendance_count?: number | null
          is_recorded?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          session_title?: string | null
          session_date?: string | null
          duration_minutes?: number | null
          recording_url?: string | null
          meeting_link?: string | null
          session_notes?: string | null
          attendance_count?: number | null
          is_recorded?: boolean | null
          created_at?: string | null
        }
      }
      student_progress: {
        Row: {
          id: string
          class_id: string
          student_id: string
          current_grade: number | null
          grade_trend: string | null
          attendance_rate: number | null
          assignment_completion_rate: number | null
          participation_score: number | null
          last_activity: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          current_grade?: number | null
          grade_trend?: string | null
          attendance_rate?: number | null
          assignment_completion_rate?: number | null
          participation_score?: number | null
          last_activity?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          current_grade?: number | null
          grade_trend?: string | null
          attendance_rate?: number | null
          assignment_completion_rate?: number | null
          participation_score?: number | null
          last_activity?: string | null
          notes?: string | null
          updated_at?: string | null
        }
      }
      analytics_events: {
        Row: {
          id: string
          class_id: string
          student_id: string
          event_type: string
          event_data: Json | null
          duration_seconds: number | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          event_type: string
          event_data?: Json | null
          duration_seconds?: number | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          event_type?: string
          event_data?: Json | null
          duration_seconds?: number | null
          timestamp?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          sender_id: string | null
          type: string
          title: string
          message: string | null
          data: Json | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          recipient_id: string
          sender_id?: string | null
          type: string
          title: string
          message?: string | null
          data?: Json | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          recipient_id?: string
          sender_id?: string | null
          type?: string
          title?: string
          message?: string | null
          data?: Json | null
          is_read?: boolean | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
