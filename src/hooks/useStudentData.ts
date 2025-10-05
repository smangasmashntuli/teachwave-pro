import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStudentData = () => {
  const { user } = useAuth();

  // Get student's subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["student-subjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("student_subjects")
        .select("*")
        .eq("student_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get upcoming classes
  const { data: upcomingClasses, isLoading: classesLoading } = useQuery({
    queryKey: ["upcoming-classes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("virtual_classes")
        .select(`
          *,
          subjects (
            name
          )
        `)
        .gte("scheduled_start", new Date().toISOString())
        .in("subject_id", subjects?.map(s => s.subject_id) || [])
        .order("scheduled_start")
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!subjects,
  });

  // Get pending assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["pending-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("assignments")
        .select(`
          *,
          subjects (
            name
          ),
          assignment_submissions!left (
            id,
            student_id
          )
        `)
        .in("subject_id", subjects?.map(s => s.subject_id) || [])
        .eq("is_published", true)
        .is("assignment_submissions.student_id", null) // Not yet submitted
        .order("due_date");
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!subjects,
  });

  // Get recent content
  const { data: recentContent, isLoading: contentLoading } = useQuery({
    queryKey: ["recent-content", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("learning_content")
        .select(`
          *,
          subjects (
            name
          )
        `)
        .in("subject_id", subjects?.map(s => s.subject_id) || [])
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!subjects,
  });

  // Get attendance summary
  const { data: attendanceSummary } = useQuery({
    queryKey: ["attendance-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await (supabase as any)
        .from("student_attendance_summary")
        .select("*")
        .eq("student_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    subjects,
    upcomingClasses,
    assignments,
    recentContent,
    attendanceSummary,
    isLoading: subjectsLoading || classesLoading || assignmentsLoading || contentLoading,
  };
};

// Hook for quiz attempts
export const useStudentQuizzes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student-quizzes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("quizzes")
        .select(`
          *,
          subjects (
            name
          ),
          quiz_attempts!left (
            id,
            student_id,
            is_completed,
            total_score
          )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};