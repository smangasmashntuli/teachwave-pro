import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, BarChart3, Calendar, Video, FileText, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TeacherSubject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_name: string;
  student_count: number;
  content_count: number;
  assignment_count: number;
  upcoming_class: string | null;
  ongoing_class: string | null;
  scheduled_classes_count: number;
  average_grade: number;
  attendance_rate: number;
}

const TeacherSubjects = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherSubjects();
  }, [user?.id]);

  const fetchTeacherSubjects = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch subjects assigned to this teacher
      const { data: teacherAssignments, error: assignmentsError } = await supabase
        .from('teacher_assignments')
        .select(`
          subject:subjects(
            id,
            name,
            code,
            description,
            grade:grades(name)
          )
        `)
        .eq('teacher_id', user.id)
        .eq('is_active', true);

      if (assignmentsError) {
        console.error('Error fetching teacher assignments:', assignmentsError);
        toast({
          title: "Error",
          description: "Failed to fetch subjects",
          variant: "destructive",
        });
        return;
      }

      // Process each subject to get additional stats
      const subjectsWithStats = await Promise.all(
        (teacherAssignments || []).map(async (assignment: any) => {
          const subject = assignment.subject;
          if (!subject) return null;

          // Get student count for this subject
          const { count: studentCount } = await supabase
            .from('subject_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id)
            .eq('is_active', true);

          // Get content count
          const { count: contentCount } = await supabase
            .from('learning_content')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);

          // Get assignment count
          const { count: assignmentCount } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);

          // Get upcoming class
          const { data: upcomingClass } = await (supabase as any)
            .from('virtual_classes')
            .select('id, scheduled_start')
            .eq('subject_id', subject.id)
            .eq('status', 'scheduled')
            .gte('scheduled_start', new Date().toISOString())
            .order('scheduled_start', { ascending: true })
            .limit(1)
            .single();

          // Get ongoing class
          const { data: ongoingClass } = await (supabase as any)
            .from('virtual_classes')
            .select('id, scheduled_start')
            .eq('subject_id', subject.id)
            .eq('status', 'ongoing')
            .single();

          // Get scheduled classes count
          const { count: scheduledCount } = await (supabase as any)
            .from('virtual_classes')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id)
            .eq('status', 'scheduled');

          // Calculate average grade for this subject
          const { data: grades } = await (supabase as any)
            .from('student_grades')
            .select('grade')
            .eq('subject_id', subject.id);

          const averageGrade = grades && grades.length > 0 
            ? grades.reduce((sum: number, g: any) => sum + (g.grade || 0), 0) / grades.length
            : 0;

          // Calculate attendance rate from virtual classes
          const { data: attendanceData } = await (supabase as any)
            .from('class_attendance')
            .select('status')
            .in('class_id', 
              await supabase.from('virtual_classes').select('id').eq('subject_id', subject.id).then((res: any) => 
                res.data?.map((c: any) => c.id) || []
              )
            );

          const attendanceRate = attendanceData && attendanceData.length > 0
            ? (attendanceData.filter((a: any) => a.status === 'present').length / attendanceData.length) * 100
            : 0;

          return {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            grade_name: subject.grade?.name || 'Unknown',
            student_count: studentCount || 0,
            content_count: contentCount || 0,
            assignment_count: assignmentCount || 0,
            upcoming_class: upcomingClass && (upcomingClass as any).scheduled_start ? (upcomingClass as any).scheduled_start : null,
            ongoing_class: ongoingClass && (ongoingClass as any).scheduled_start ? (ongoingClass as any).scheduled_start : null,
            scheduled_classes_count: scheduledCount || 0,
            average_grade: Math.round(averageGrade),
            attendance_rate: Math.round(attendanceRate)
          };
        })
      );

      setSubjects(subjectsWithStats.filter(Boolean) as TeacherSubject[]);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/teacher/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">My Subjects</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
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
            <h1 className="text-3xl font-bold">My Subjects</h1>
            <p className="text-muted-foreground">Manage your subjects, students, and classes</p>
          </div>
          <Button onClick={() => navigate('/teacher')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {subjects.length === 0 ? (
          <Card className="text-center p-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Subjects Assigned</h2>
            <p className="text-muted-foreground">
              You don't have any subjects assigned yet. Contact your administrator.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSubjectClick(subject.id)}
              >
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Badge variant="default" className="bg-blue-600 text-white font-semibold">
                        {subject.grade_name}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {subject.code}
                      </span>
                      <span className="text-blue-600 font-medium">
                        • {subject.grade_name}
                      </span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{subject.student_count} Students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{subject.content_count} Content</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">{subject.assignment_count} Assignments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">{subject.average_grade}% Avg Grade</span>
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Attendance Rate</span>
                      <span className="font-medium">{subject.attendance_rate}%</span>
                    </div>
                    <Progress value={subject.attendance_rate} className="h-2" />
                  </div>

                  {/* Virtual Classes Status */}
                  <div className="space-y-2">
                    {subject.ongoing_class && (
                      <div className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-950 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-300">
                            Class is live now
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/teacher/subjects/${subject.id}/classroom`);
                          }}
                        >
                          Join
                        </Button>
                      </div>
                    )}

                    {subject.upcoming_class && (
                      <div className="flex items-center space-x-2 text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-300">
                          Next class: {new Date(subject.upcoming_class).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {subject.scheduled_classes_count > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{subject.scheduled_classes_count} scheduled classes</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/subjects/${subject.id}/classroom`);
                      }}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Start Instant Class
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubjectClick(subject.id);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherSubjects;