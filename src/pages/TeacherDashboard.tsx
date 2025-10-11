import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Video, BarChart, Upload, Calendar, TrendingUp, Clock, AlertTriangle, Star, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import UploadContent from "@/components/teacher/UploadContent";
import CreateAssignment from "@/components/teacher/CreateAssignment";
import ScheduleClass from "@/components/teacher/ScheduleClass";
import Analytics from "@/components/teacher/Analytics";
import TakeAttendance from "@/components/teacher/TakeAttendance";
import StartClass from "@/components/teacher/StartClass";
import GradeTracker from "@/components/teacher/GradeTracker";
import { AuthContext } from "@/contexts/AuthContext";
import { getDashboardService, type ClassWithStats, type StudentWithProgress, type AssignmentWithStats } from "@/integrations/supabase/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Modal states
  const [showUploadContent, setShowUploadContent] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showScheduleClass, setShowScheduleClass] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTakeAttendance, setShowTakeAttendance] = useState(false);
  const [showStartClass, setShowStartClass] = useState(false);
  const [showGradeTracker, setShowGradeTracker] = useState(false);
  
  // Data states
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    averageGrade: 0,
    recentActivity: 0,
    classGrowth: 0,
    studentEngagement: 0
  });
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassWithStats | null>(null);
  const [realTimeChannel, setRealTimeChannel] = useState<any>(null);

  const teacherId = user?.id || '';
  const dashboardService = getDashboardService(teacherId);

  // Load dashboard data
  useEffect(() => {
    if (teacherId) {
      loadDashboardData();
      setupRealTimeSubscription();
      
      // Set up auto-refresh every 5 minutes for real-time updates
      const interval = setInterval(() => {
        loadDashboardData();
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(interval);
        if (realTimeChannel) {
          realTimeChannel.unsubscribe();
        }
      };
    }
  }, [teacherId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [classesData, statsData] = await Promise.all([
        dashboardService.getClassesWithStats(),
        dashboardService.getDashboardAnalytics()
      ]);

      setClasses(classesData);
      setDashboardStats(statsData);

      // Load recent grades for the first class
      if (classesData.length > 0) {
        const recentGradesData = await dashboardService.getRecentGrades(classesData[0].id);
        setRecentGrades(recentGradesData);
      }

      // Load real upcoming classes from database
      const upcoming = await loadRealUpcomingClasses();
      setUpcomingClasses(upcoming);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    if (classes.length > 0) {
      const channel = dashboardService.subscribeToClassChanges(classes[0].id, (payload) => {
        console.log('Real-time update:', payload);
        // Refresh data when changes occur
        loadDashboardData();
      });
      setRealTimeChannel(channel);
    }
  };

  const loadRealUpcomingClasses = async () => {
    try {
      // Get actual upcoming virtual classes from database
      const now = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: upcomingClassesData, error } = await supabase
        .from('virtual_classes')
        .select(`
          id,
          title,
          scheduled_start,
          scheduled_end,
          subjects (
            name,
            grades (name)
          )
        `)
        .eq('teacher_id', teacherId)
        .gte('scheduled_start', now)
        .lte('scheduled_start', nextWeek)
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error loading upcoming classes:', error);
        return [];
      }

      return upcomingClassesData?.map((cls: any) => ({
        id: cls.id,
        subject: `${cls.subjects?.name || cls.title} - ${cls.subjects?.grades?.name || 'Unknown Grade'}`,
        time: new Date(cls.scheduled_start).toLocaleString(),
        duration: `${Math.round((new Date(cls.scheduled_end).getTime() - new Date(cls.scheduled_start).getTime()) / (1000 * 60))} min`,
        students: 'Loading...', // We'll enhance this later
        classData: cls
      })) || [];
    } catch (error) {
      console.error('Error loading upcoming classes:', error);
      return [];
    }
  };

  const quickStats = [
    { 
      label: "Active Classes", 
      value: dashboardStats.totalClasses.toString(), 
      icon: FileText, 
      color: "text-blue-500",
      trend: dashboardStats.classGrowth > 0 ? `+${dashboardStats.classGrowth}` : null
    },
    { 
      label: "Total Students", 
      value: dashboardStats.totalStudents.toString(), 
      icon: Users, 
      color: "text-green-500",
      trend: null
    },
    { 
      label: "Average Grade", 
      value: `${dashboardStats.averageGrade}%`, 
      icon: GraduationCap, 
      color: "text-purple-500",
      trend: dashboardStats.averageGrade >= 80 ? "Excellent" : dashboardStats.averageGrade >= 70 ? "Good" : "Needs Attention"
    },
    { 
      label: "Recent Activity", 
      value: dashboardStats.recentActivity.toString(), 
      icon: TrendingUp, 
      color: "text-orange-500",
      trend: dashboardStats.studentEngagement > 0 ? "Active" : null
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your classes and students • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <Badge variant="default" className="bg-green-500">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Live Data
          </Badge>
        </div>

        {/* Quick Stats */}
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
                  {stat.trend && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {stat.trend}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="grades">Recent Grades</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
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
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {upcomingClasses.map((cls, index) => (
                        <div key={cls.id || index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium">{cls.subject}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {cls.time}
                              </p>
                              {cls.duration && (
                                <p className="flex items-center gap-2">
                                  <Video className="h-3 w-3" />
                                  Duration: {cls.duration}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mb-2"
                              onClick={() => navigate('/teacher/subjects')}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default" 
                              onClick={() => {
                                setSelectedClass(cls.classData);
                                setShowStartClass(true);
                              }}
                            >
                              Start Class
                            </Button>
                          </div>
                        </div>
                      ))}
                      {upcomingClasses.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No upcoming classes scheduled</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Grades */}
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-secondary" />
                      <CardTitle>Recent Grades</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowGradeTracker(true)}
                    >
                      View All
                    </Button>
                  </div>
                  <CardDescription>Latest graded assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {recentGrades.map((grade, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{grade.student_name}</p>
                            <p className="text-sm text-muted-foreground">{grade.assignment_title}</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={grade.percentage >= 80 ? "default" : grade.percentage >= 60 ? "secondary" : "destructive"}
                              className="text-sm"
                            >
                              {grade.percentage}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(grade.graded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {recentGrades.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No recent grades to display</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => setShowUploadContent(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Content
                </Button>
                <Button variant="outline" onClick={() => setShowCreateAssignment(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
                <Button variant="outline" onClick={() => setShowScheduleClass(true)}>
                  <Video className="mr-2 h-4 w-4" />
                  Schedule Class
                </Button>
                <Button variant="outline" onClick={() => setShowAnalytics(true)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" onClick={() => setShowTakeAttendance(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Take Attendance
                </Button>
                <Button variant="outline" onClick={() => setShowGradeTracker(true)}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Grade Tracker
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <Card key={cls.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cls.title}</CardTitle>
                      <Badge variant="outline">{cls.grade_level}</Badge>
                    </div>
                    <CardDescription>{cls.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{cls.enrolled_students}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{cls.average_grade}%</p>
                        <p className="text-xs text-muted-foreground">Avg Grade</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Attendance Rate</span>
                        <span>{cls.attendance_rate}%</span>
                      </div>
                      <Progress value={cls.attendance_rate} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedClass(cls);
                          setShowStartClass(true);
                        }}
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Start Class
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowGradeTracker(true)}
                      >
                        <GraduationCap className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {classes.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No classes found. Create your first class!</p>
                  <Button className="mt-4" onClick={() => setShowScheduleClass(true)}>
                    Create Class
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Overview</CardTitle>
                <CardDescription>Select a class to view student details</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Choose a class from the Classes tab to view student information</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Grade Management</h3>
              <Button onClick={() => setShowGradeTracker(true)}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Open Grade Tracker
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <Card key={cls.id} className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base">{cls.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Class Average:</span>
                        <Badge variant={cls.average_grade >= 80 ? "default" : cls.average_grade >= 60 ? "secondary" : "destructive"}>
                          {cls.average_grade}%
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowGradeTracker(true)}
                      >
                        Manage Grades
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Components */}
      <UploadContent 
        isOpen={showUploadContent} 
        onClose={() => setShowUploadContent(false)} 
      />
      
      <CreateAssignment 
        isOpen={showCreateAssignment} 
        onClose={() => setShowCreateAssignment(false)} 
      />
      
      <ScheduleClass 
        isOpen={showScheduleClass} 
        onClose={() => setShowScheduleClass(false)} 
      />
      
      <Analytics 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
      
      <TakeAttendance 
        isOpen={showTakeAttendance} 
        onClose={() => setShowTakeAttendance(false)} 
      />
      
      <StartClass 
        isOpen={showStartClass} 
        onClose={() => setShowStartClass(false)}
        classInfo={selectedClass ? {
          title: selectedClass.title,
          subject: selectedClass.subject,
          grade: selectedClass.grade_level, 
          students: selectedClass.enrolled_students,
          time: selectedClass.schedule_time || "Now"
        } : undefined}
      />
      
      <GradeTracker
        isOpen={showGradeTracker}
        onClose={() => setShowGradeTracker(false)}
        classId={selectedClass?.id}
        teacherId={teacherId}
      />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
