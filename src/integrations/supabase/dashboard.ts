import { supabase } from './client';
import type { Database } from './types';

export type Class = Database['public']['Tables']['classes']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
export type Grade = Database['public']['Tables']['grades']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type ClassSession = Database['public']['Tables']['class_sessions']['Row'];
export type StudentProgress = Database['public']['Tables']['student_progress']['Row'];
export type ClassEnrollment = Database['public']['Tables']['class_enrollments']['Row'];

export interface ClassWithStats extends Class {
  enrolled_students: number;
  average_grade: number;
  attendance_rate: number;
  last_session: string | null;
}

export interface StudentWithProgress extends Student {
  current_grade: number | null;
  grade_trend: string | null;
  attendance_rate: number | null;
  assignment_completion_rate: number | null;
  last_activity: string | null;
}

export interface AssignmentWithStats extends Assignment {
  submitted_count: number;
  graded_count: number;
  average_score: number;
}

export class TeacherDashboardService {
  private teacherId: string;
  
  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  // Get teacher's classes with statistics
  async getClassesWithStats(): Promise<ClassWithStats[]> {
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_enrollments!inner(count),
        grades(percentage),
        attendance(status),
        class_sessions(session_date)
      `)
      .eq('teacher_id', this.teacherId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching classes:', error);
      return [];
    }

    // Use any to bypass TypeScript issues temporarily
    return (classes as any[]).map((classData: any) => ({
      ...classData,
      enrolled_students: classData.class_enrollments?.length || 0,
      average_grade: this.calculateAverageGrade(classData.grades || []),
      attendance_rate: this.calculateAttendanceRate(classData.attendance || []),
      last_session: this.getLastSession(classData.class_sessions || [])
    }));
  }

  // Get students for a specific class with their progress
  async getClassStudents(classId: string): Promise<StudentWithProgress[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`
        student_id,
        students!inner(*),
        student_progress(
          current_grade,
          grade_trend,
          attendance_rate,
          assignment_completion_rate,
          last_activity
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching class students:', error);
      return [];
    }

    return (data as any[]).map((enrollment: any) => ({
      ...enrollment.students,
      current_grade: enrollment.student_progress?.[0]?.current_grade || null,
      grade_trend: enrollment.student_progress?.[0]?.grade_trend || null,
      attendance_rate: enrollment.student_progress?.[0]?.attendance_rate || null,
      assignment_completion_rate: enrollment.student_progress?.[0]?.assignment_completion_rate || null,
      last_activity: enrollment.student_progress?.[0]?.last_activity || null,
    }));
  }

  // Get assignments for a class with statistics
  async getClassAssignments(classId: string): Promise<AssignmentWithStats[]> {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        grades(points_earned, percentage)
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }

    return (assignments as any[]).map((assignment: any) => ({
      ...assignment,
      submitted_count: assignment.grades?.length || 0,
      graded_count: assignment.grades?.filter((g: any) => g.points_earned !== null).length || 0,
      average_score: this.calculateAverageGrade(assignment.grades || [])
    }));
  }

  // Get recent grades for a class
  async getRecentGrades(classId: string, limit: number = 10): Promise<(Grade & { student_name: string; assignment_title: string })[]> {
    const { data, error } = await supabase
      .from('grades')
      .select(`
        *,
        students!inner(first_name, last_name),
        assignments!inner(title, class_id)
      `)
      .eq('assignments.class_id', classId)
      .order('graded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent grades:', error);
      return [];
    }

    return (data as any[]).map((grade: any) => ({
      ...grade,
      student_name: `${grade.students.first_name} ${grade.students.last_name}`,
      assignment_title: grade.assignments.title
    }));
  }

  // Get attendance summary for a class
  async getAttendanceSummary(classId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        students!inner(first_name, last_name)
      `)
      .eq('class_id', classId)
      .gte('class_date', startDate.toISOString().split('T')[0])
      .order('class_date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }

    return data;
  }

  // Get analytics data for dashboard
  async getDashboardAnalytics() {
    try {
      const [classesResult, studentsResult, gradesResult] = await Promise.all([
        supabase
          .from('classes')
          .select('id, title, created_at')
          .eq('teacher_id', this.teacherId)
          .eq('is_active', true),
        
        supabase
          .from('class_enrollments')
          .select(`
            student_id,
            classes!inner(teacher_id)
          `)
          .eq('classes.teacher_id', this.teacherId)
          .eq('is_active', true),
        
        supabase
          .from('grades')
          .select(`
            percentage,
            graded_at,
            assignments!inner(class_id),
            classes!inner(teacher_id)
          `)
          .eq('classes.teacher_id', this.teacherId)
          .gte('graded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalClasses = classesResult.data?.length || 0;
      const totalStudents = new Set((studentsResult.data as any[])?.map((s: any) => s.student_id)).size || 0;
      const recentGrades = gradesResult.data || [];
      const averageGrade = recentGrades.length > 0 
        ? (recentGrades as any[]).reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / recentGrades.length 
        : 0;

      return {
        totalClasses,
        totalStudents,
        averageGrade: Math.round(averageGrade * 100) / 100,
        recentActivity: recentGrades.length,
        classGrowth: await this.calculateClassGrowth(),
        studentEngagement: await this.calculateStudentEngagement()
      };
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return {
        totalClasses: 0,
        totalStudents: 0,
        averageGrade: 0,
        recentActivity: 0,
        classGrowth: 0,
        studentEngagement: 0
      };
    }
  }

  // Create a new assignment
  async createAssignment(assignment: any) {
    const { data, error } = await (supabase as any)
      .from('assignments')
      .insert([assignment])
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }

    return data;
  }

  // Update a grade
  async updateGrade(gradeId: string, updates: any) {
    const { data, error } = await (supabase as any)
      .from('grades')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', gradeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating grade:', error);
      throw error;
    }

    return data;
  }

  // Record attendance
  async recordAttendance(classId: string, studentId: string, status: string, date: string) {
    const { data, error } = await (supabase as any)
      .from('attendance')
      .upsert({
        class_id: classId,
        student_id: studentId,
        class_date: date,
        status,
        recorded_by: this.teacherId,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }

    return data;
  }

  // Start a class session
  async startClassSession(classId: string, sessionTitle: string, meetingLink: string) {
    const { data, error } = await (supabase as any)
      .from('class_sessions')
      .insert({
        class_id: classId,
        session_title: sessionTitle,
        session_date: new Date().toISOString(),
        meeting_link: meetingLink
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting class session:', error);
      throw error;
    }

    return data;
  }

  // Subscribe to real-time changes
  subscribeToClassChanges(classId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('class_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `assignment_id=in.(select id from assignments where class_id=eq.${classId})`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `class_id=eq.${classId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }

  // Private helper methods
  private calculateAverageGrade(grades: any[]): number {
    if (!grades.length) return 0;
    const validGrades = grades.filter(g => g.percentage !== null);
    if (!validGrades.length) return 0;
    return Math.round(validGrades.reduce((sum, g) => sum + g.percentage, 0) / validGrades.length * 100) / 100;
  }

  private calculateAttendanceRate(attendance: any[]): number {
    if (!attendance.length) return 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100 * 100) / 100;
  }

  private getLastSession(sessions: any[]): string | null {
    if (!sessions.length) return null;
    const sorted = sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    return sorted[0]?.session_date || null;
  }

  private async calculateClassGrowth(): Promise<number> {
    // Calculate growth in classes over the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { data, error } = await supabase
      .from('classes')
      .select('created_at')
      .eq('teacher_id', this.teacherId)
      .gte('created_at', lastMonth.toISOString());

    return data?.length || 0;
  }

  private async calculateStudentEngagement(): Promise<number> {
    // Calculate student engagement based on recent activity
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const { data, error } = await supabase
      .from('analytics_events')
      .select('id')
      .gte('timestamp', lastWeek.toISOString())
      .in('class_id', await this.getTeacherClassIds());

    return data?.length || 0;
  }

  private async getTeacherClassIds(): Promise<string[]> {
    const { data } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', this.teacherId);

    return (data as any[])?.map((c: any) => c.id) || [];
  }
}

// Export a singleton service that updates when user changes
let dashboardService: TeacherDashboardService | null = null;

export const getDashboardService = (teacherId?: string): TeacherDashboardService => {
  if (!dashboardService || (teacherId && dashboardService['teacherId'] !== teacherId)) {
    if (!teacherId) {
      throw new Error('Teacher ID required to initialize dashboard service');
    }
    dashboardService = new TeacherDashboardService(teacherId);
  }
  return dashboardService;
};