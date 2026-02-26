import { useEffect, useState } from 'react';
import { teacherAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { FileText, Users, CheckCircle, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  created_at: string;
  subject_name: string;
  subject_code: string;
  subject_id: number;
  grade_name: string;
  grade_id: number;
  total_students: number;
  submitted_count: number;
  graded_count: number;
}

interface Submission {
  id: number;
  submission_text: string;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  student_name: string;
  student_email: string;
  student_number: string;
}

interface AssignmentDetail {
  id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
}

export default function TeacherAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: 0, feedback: '' });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await teacherAPI.getAssignments();
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissions = async (assignment: Assignment) => {
    try {
      const response = await teacherAPI.getAssignmentSubmissions(assignment.id);
      setSelectedAssignment(response.data.assignment);
      setSubmissions(response.data.submissions);
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    }
  };

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade || 0,
      feedback: submission.feedback || '',
    });
    setGradingDialogOpen(true);
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      await teacherAPI.gradeSubmission(selectedSubmission.id, gradeForm);
      toast({
        title: 'Success',
        description: 'Submission graded successfully',
      });

      // Refresh submissions
      if (selectedAssignment) {
        const response = await teacherAPI.getAssignmentSubmissions(selectedAssignment.id);
        setSubmissions(response.data.submissions);
      }

      setGradingDialogOpen(false);
      fetchAssignments(); // Refresh to update graded count
    } catch (error) {
      console.error('Failed to grade submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to grade submission',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const percentage = assignment.total_students > 0 
      ? Math.round((assignment.submitted_count / assignment.total_students) * 100)
      : 0;
    return percentage;
  };

  const getGradingStatus = (assignment: Assignment) => {
    const percentage = assignment.submitted_count > 0
      ? Math.round((assignment.graded_count / assignment.submitted_count) * 100)
      : 0;
    return percentage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading assignments...</div>
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          My Assignments
        </h1>
        <p className="text-gray-600 mt-2">Manage and grade student assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>No assignments created yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const submissionRate = getSubmissionStatus(assignment);
            const gradingRate = getGradingStatus(assignment);
            const isOverdue = new Date(assignment.due_date) < new Date();

            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {assignment.title}
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {assignment.subject_name} ({assignment.subject_code}) - Grade {assignment.grade_name}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{assignment.total_points}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{assignment.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-xs text-gray-500">Due Date</div>
                        <div className="text-sm font-medium">{formatDate(assignment.due_date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-xs text-gray-500">Students</div>
                        <div className="text-sm font-medium">{assignment.total_students}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-xs text-gray-500">Submissions</div>
                        <div className="text-sm font-medium">
                          {assignment.submitted_count} ({submissionRate}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="text-xs text-gray-500">Graded</div>
                        <div className="text-sm font-medium">
                          {assignment.graded_count} ({gradingRate}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => viewSubmissions(assignment)} className="flex-1">
                      View Submissions ({assignment.submitted_count})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submissions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.description}
            </DialogDescription>
          </DialogHeader>

          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>No submissions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student Number</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.student_name}</div>
                        <div className="text-sm text-gray-500">{submission.student_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.student_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {formatDate(submission.submitted_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.grade !== null ? (
                        <Badge variant="secondary">
                          {submission.grade} / {selectedAssignment?.total_points}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Graded</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openGradingDialog(submission)}>
                        {submission.grade !== null ? 'Edit Grade' : 'Grade'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Grading submission by {selectedSubmission?.student_name}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <Label>Submission</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <p className="text-sm">{selectedSubmission.submission_text || 'No text submitted'}</p>
                  {selectedSubmission.file_url && (
                    <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      View Attachment
                    </a>
                  )}
                </div>
              </div>

              <form onSubmit={handleGradeSubmission} className="space-y-4">
                <div>
                  <Label htmlFor="grade">Grade (out of {selectedAssignment?.total_points}) *</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max={selectedAssignment?.total_points}
                    value={gradeForm.grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, grade: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    rows={4}
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setGradingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Grade</Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
