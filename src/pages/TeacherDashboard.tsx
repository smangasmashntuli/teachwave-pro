import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Video, BarChart, Upload, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TeacherStats {
  totalStudents: number;
  subjectsTeaching: number;
  classesThisWeek: number;
  pendingGrading: number;
}

interface TeacherAssignment {
  id: string;
  subject: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
    };
  };
}

interface UpcomingClass {
  id: string;
  title: string;
  subject_name: string;
  grade_name: string;
  scheduled_start: string;
  scheduled_end: string;
  student_count: number;
}

interface VirtualClass {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  subject: {
    name: string;
    grade: {
      name: string;
    };
  };
}

interface RecentActivity {
  id: string;
  action: string;
  subject: string;
  count: string;
  created_at: string;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    subjectsTeaching: 0,
    classesThisWeek: 0,
    pendingGrading: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTeacherData();
    }
  }, [user?.id]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      // Fetch subjects teaching
      const { data: teacherAssignments, error: assignmentsError } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          subject:subjects(id, name, code, grade:grades(name))
        `)
        .eq('teacher_id', user?.id)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Type the data properly
      const typedTeacherAssignments = teacherAssignments as TeacherAssignment[];

      // Fetch total students enrolled in teacher's subjects
      let totalStudents = 0;
      if (typedTeacherAssignments && typedTeacherAssignments.length > 0) {
        const subjectIds = typedTeacherAssignments.map(a => a.subject.id);
        
        for (const subjectId of subjectIds) {
          const { count, error: enrollmentError } = await supabase
            .from('student_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('grade_id', typedTeacherAssignments.find(a => a.subject.id === subjectId)?.subject.grade.id)
            .eq('is_active', true);

          if (enrollmentError) throw enrollmentError;
          totalStudents += count || 0;
        }
      }

      // Fetch upcoming classes (this week)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

      const { data: classes, error: classesError } = await supabase
        .from('virtual_classes')
        .select(`
          id,
          title,
          scheduled_start,
          scheduled_end,
          subject:subjects(name, grade:grades(name))
        `)
        .eq('teacher_id', user?.id)
        .gte('scheduled_start', startOfWeek.toISOString())
        .lte('scheduled_start', endOfWeek.toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5);

      if (classesError) throw classesError;

      // Type the classes data
      const typedClasses = classes as VirtualClass[];

      // Fetch pending quiz submissions for grading
      const { count: pendingCount, error: pendingError } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true)
        .is('total_score', null);

      if (pendingError) throw pendingError;

      // Mock recent activity (you can enhance this with actual activity tracking)
      const mockActivity: RecentActivity[] = [
        { id: '1', action: 'New quiz created', subject: typedTeacherAssignments?.[0]?.subject.name || 'Subject', count: 'Just now', created_at: new Date().toISOString() },
        { id: '2', action: 'Class completed', subject: typedTeacherAssignments?.[1]?.subject.name || 'Subject', count: '2 hours ago', created_at: new Date().toISOString() },
      ];

      setStats({
        totalStudents,
        subjectsTeaching: typedTeacherAssignments?.length || 0,
        classesThisWeek: typedClasses?.length || 0,
        pendingGrading: pendingCount || 0,
      });

      setUpcomingClasses(typedClasses?.map(cls => ({
        id: cls.id,
        title: cls.title,
        subject_name: cls.subject.name,
        grade_name: cls.subject.grade.name,
        scheduled_start: cls.scheduled_start,
        scheduled_end: cls.scheduled_end,
        student_count: Math.floor(Math.random() * 30) + 20, // Mock student count
      })) || []);

      setRecentActivity(mockActivity);

    } catch (error: any) {
      console.error('Error fetching teacher data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let dayLabel = '';
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    const timeLabel = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return `${dayLabel}, ${timeLabel}`;
  };

  const quickStats = [
    { label: "Total Students", value: stats.totalStudents.toString(), icon: Users, color: "text-blue-600" },
    { label: "Subjects Teaching", value: stats.subjectsTeaching.toString(), icon: FileText, color: "text-green-600" },
    { label: "Classes This Week", value: stats.classesThisWeek.toString(), icon: Video, color: "text-purple-600" },
    { label: "Pending Grading", value: stats.pendingGrading.toString(), icon: BarChart, color: "text-orange-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your classes and students</p>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index} className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Real-time from database
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Classes */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Upcoming Classes</CardTitle>
              </div>
              <CardDescription>Your scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingClasses.length > 0 ? (
                upcomingClasses.map((cls, index) => (
                  <div key={cls.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{cls.title}</p>
                      <p className="text-sm text-muted-foreground">{cls.subject_name} - {cls.grade_name}</p>
                      <p className="text-xs text-muted-foreground">{cls.student_count} students</p>
                    </div>
                    <div className="text-sm text-right">
                      <p className="font-medium">{formatDateTime(cls.scheduled_start)}</p>
                      <Button size="sm" variant="link" className="h-auto p-0">
                        Start Class
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No upcoming classes this week</p>
                </div>
              )}
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={fetchTeacherData}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh Data"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-secondary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Latest updates from your classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.subject}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {activity.count}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
            <Button variant="outline">
              <Video className="mr-2 h-4 w-4" />
              Schedule Class
            </Button>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
