import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Video, BarChart, Upload, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const TeacherDashboard = () => {
  const quickStats = [
    { label: "Total Students", value: "120", icon: Users, color: "text-primary" },
    { label: "Subjects Teaching", value: "3", icon: FileText, color: "text-secondary" },
    { label: "Classes This Week", value: "12", icon: Video, color: "text-accent" },
    { label: "Pending Grading", value: "8", icon: BarChart, color: "text-primary" },
  ];

  const upcomingClasses = [
    { subject: "Mathematics - Grade 10", time: "Today, 10:00 AM", students: 30 },
    { subject: "Algebra - Grade 11", time: "Today, 2:00 PM", students: 28 },
    { subject: "Calculus - Grade 12", time: "Tomorrow, 9:00 AM", students: 25 },
  ];

  const recentActivity = [
    { action: "New assignment submitted", subject: "Mathematics", count: "15 students" },
    { action: "Quiz completed", subject: "Algebra", count: "28 students" },
    { action: "Class recording uploaded", subject: "Calculus", count: "2 hours ago" },
  ];

  return (
    <DashboardLayout role="teacher" userName="Teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your classes and students</p>
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
                </CardContent>
              </Card>
            );
          })}
        </div>

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
              {upcomingClasses.map((cls, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{cls.subject}</p>
                    <p className="text-sm text-muted-foreground">{cls.students} students</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">{cls.time}</p>
                    <Button size="sm" variant="link" className="h-auto p-0">
                      Start Class
                    </Button>
                  </div>
                </div>
              ))}
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.subject}</p>
                  </div>
                  <div className="text-sm font-medium">
                    {activity.count}
                  </div>
                </div>
              ))}
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
