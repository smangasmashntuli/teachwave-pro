import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, GraduationCap, Settings, BarChart, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GradeManagement from "@/components/admin/GradeManagement";
import SubjectManagement from "@/components/admin/SubjectManagement";
import TeacherAssignments from "@/components/admin/TeacherAssignments";
import AdminSubjectManagement from "@/components/admin/AdminSubjectManagement";
import UserManagement from "@/components/admin/UserManagement";
import SubjectGroupManagement from "@/components/admin/SubjectGroupManagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  activeSubjects: number;
  activeGrades: number;
  totalAssignments: number;
}

interface RecentActivity {
  id: string;
  action: string;
  name: string;
  time: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    activeSubjects: 0,
    activeGrades: 0,
    totalAssignments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user counts by role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('role');

      if (profilesError) throw profilesError;

      const userCounts = profiles?.reduce((acc: any, profile: any) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {}) || {};

      // Fetch subjects count
      const { count: subjectsCount, error: subjectsError } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });

      if (subjectsError) throw subjectsError;

      // Fetch grades count
      const { count: gradesCount, error: gradesError } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true });

      if (gradesError) throw gradesError;

      // Fetch teacher assignments count
      const { count: assignmentsCount, error: assignmentsError } = await supabase
        .from('teacher_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Fetch recent activity from profiles (recent registrations)
      const { data: recentProfiles, error: recentError } = await supabase
        .from('profiles')
        .select('full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const recentActivities = recentProfiles?.map((profile: any, index: number) => ({
        id: index.toString(),
        action: `New ${profile.role} registered`,
        name: profile.full_name || profile.role,
        time: getTimeAgo(profile.created_at),
        created_at: profile.created_at
      })) || [];

      setStats({
        totalStudents: userCounts.student || 0,
        totalTeachers: userCounts.teacher || 0,
        totalAdmins: userCounts.admin || 0,
        activeSubjects: subjectsCount || 0,
        activeGrades: gradesCount || 0,
        totalAssignments: assignmentsCount || 0,
      });

      setRecentActivity(recentActivities);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const quickStats = [
    { label: "Total Students", value: stats.totalStudents.toString(), icon: Users, color: "text-blue-600" },
    { label: "Total Teachers", value: stats.totalTeachers.toString(), icon: GraduationCap, color: "text-green-600" },
    { label: "Total Admins", value: stats.totalAdmins.toString(), icon: Shield, color: "text-red-600" },
    { label: "Active Subjects", value: stats.activeSubjects.toString(), icon: BookOpen, color: "text-purple-600" },
  ];

  const systemHealth = [
    { metric: "Active Users", value: (stats.totalStudents + stats.totalTeachers + stats.totalAdmins).toString(), status: "good" },
    { metric: "Subject Assignments", value: stats.totalAssignments.toString(), status: "excellent" },
    { metric: "Grade Levels", value: stats.activeGrades.toString(), status: "good" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System overview and management</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="groups">Subject Groups</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              /* Loading State */
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
              /* Quick Stats */
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
              {/* Recent Activity */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="mr-2 h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system activities and changes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="flex items-center justify-between border-l-2 border-gray-200 pl-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={activity.id} className="flex items-center justify-between border-l-2 border-primary pl-4">
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.name}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No recent activity</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={fetchDashboardData}
                    disabled={loading}
                  >
                    {loading ? "Refreshing..." : "Refresh Data"}
                  </Button>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>Current system status and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="flex items-center space-x-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    systemHealth.map((health, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{health.metric}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold">{health.value}</span>
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            health.status === 'excellent' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setActiveTab('users')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users ({stats.totalStudents + stats.totalTeachers + stats.totalAdmins})
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('subjects')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Subjects ({stats.activeSubjects})
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('assignments')}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Teacher Assignments ({stats.totalAssignments})
                </Button>
                <Button 
                  variant="outline"
                  onClick={fetchDashboardData}
                  disabled={loading}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  {loading ? "Refreshing..." : "Refresh Dashboard"}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades">
            <GradeManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="subjects">
            <AdminSubjectManagement />
          </TabsContent>

          <TabsContent value="groups">
            <SubjectGroupManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <TeacherAssignments />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;