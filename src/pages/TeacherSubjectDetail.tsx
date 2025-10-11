import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Calendar, 
  Video, 
  Upload, 
  Plus,
  GraduationCap,
  Clock,
  TrendingUp,
  Eye,
  Download
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import UploadContent from "@/components/teacher/UploadContent";
import CreateAssignment from "@/components/teacher/CreateAssignment";
import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SubjectDetails {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_name: string;
}

interface StudentEnrollment {
  id: string;
  student_name: string;
  email: string;
  enrollment_date: string;
  attendance_rate: number;
  average_grade: number;
}

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  file_url: string;
  created_at: string;
  views: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_marks: number;
  submissions: number;
  graded: number;
}

interface VirtualClass {
  id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendees: number;
  meeting_url?: string;
  attendance_code?: string;
}

const TeacherSubjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [subject, setSubject] = useState<SubjectDetails | null>(null);
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [content, setContent] = useState<LearningContent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageGrade: 0,
    attendanceRate: 0,
    contentUploaded: 0,
    activeAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showUploadContent, setShowUploadContent] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  // Class scheduling state
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    scheduled_start: '',
    scheduled_end: ''
  });

  useEffect(() => {
    if (id) {
      fetchSubjectDetails();
    }
  }, [id, user?.id]);

  const fetchSubjectDetails = async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);

      // Verify teacher has access to this subject
      const { data: assignment } = await supabase
        .from('teacher_assignments')
        .select('subject:subjects(id, name, code, description, grade:grades(name))')
        .eq('teacher_id', user.id)
        .eq('subject_id', id)
        .eq('is_active', true)
        .single();

      if (!assignment || !(assignment as any)?.subject) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this subject",
          variant: "destructive",
        });
        navigate('/teacher/subjects');
        return;
      }

      const teacherAssignment = assignment as any;
      setSubject({
        id: teacherAssignment.subject.id,
        name: teacherAssignment.subject.name,
        code: teacherAssignment.subject.code,
        description: teacherAssignment.subject.description,
        grade_name: teacherAssignment.subject.grade?.name || 'Unknown'
      });

      // Fetch students enrolled in this subject
      const { data: enrollments } = await supabase
        .from('subject_enrollments')
        .select(`
          id,
          enrollment_date,
          student:profiles!subject_enrollments_student_id_fkey(full_name, email)
        `)
        .eq('subject_id', id)
        .eq('is_active', true);

      // Process student data with grades and attendance
      const studentsWithStats = await Promise.all(
        (enrollments || []).map(async (enrollment: any) => {
          // Get average grade
          const { data: studentGrades } = await (supabase as any)
            .from('student_grades')
            .select('grade')
            .eq('student_id', enrollment.student_id)
            .eq('subject_id', id);

          const averageGrade = studentGrades && studentGrades.length > 0
            ? studentGrades.reduce((sum: number, g: any) => sum + (g.grade || 0), 0) / studentGrades.length
            : 0;

          // Get attendance rate
          const { data: attendance } = await (supabase as any)
            .from('class_attendance')
            .select('status')
            .eq('student_id', enrollment.student_id);

          const attendanceRate = attendance && attendance.length > 0
            ? (attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100
            : 0;

          return {
            id: enrollment.id,
            student_name: enrollment.student?.full_name || 'Unknown',
            email: enrollment.student?.email || 'Unknown',
            enrollment_date: enrollment.enrollment_date,
            attendance_rate: Math.round(attendanceRate),
            average_grade: Math.round(averageGrade)
          };
        })
      );

      setStudents(studentsWithStats);

      // Fetch learning content
      const { data: contentData } = await supabase
        .from('learning_content')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: false });

      setContent(contentData || []);

      // Fetch assignments
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          total_marks,
          assignment_submissions(id, status)
        `)
        .eq('subject_id', id)
        .order('due_date', { ascending: false });

      const assignmentsWithStats = (assignmentData || []).map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        total_marks: assignment.total_marks,
        submissions: assignment.assignment_submissions?.length || 0,
        graded: assignment.assignment_submissions?.filter((s: any) => s.status === 'graded').length || 0
      }));

      setAssignments(assignmentsWithStats);

      // Fetch virtual classes
      const { data: classData } = await (supabase as any)
        .from('virtual_classes')
        .select(`
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          status,
          meeting_url,
          attendance_code,
          class_attendance(id)
        `)
        .eq('subject_id', id)
        .order('scheduled_start', { ascending: false });

      const classesWithStats = (classData || []).map((cls: any) => ({
        id: cls.id,
        title: cls.title,
        description: cls.description,
        scheduled_start: cls.scheduled_start,
        scheduled_end: cls.scheduled_end,
        actual_start: cls.actual_start,
        actual_end: cls.actual_end,
        status: cls.status,
        attendees: cls.class_attendance?.length || 0,
        meeting_url: cls.meeting_url,
        attendance_code: cls.attendance_code
      }));

      setClasses(classesWithStats);

      // Calculate overall stats
      const totalStudents = studentsWithStats.length;
      const averageGrade = totalStudents > 0 
        ? studentsWithStats.reduce((sum, s) => sum + s.average_grade, 0) / totalStudents
        : 0;
      const attendanceRate = totalStudents > 0
        ? studentsWithStats.reduce((sum, s) => sum + s.attendance_rate, 0) / totalStudents
        : 0;

      setStats({
        totalStudents,
        averageGrade: Math.round(averageGrade),
        attendanceRate: Math.round(attendanceRate),
        contentUploaded: contentData?.length || 0,
        activeAssignments: assignmentsWithStats.filter(a => new Date(a.due_date) > new Date()).length
      });

    } catch (error) {
      console.error('Error fetching subject details:', error);
      toast({
        title: "Error",
        description: "Failed to load subject details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClass = async () => {
    if (!newClass.title || !newClass.scheduled_start || !newClass.scheduled_end) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('virtual_classes')
        .insert({
          subject_id: id,
          teacher_id: user?.id,
          title: newClass.title,
          description: newClass.description,
          scheduled_start: newClass.scheduled_start,
          scheduled_end: newClass.scheduled_end,
          status: 'scheduled',
          attendance_code: Math.random().toString(36).substring(2, 8).toUpperCase()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class scheduled successfully",
      });

      setIsSchedulingOpen(false);
      setNewClass({ title: '', description: '', scheduled_start: '', scheduled_end: '' });
      fetchSubjectDetails(); // Refresh data
    } catch (error) {
      console.error('Error scheduling class:', error);
      toast({
        title: "Error",
        description: "Failed to schedule class",
        variant: "destructive",
      });
    }
  };

  const handleStartScheduledClass = async (classId: string) => {
    try {
      // Update class status to ongoing and set actual_start
      const { error } = await (supabase as any)
        .from('virtual_classes')
        .update({
          status: 'ongoing',
          actual_start: new Date().toISOString(),
          meeting_url: `classroom-${classId}-${Date.now()}`
        })
        .eq('id', classId);

      if (error) throw error;

      // Navigate to virtual classroom
      navigate(`/teacher/subjects/${id}/classroom`);
    } catch (error) {
      console.error('Error starting class:', error);
      toast({
        title: "Error",
        description: "Failed to start class",
        variant: "destructive",
      });
    }
  };

  const handleStartClass = () => {
    navigate(`/teacher/subjects/${id}/classroom`);
  };

  const getFileTypeIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'ppt': case 'pptx': return '📊';
      case 'xls': case 'xlsx': return '📈';
      case 'mp4': case 'avi': case 'mov': return '🎥';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      default: return '📄';
    }
  };

  if (loading || !subject) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{subject.name}</h1>
              <Badge variant="default" className="bg-blue-600 text-white font-bold text-lg px-3 py-1">
                {subject.grade_name}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                {subject.code}
              </span>
              <span className="text-blue-600 font-semibold">
                ⚠️ Grade-Specific Content - Only for {subject.grade_name}
              </span>
            </p>
          </div>
          <div className="space-x-2">
            <Button onClick={handleStartClass} className="bg-green-600 hover:bg-green-700">
              <Video className="h-4 w-4 mr-2" />
              Start Class
            </Button>
            <Button onClick={() => navigate('/teacher/subjects')} variant="outline">
              Back to Subjects
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Students</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Avg Grade</p>
                  <p className="text-2xl font-bold">{stats.averageGrade}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Content</p>
                  <p className="text-2xl font-bold">{stats.contentUploaded}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Assignments</p>
                  <p className="text-2xl font-bold">{stats.activeAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                  Students enrolled in {subject.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.student_name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={student.average_grade >= 70 ? "default" : "secondary"}>
                          {student.average_grade}% Grade
                        </Badge>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Attendance: </span>
                          <span className={student.attendance_rate >= 80 ? "text-green-600" : "text-red-600"}>
                            {student.attendance_rate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Learning Content</CardTitle>
                    <CardDescription>
                      Materials uploaded for {subject.name}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowUploadContent(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileTypeIcon(item.content_type)}</span>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Eye className="h-3 w-3 mr-1" />
                            {item.views} views
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>
                      Assignments for {subject.name}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateAssignment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.description}</p>
                        </div>
                        <Badge variant={new Date(assignment.due_date) > new Date() ? "default" : "secondary"}>
                          {assignment.total_marks} marks
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Due: {new Date(assignment.due_date).toLocaleString()}
                        </span>
                        <div className="space-x-4">
                          <span>📝 {assignment.submissions} submissions</span>
                          <span>✅ {assignment.graded} graded</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={(assignment.graded / Math.max(assignment.submissions, 1)) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Virtual Classes</CardTitle>
                    <CardDescription>
                      Scheduled and past classes for {subject?.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Class
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Schedule New Class - {subject?.grade_name}</DialogTitle>
                        </DialogHeader>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-blue-800">
                            <span className="font-semibold">⚠️ Grade-Specific Class:</span>
                            <span>This class will only be visible to {subject?.grade_name} students enrolled in {subject?.name}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Class Title</Label>
                            <Input
                              id="title"
                              value={newClass.title}
                              onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                              placeholder="Enter class title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              value={newClass.description}
                              onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                              placeholder="Enter class description"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start">Start Date & Time</Label>
                              <Input
                                id="start"
                                type="datetime-local"
                                value={newClass.scheduled_start}
                                onChange={(e) => setNewClass({ ...newClass, scheduled_start: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end">End Date & Time</Label>
                              <Input
                                id="end"
                                type="datetime-local"
                                value={newClass.scheduled_end}
                                onChange={(e) => setNewClass({ ...newClass, scheduled_end: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsSchedulingOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleScheduleClass}>
                              Schedule Class
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={handleStartClass}>
                      <Video className="h-4 w-4 mr-2" />
                      Start Instant Class
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No classes scheduled yet</p>
                      <p className="text-sm">Schedule your first class to get started</p>
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <div key={cls.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{cls.title}</p>
                          {cls.description && (
                            <p className="text-sm text-muted-foreground mb-2">{cls.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            📅 {new Date(cls.scheduled_start).toLocaleString()} - {new Date(cls.scheduled_end).toLocaleString()}
                          </p>
                          {cls.actual_start && (
                            <p className="text-sm text-green-600">
                              ▶️ Started: {new Date(cls.actual_start).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right space-y-1">
                            <Badge variant={
                              cls.status === 'ongoing' ? "default" : 
                              cls.status === 'scheduled' ? "secondary" : 
                              cls.status === 'completed' ? "outline" : "destructive"
                            }>
                              {cls.status}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              👥 {cls.attendees} attendees
                            </div>
                          </div>
                          {cls.status === 'scheduled' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStartScheduledClass(cls.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Start Class
                            </Button>
                          )}
                          {cls.status === 'ongoing' && (
                            <Button 
                              size="sm" 
                              onClick={() => navigate(`/teacher/subjects/${id}/classroom`)}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join Class
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <UploadContent
        isOpen={showUploadContent}
        onClose={() => setShowUploadContent(false)}
      />
      <CreateAssignment
        isOpen={showCreateAssignment}
        onClose={() => setShowCreateAssignment(false)}
        subjectId={id}
        onAssignmentCreated={() => {
          fetchSubjectDetails();
        }}
      />
    </DashboardLayout>
  );
};

export default TeacherSubjectDetail;