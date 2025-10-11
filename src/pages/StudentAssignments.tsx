import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_marks: number;
  subject: {
    name: string;
    code: string;
  };
  submission?: {
    id: string;
    submitted_at: string;
    is_graded: boolean;
    marks_awarded: number;
  };
}

const StudentAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  const handleSubmitAssignment = (assignmentId: string) => {
    toast({
      title: "Assignment Submission",
      description: "Assignment submission functionality will be available soon.",
    });
  };

  const handleViewDetails = (assignmentId: string) => {
    // For now, navigate to assignments page with assignment ID
    navigate(`/student/assignments/${assignmentId}`);
  };

  useEffect(() => {
    if (user?.id) {
      fetchAssignments();
    }
  }, [user?.id]);

  const fetchAssignments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get student's enrolled subjects first
      const { data: subjectEnrollments } = await (supabase as any)
        .from('subject_enrollments')
        .select('subject_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const subjectIds = subjectEnrollments?.map((se: any) => se.subject_id) || [];

      if (subjectIds.length === 0) {
        setAssignments([]);
        return;
      }

      // Fetch assignments for enrolled subjects
      const { data: assignmentsData, error } = await (supabase as any)
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          total_marks,
          subjects:subject_id (
            name,
            code
          ),
          assignment_submissions!left (
            id,
            submitted_at,
            is_graded,
            marks_awarded,
            student_id
          )
        `)
        .in('subject_id', subjectIds)
        .eq('is_published', true)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Process assignments and their submissions
      const processedAssignments = assignmentsData?.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        total_marks: assignment.total_marks,
        subject: assignment.subjects,
        submission: assignment.assignment_submissions?.find((sub: any) => sub.student_id === user.id)
      })) || [];

      setAssignments(processedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.submission?.is_graded) {
      return <Badge className="bg-green-500">Graded</Badge>;
    }
    if (assignment.submission) {
      return <Badge className="bg-blue-500">Submitted</Badge>;
    }
    const isOverdue = new Date(assignment.due_date) < new Date();
    return <Badge variant={isOverdue ? "destructive" : "secondary"}>
      {isOverdue ? "Overdue" : "Pending"}
    </Badge>;
  };

  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case 'pending':
        return !assignment.submission;
      case 'submitted':
        return assignment.submission && !assignment.submission.is_graded;
      case 'graded':
        return assignment.submission?.is_graded;
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Assignments</h1>
            <p className="text-muted-foreground">Track your assignments and submissions</p>
          </div>
          <Button variant="outline" onClick={fetchAssignments} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {(['all', 'pending', 'submitted', 'graded'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="capitalize"
            >
              {filterType}
            </Button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="grid gap-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{assignment.subject?.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {assignment.subject?.code}
                        </Badge>
                      </CardDescription>
                    </div>
                    {getStatusBadge(assignment)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.total_marks} marks</span>
                      </div>
                    </div>
                    
                    {assignment.submission?.is_graded && (
                      <div className="text-sm font-medium">
                        Score: {assignment.submission.marks_awarded}/{assignment.total_marks}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    {assignment.submission ? (
                      <div className="text-sm text-muted-foreground">
                        Submitted: {formatDate(assignment.submission.submitted_at)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Not submitted
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {!assignment.submission && (
                        <Button 
                          size="sm"
                          onClick={() => handleSubmitAssignment(assignment.id)}
                        >
                          Submit Assignment
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(assignment.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No assignments found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "No assignments have been published for your subjects yet."
                  : `No ${filter} assignments found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;