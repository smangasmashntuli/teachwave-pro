import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, BookOpen, Trophy, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface StudentStats {
  enrolledSubjects: number;
  upcomingClasses: number;
  completedAssignments: number;
  attendanceRate: number;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats>({
    enrolledSubjects: 0,
    upcomingClasses: 0,
    completedAssignments: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user?.id]);

  const fetchStudentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch student enrollments
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const enrolledSubjects = enrollments?.length || 0;

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
              <Button className="w-full" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Learning Materials
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                View Class Schedule
              </Button>
              <Button className="w-full" variant="outline">
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
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium">Enrolled in Mathematics</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Trophy className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">Completed Science Quiz</p>
                  <p className="text-sm text-muted-foreground">1 week ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Calendar className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="font-medium">Attended English Class</p>
                  <p className="text-sm text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
