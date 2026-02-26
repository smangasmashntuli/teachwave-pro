import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { FileText, ArrowLeft, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  subject_name: string;
  subject_code: string;
  grade_name: string;
  submission_id: number | null;
  grade: number | null;
  submitted_at: string | null;
  feedback: string | null;
  submission_text: string | null;
  file_url: string | null;
}

export default function StudentAssignments() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await studentAPI.getAssignments();
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

  const handleOpenSubmission = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText(assignment.submission_text || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      await studentAPI.submitAssignment(selectedAssignment.id, {
        submission_text: submissionText,
      });

      toast({
        title: 'Success',
        description: selectedAssignment.submission_id 
          ? 'Assignment resubmitted successfully'
          : 'Assignment submitted successfully',
      });

      setDialogOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = (assignment: Assignment) => {
    if (assignment.grade !== null) {
      return { label: 'Graded', color: 'bg-green-500', icon: CheckCircle };
    }
    if (assignment.submission_id) {
      return { label: 'Submitted', color: 'bg-blue-500', icon: Clock };
    }
    const isPastDue = new Date(assignment.due_date) < new Date();
    if (isPastDue) {
      return { label: 'Overdue', color: 'bg-red-500', icon: AlertCircle };
    }
    return { label: 'Pending', color: 'bg-yellow-500', icon: Clock };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          onClick={() => navigate('/student')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          My Assignments
        </h1>
        <p className="text-gray-600 mt-2">View and submit your assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>No assignments yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const status = getStatus(assignment);
            const StatusIcon = status.icon;

            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {assignment.title}
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {assignment.subject_name} ({assignment.subject_code}) - {assignment.grade_name}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{assignment.total_points}</div>
                      <div className="text-sm text-gray-500">points</div>
                      {assignment.grade !== null && (
                        <div className="mt-1">
                          <Badge variant="secondary">
                            Score: {assignment.grade}/{assignment.total_points}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{assignment.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {formatDate(assignment.due_date)}</span>
                    </div>
                    {assignment.submitted_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Submitted: {formatDate(assignment.submitted_at)}</span>
                      </div>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-blue-800">{assignment.feedback}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {assignment.grade === null && (
                      <Button onClick={() => handleOpenSubmission(assignment)}>
                        {assignment.submission_id ? 'Resubmit' : 'Submit'} Assignment
                      </Button>
                    )}
                    {assignment.submission_text && (
                      <Button variant="outline" onClick={() => handleOpenSubmission(assignment)}>
                        View Submission
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submission Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment?.grade !== null ? (
            <div className="space-y-4">
              <div>
                <Label>Your Submission</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <p className="text-sm whitespace-pre-wrap">{selectedAssignment.submission_text}</p>
                </div>
              </div>
              <div>
                <Label>Grade</Label>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {selectedAssignment.grade} / {selectedAssignment.total_points}
                </div>
              </div>
              {selectedAssignment.feedback && (
                <div>
                  <Label>Feedback</Label>
                  <div className="mt-2 p-3 bg-blue-50 rounded border">
                    <p className="text-sm">{selectedAssignment.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="submission">Your Answer *</Label>
                <Textarea
                  id="submission"
                  rows={10}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your answer here..."
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : selectedAssignment?.submission_id ? 'Resubmit' : 'Submit'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
