import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Users, FileText, Clock, Award, Download, X } from "lucide-react";

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Analytics = ({ isOpen, onClose }: AnalyticsProps) => {
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [timePeriod, setTimePeriod] = useState("month");

  const subjects = ["All Subjects", "Mathematics", "Science", "English", "History", "Geography"];
  const grades = ["All Grades", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  const periods = ["This Week", "This Month", "This Quarter", "This Year"];

  // Mock data
  const overviewStats = [
    { label: "Total Students", value: "342", change: "+12%", trend: "up" },
    { label: "Avg. Attendance", value: "87%", change: "+5%", trend: "up" },
    { label: "Assignment Completion", value: "78%", change: "-3%", trend: "down" },
    { label: "Average Grade", value: "82%", change: "+7%", trend: "up" },
  ];

  const classPerformance = [
    { subject: "Mathematics", grade: "Grade 10", students: 32, avgGrade: 85, attendance: 92 },
    { subject: "Science", grade: "Grade 11", students: 28, avgGrade: 78, attendance: 89 },
    { subject: "English", grade: "Grade 9", students: 35, avgGrade: 82, attendance: 94 },
    { subject: "History", grade: "Grade 12", students: 25, avgGrade: 79, attendance: 87 },
  ];

  const topPerformers = [
    { name: "Sarah Johnson", grade: "Grade 11", avgScore: 96, assignments: 12 },
    { name: "Michael Chen", grade: "Grade 10", avgScore: 94, assignments: 15 },
    { name: "Emma Davis", grade: "Grade 12", avgScore: 91, assignments: 18 },
    { name: "David Wilson", grade: "Grade 9", avgScore: 89, assignments: 10 },
    { name: "Lisa Brown", grade: "Grade 11", avgScore: 87, assignments: 14 },
  ];

  const recentAssignments = [
    { title: "Quadratic Equations", subject: "Mathematics", submitted: 28, total: 32, avgGrade: 82 },
    { title: "Photosynthesis Lab", subject: "Science", submitted: 25, total: 28, avgGrade: 87 },
    { title: "Essay: Climate Change", subject: "English", submitted: 32, total: 35, avgGrade: 79 },
    { title: "World War II Timeline", subject: "History", submitted: 23, total: 25, avgGrade: 84 },
  ];

  const attendanceData = [
    { week: "Week 1", present: 315, absent: 27 },
    { week: "Week 2", present: 298, absent: 44 },
    { week: "Week 3", present: 325, absent: 17 },
    { week: "Week 4", present: 308, absent: 34 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive insights into student performance and class analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject.toLowerCase().replace(' ', '_')}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade.toLowerCase().replace(' ', '_')}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period} value={period.toLowerCase().replace(' ', '_')}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overviewStats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                      <TrendingUp className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change} from last period
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Class Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Class Performance Overview</CardTitle>
                    <CardDescription>Average grades and attendance by class</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {classPerformance.map((cls, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{cls.subject} - {cls.grade}</p>
                            <p className="text-sm text-muted-foreground">{cls.students} students</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{cls.avgGrade}% avg grade</p>
                            <p className="text-sm text-muted-foreground">{cls.attendance}% attendance</p>
                          </div>
                        </div>
                        <Progress value={cls.avgGrade} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Students</CardTitle>
                    <CardDescription>Highest average scores this period</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topPerformers.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.grade}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{student.avgScore}%</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {student.assignments} assignments
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Performance breakdown across all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-5">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">A</div>
                        <div className="text-sm text-muted-foreground">25%</div>
                        <Progress value={25} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">B</div>
                        <div className="text-sm text-muted-foreground">35%</div>
                        <Progress value={35} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">C</div>
                        <div className="text-sm text-muted-foreground">25%</div>
                        <Progress value={25} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">D</div>
                        <div className="text-sm text-muted-foreground">10%</div>
                        <Progress value={10} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">F</div>
                        <div className="text-sm text-muted-foreground">5%</div>
                        <Progress value={5} className="mt-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Assignment Performance</CardTitle>
                  <CardDescription>Submission rates and average grades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAssignments.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">Submission Rate</p>
                            <p className="text-2xl font-bold">
                              {Math.round((assignment.submitted / assignment.total) * 100)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.submitted}/{assignment.total}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Avg Grade</p>
                            <p className="text-2xl font-bold">{assignment.avgGrade}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trends</CardTitle>
                  <CardDescription>Student attendance over the past month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceData.map((week, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{week.week}</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((week.present / (week.present + week.absent)) * 100)}% present
                          </span>
                        </div>
                        <div className="flex gap-1 h-4">
                          <div 
                            className="bg-green-500 rounded-l" 
                            style={{ width: `${(week.present / (week.present + week.absent)) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500 rounded-r" 
                            style={{ width: `${(week.absent / (week.present + week.absent)) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{week.present} present</span>
                          <span>{week.absent} absent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;