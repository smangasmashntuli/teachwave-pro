import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, FileText, BarChart, Calendar, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const StudentDashboard = () => {
  const quickStats = [
    { label: "Enrolled Subjects", value: "6", icon: BookOpen, color: "text-primary" },
    { label: "Upcoming Classes", value: "3", icon: Video, color: "text-secondary" },
    { label: "Pending Assignments", value: "4", icon: FileText, color: "text-accent" },
    { label: "Attendance Rate", value: "92%", icon: Award, color: "text-primary" },
  ];

  const upcomingClasses = [
    { subject: "Mathematics", time: "Today, 10:00 AM", teacher: "Dr. Smith" },
    { subject: "Physics", time: "Today, 2:00 PM", teacher: "Prof. Johnson" },
    { subject: "English", time: "Tomorrow, 9:00 AM", teacher: "Ms. Williams" },
  ];

  const recentContent = [
    { title: "Calculus Chapter 5", subject: "Mathematics", type: "PDF" },
    { title: "Newton's Laws Lecture", subject: "Physics", type: "Video" },
    { title: "Essay Writing Guide", subject: "English", type: "Document" },
  ];

  return (
    <DashboardLayout role="student" userName="Student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">Here's what's happening in your learning journey</p>
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
              <CardDescription>Your scheduled virtual sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingClasses.map((cls, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{cls.subject}</p>
                    <p className="text-sm text-muted-foreground">{cls.teacher}</p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="font-medium">{cls.time}</p>
                    <Button size="sm" variant="link" className="h-auto p-0">
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Content */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                <CardTitle>Recent Content</CardTitle>
              </div>
              <CardDescription>Newly uploaded learning materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentContent.map((content, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{content.title}</p>
                    <p className="text-sm text-muted-foreground">{content.subject}</p>
                  </div>
                  <div className="text-sm">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      {content.type}
                    </span>
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
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Assignments
            </Button>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Check Grades
            </Button>
            <Button variant="outline">
              <Video className="mr-2 h-4 w-4" />
              Watch Recordings
            </Button>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Subjects
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
