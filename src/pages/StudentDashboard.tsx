import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, BookOpen, Trophy, CheckCircle, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import StudentGroupSelection from "@/components/student/StudentGroupSelection";

interface StudentStats {
  enrolledSubjects: number;
  upcomingClasses: number;
  completedAssignments: number;
  attendanceRate: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'assignment' | 'class' | 'content';
  title: string;
  subject: string;
  date: string;
  icon: any;
  iconColor: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats>({
    enrolledSubjects: 0,
    upcomingClasses: 0,
    completedAssignments: 0,
    attendanceRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEnrollment, setHasEnrollment] = useState<boolean | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user?.id]);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      const activities: RecentActivity[] = [];

      // First get student's enrolled subject IDs
      const { data: subjectEnrollments } = await supabase
        .from('subject_enrollments')
        .select('subject_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const enrolledSubjectIds = subjectEnrollments?.map((e: any) => e.subject_id) || [];

      // Get recent assignments from enrolled subjects
      const { data: recentAssignments } = enrolledSubjectIds.length > 0 ? await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          subjects (name)
        `)
        .in('subject_id', enrolledSubjectIds)
        .order('created_at', { ascending: false })
        .limit(3) : { data: [] };

      // Get recent virtual classes
      const { data: recentClasses } = await supabase
        .from('virtual_classes')
        .select(`
          id,
          class_name,
          scheduled_start,
          subject_id
        `)
        .order('scheduled_start', { ascending: false })
        .limit(2);

      // Add assignments to activity
      if (recentAssignments) {
        recentAssignments.forEach((assignment: any) => {
          activities.push({
            id: `assignment-${assignment.id}`,
            type: 'assignment',
            title: assignment.title,
            subject: assignment.subjects?.name || 'Unknown Subject',
            date: new Date(assignment.due_date).toLocaleDateString(),
            icon: FileText,
            iconColor: 'text-blue-500'
          });
        });
      }

      // Add classes to activity
      if (recentClasses) {
        recentClasses.forEach((classItem: any) => {
          activities.push({
            id: `class-${classItem.id}`,
            type: 'class',
            title: classItem.class_name || 'Class',
            subject: 'Virtual Class',
            date: new Date(classItem.scheduled_start).toLocaleDateString(),
            icon: BookOpen,
            iconColor: 'text-green-500'
          });
        });
      }

      // Sort by date and take most recent 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchStudentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if student has an active enrollment
      const { data: enrollments } = await (supabase as any)
        .from('student_enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const hasActiveEnrollment = enrollments && enrollments.length > 0;
      setHasEnrollment(hasActiveEnrollment);

      // If no enrollment, stop here and show selection component
      if (!hasActiveEnrollment) {
        setLoading(false);
        return;
      }

      // Count subject_enrollments (specific subjects) for the student
      const { data: subjectEnrollments } = await (supabase as any)
        .from('subject_enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const enrolledSubjects = subjectEnrollments?.length || 0;

      // Fetch upcoming classes count
      const { count: upcomingClassesCount } = await supabase
        .from('virtual_classes')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_start', new Date().toISOString());

      // Fetch completed quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', user.id)
        .eq('completed', true);

      const completedAssignments = quizAttempts?.length || 0;

      // Calculate attendance rate
      const { data: attendance } = await supabase
        .from('class_attendance')
        .select('*')
        .eq('student_id', user.id);

      const totalAttendance = attendance?.length || 0;
      const presentAttendance = attendance?.filter((a: any) => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

      setStats({
        enrolledSubjects,
        upcomingClasses: upcomingClassesCount || 0,
        completedAssignments,
        attendanceRate,
      });

      // Fetch recent activity
      await fetchRecentActivity();

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If student hasn't selected grade and subjects yet, show selection component
  if (hasEnrollment === false) {
    return (
      <DashboardLayout>
        <StudentGroupSelection />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back! Here's your learning progress.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchStudentData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrolledSubjects}</div>
              <p className="text-xs text-muted-foreground">Active enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Assignments</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAssignments}</div>
              <p className="text-xs text-muted-foreground">Total completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
              <Progress value={stats.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/student/subjects')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Learning Materials
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/student/classes')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Class Schedule
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/student/assignments')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Take Available Quizzes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <IconComponent className={`h-6 w-6 ${activity.iconColor}`} />
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.subject} • {activity.date}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>No recent activity found</p>
                  <p className="text-sm">Complete assignments or attend classes to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
