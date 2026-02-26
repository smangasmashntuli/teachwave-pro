import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Users, FileText, Calendar, BookOpen, ArrowLeft } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  grade_id: number;
  grade_name: string;
  assigned_date: string;
  student_count: number;
  assignment_count: number;
}

interface AssignmentForm {
  title: string;
  description: string;
  subjectId: number;
  gradeId: number;
  dueDate: string;
  totalPoints: number;
}

export default function TeacherSubjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<AssignmentForm>({
    title: '',
    description: '',
    subjectId: 0,
    gradeId: 0,
    dueDate: '',
    totalPoints: 100,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await teacherAPI.getSubjects();
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subjects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teacherAPI.createAssignment({
        title: formData.title,
        description: formData.description,
        subject_id: formData.subjectId,
        grade_id: formData.gradeId,
        due_date: formData.dueDate,
        total_points: formData.totalPoints,
      });

      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });

      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        subjectId: 0,
        gradeId: 0,
        dueDate: '',
        totalPoints: 100,
      });
      fetchSubjects(); // Refresh to update assignment count
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      title: '',
      description: '',
      subjectId: subject.id,
      gradeId: subject.grade_id,
      dueDate: '',
      totalPoints: 100,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading subjects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/teacher')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">My Subjects</h1>
        <p className="text-gray-600 mt-2">View and manage your assigned subjects</p>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <p>No subjects assigned yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={`${subject.id}-${subject.grade_id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {subject.name}
                </CardTitle>
                <CardDescription>
                  Code: {subject.code} | Grade {subject.grade_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{subject.student_count} Student{subject.student_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span>{subject.assignment_count} Assignment{subject.assignment_count !== 1 ? 's' : ''}</span>
                  </div>
                  {subject.description && (
                    <p className="text-gray-600 mt-3">{subject.description}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/teacher/students?subjectId=${subject.id}&gradeId=${subject.grade_id}`)}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  View Students
                </Button>
                <Button
                  size="sm"
                  onClick={() => openCreateDialog(subject)}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  New Assignment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment for {selectedSubject?.name} - Grade {selectedSubject?.grade_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Chapter 5 Test"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Provide details about this assignment..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalPoints">Total Points *</Label>
                <Input
                  id="totalPoints"
                  type="number"
                  min="1"
                  value={formData.totalPoints}
                  onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Assignment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
