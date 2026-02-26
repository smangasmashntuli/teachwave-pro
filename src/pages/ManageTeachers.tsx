import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, UserPlus, Trash2, ArrowLeft, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Teacher {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  employee_number: string;
  specialization: string;
  assignments: Assignment[];
}

interface Assignment {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  grade_id: number;
  grade_name: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Grade {
  id: number;
  name: string;
}

const ManageTeachers = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    teacher_id: "",
    subject_id: "",
    grade_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes, gradesRes] = await Promise.all([
        adminAPI.getTeachers(),
        adminAPI.getSubjects(),
        adminAPI.getGrades(),
      ]);

      setTeachers(teachersRes.data.teachers);
      setSubjects(subjectsRes.data.subjects);
      setGrades(gradesRes.data.grades);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load teachers",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (teacherId?: number) => {
    setFormData({
      teacher_id: teacherId?.toString() || "",
      subject_id: "",
      grade_id: "",
    });
    setSelectedTeacher(teacherId || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTeacher(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await adminAPI.assignTeacher({
        teacher_id: parseInt(formData.teacher_id),
        subject_id: parseInt(formData.subject_id),
        grade_id: parseInt(formData.grade_id),
      });

      toast({
        title: "Success",
        description: "Teacher assigned successfully",
      });

      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to assign teacher",
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: number, teacherName: string, subjectName: string) => {
    if (!confirm(`Remove ${teacherName} from ${subjectName}?`)) {
      return;
    }

    try {
      await adminAPI.removeTeacherAssignment(assignmentId);
      toast({
        title: "Success",
        description: "Assignment removed successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove assignment",
      });
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
          <h1 className="text-3xl font-bold mb-2">Teacher Assignments</h1>
          <p className="text-muted-foreground">
            Assign teachers to subjects and grades
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-6 flex justify-end">
          <Button onClick={() => handleOpenDialog()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Teacher
          </Button>
        </div>

        {/* Teachers List */}
        <div className="grid gap-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">Loading...</div>
              </CardContent>
            </Card>
          ) : teachers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No teachers found. Create teacher accounts first.
                </div>
              </CardContent>
            </Card>
          ) : (
            teachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {teacher.full_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {teacher.email} • {teacher.employee_number}
                        {teacher.specialization && (
                          <span> • {teacher.specialization}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenDialog(teacher.id)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Subject
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {teacher.assignments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No assignments yet
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {teacher.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{assignment.subject_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {assignment.subject_code} • {assignment.grade_name}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveAssignment(
                                assignment.id,
                                teacher.full_name,
                                `${assignment.subject_name} (${assignment.grade_name})`
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher to Subject</DialogTitle>
            <DialogDescription>
              Select a teacher, subject, and grade to create an assignment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teacher">Teacher *</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacher_id: value })
                  }
                  disabled={!!selectedTeacher}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.full_name} ({teacher.employee_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select
                  value={formData.grade_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">Assign Teacher</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageTeachers;
