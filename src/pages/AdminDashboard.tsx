import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, GraduationCap, Settings, BarChart, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const AdminDashboard = () => {
  const quickStats = [
    { label: "Total Students", value: "450", icon: Users, color: "text-primary" },
    { label: "Total Teachers", value: "35", icon: GraduationCap, color: "text-secondary" },
    { label: "Active Subjects", value: "28", icon: BookOpen, color: "text-accent" },
    { label: "Active Grades", value: "12", icon: Shield, color: "text-primary" },
  ];

  const recentActivity = [
    { action: "New teacher registered", name: "Dr. Smith", time: "2 hours ago" },
    { action: "Grade 11 created", name: "Admin User", time: "5 hours ago" },
    { action: "Subject assigned", name: "Mathematics → Dr. Johnson", time: "1 day ago" },
  ];

  const systemHealth = [
    { metric: "System Uptime", value: "99.9%", status: "excellent" },
    { metric: "Active Users", value: "342", status: "good" },
    { metric: "Storage Used", value: "45%", status: "good" },
  ];

  return (
    <DashboardLayout role="admin" userName="Admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System overview and management</p>
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
          {/* Recent Activity */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Latest system changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                <CardTitle>System Health</CardTitle>
              </div>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealth.map((health, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{health.metric}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{health.value}</span>
                    <span className={`h-2 w-2 rounded-full ${
                      health.status === 'excellent' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Management Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Management Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Subjects
            </Button>
            <Button variant="outline">
              <GraduationCap className="mr-2 h-4 w-4" />
              Manage Grades
            </Button>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              View Reports
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
