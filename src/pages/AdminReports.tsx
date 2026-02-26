import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Activity, TrendingUp, Users, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalAssignments: number;
  studentsByGrade: { grade: string; count: number }[];
  studentsByStream: { stream: string; count: number }[];
}

interface ActivityLog {
  full_name?: string;
  email?: string;
  role?: string;
  subject_name?: string;
  grade_name?: string;
  activity_time: string;
  activity_type: string;
}

const AdminReports = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getActivities(),
      ]);

      setStats(statsRes.data.stats);
      setActivities(activitiesRes.data.activities);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "User Created":
        return <Users className="h-4 w-4" />;
      case "Teacher Assigned":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "User Created":
        return "bg-green-500";
      case "Teacher Assigned":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">TeachWave</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View system statistics and recent activities
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered learners</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                  <p className="text-xs text-muted-foreground">Active educators</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>
                  <p className="text-xs text-muted-foreground">Available courses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAssignments || 0}</div>
                  <p className="text-xs text-muted-foreground">System-wide</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Students by Grade */}
              <Card>
                <CardHeader>
                  <CardTitle>Students by Grade</CardTitle>
                  <CardDescription>Distribution across all grades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.studentsByGrade.map((item) => (
                      <div key={item.grade} className="flex items-center justify-between">
                        <span className="font-medium">{item.grade}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(item.count / (stats?.totalStudents || 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                    {(!stats?.studentsByGrade || stats.studentsByGrade.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        No students enrolled yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Students by Stream */}
              <Card>
                <CardHeader>
                  <CardTitle>Students by Stream</CardTitle>
                  <CardDescription>Grade 10-12 stream distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.studentsByStream
                      .filter((item) => item.count > 0)
                      .map((item) => (
                        <div key={item.stream} className="flex items-center justify-between">
                          <span className="font-medium">{item.stream}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${(item.count / (stats?.totalStudents || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    {(!stats?.studentsByStream ||
                      stats.studentsByStream.filter((item) => item.count > 0).length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        No Grade 10-12 students enrolled yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest 20 system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {activity.activity_type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.role ||
                              (activity.subject_name ? 'Assignment' : 'System')}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.full_name && (
                            <span>{activity.full_name} ({activity.email})</span>
                          )}
                          {activity.subject_name && (
                            <span>
                              {activity.full_name} assigned to {activity.subject_name} ({activity.grade_name})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.activity_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activities
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminReports;
