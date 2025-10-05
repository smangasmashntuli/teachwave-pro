export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          subject_id: string | null
          submission_instructions: string | null
          teacher_id: string | null
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          subject_id?: string | null
          submission_instructions?: string | null
          teacher_id?: string | null
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          subject_id?: string | null
          submission_instructions?: string | null
          teacher_id?: string | null
          title?: string
          total_marks?: number
          updated_at?: string
        }
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          feedback: string | null
          file_url: string | null
          id: string
          is_graded: boolean | null
          marks_awarded: number | null
          student_id: string | null
          submission_text: string | null
          submitted_at: string
        }
        Insert: {
          assignment_id?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          is_graded?: boolean | null
          marks_awarded?: number | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string
        }
        Update: {
          assignment_id?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          is_graded?: boolean | null
          marks_awarded?: number | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string
        }
      }
      class_attendance: {
        Row: {
          attendance_code_used: string | null
          class_id: string | null
          id: string
          marked_at: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          student_id: string | null
        }
        Insert: {
          attendance_code_used?: string | null
          class_id?: string | null
          id?: string
          marked_at?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_id?: string | null
        }
        Update: {
          attendance_code_used?: string | null
          class_id?: string | null
          id?: string
          marked_at?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          student_id?: string | null
        }
      }
      grades: {
        Row: {
          academic_year: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
      }
      learning_content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_published: boolean | null
          subject_id: string | null
          teacher_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          subject_id?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          subject_id?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
      }
      quiz_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string | null
        }
        Insert: {
          answer_text?: string | null
          attempt_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string | null
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string | null
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          is_completed: boolean | null
          quiz_id: string | null
          started_at: string
          student_id: string | null
          submitted_at: string | null
          time_taken: number | null
          total_score: number | null
        }
        Insert: {
          id?: string
          is_completed?: boolean | null
          quiz_id?: string | null
          started_at?: string
          student_id?: string | null
          submitted_at?: string | null
          time_taken?: number | null
          total_score?: number | null
        }
        Update: {
          id?: string
          is_completed?: boolean | null
          quiz_id?: string | null
          started_at?: string
          student_id?: string | null
          submitted_at?: string | null
          time_taken?: number | null
          total_score?: number | null
        }
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          marks: number
          options: Json | null
          order_number: number
          question_text: string
          question_type: Database["public"]["Enums"]["quiz_type"]
          quiz_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          marks?: number
          options?: Json | null
          order_number: number
          question_text: string
          question_type: Database["public"]["Enums"]["quiz_type"]
          quiz_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          marks?: number
          options?: Json | null
          order_number?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["quiz_type"]
          quiz_id?: string | null
        }
      }
      quizzes: {
        Row: {
          auto_grade: boolean | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_published: boolean | null
          start_date: string | null
          subject_id: string | null
          teacher_id: string | null
          time_limit: number | null
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          auto_grade?: boolean | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean | null
          start_date?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          time_limit?: number | null
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          auto_grade?: boolean | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean | null
          start_date?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          time_limit?: number | null
          title?: string
          total_marks?: number
          updated_at?: string
        }
      }
      student_enrollments: {
        Row: {
          enrollment_date: string
          grade_id: string | null
          id: string
          is_active: boolean | null
          student_id: string | null
        }
        Insert: {
          enrollment_date?: string
          grade_id?: string | null
          id?: string
          is_active?: boolean | null
          student_id?: string | null
        }
        Update: {
          enrollment_date?: string
          grade_id?: string | null
          id?: string
          is_active?: boolean | null
          student_id?: string | null
        }
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          grade_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          grade_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          grade_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
      }
      teacher_assignments: {
        Row: {
          assigned_date: string
          id: string
          is_active: boolean | null
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          assigned_date?: string
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          assigned_date?: string
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          teacher_id?: string | null
        }
      }
      virtual_classes: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          attendance_code: string | null
          created_at: string
          description: string | null
          id: string
          meeting_url: string | null
          recording_url: string | null
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["class_status"] | null
          subject_id: string | null
          teacher_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          attendance_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["class_status"] | null
          subject_id?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          attendance_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["class_status"] | null
          subject_id?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string
        }
      }
    }
    Views: {
      student_attendance_summary: {
        Row: {
          attendance_percentage: number | null
          classes_attended: number | null
          classes_late: number | null
          student_id: string | null
          student_name: string | null
          subject_name: string | null
          total_classes: number | null
        }
      }
      student_performance_summary: {
        Row: {
          assignment_submissions: number | null
          avg_assignment_score: number | null
          avg_quiz_score: number | null
          quiz_attempts: number | null
          student_id: string | null
          student_name: string | null
          subject_name: string | null
        }
      }
      student_subjects: {
        Row: {
          grade_name: string | null
          student_id: string | null
          subject_code: string | null
          subject_description: string | null
          subject_id: string | null
          subject_name: string | null
        }
      }
      teacher_subjects: {
        Row: {
          grade_name: string | null
          subject_code: string | null
          subject_description: string | null
          subject_id: string | null
          subject_name: string | null
          teacher_id: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      class_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      content_type: "pdf" | "video" | "document" | "link" | "image"
      quiz_type: "multiple_choice" | "short_answer" | "essay" | "true_false"
      user_role: "student" | "teacher" | "admin"
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
