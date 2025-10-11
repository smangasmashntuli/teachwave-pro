import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart, TrendingUp, TrendingDown, Award, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Grade {
  id: string;
  points_earned: number;
  percentage: number;
  letter_grade: string;
  feedback: string;
  submitted_at: string;
  graded_at: string;
  is_late: boolean;
  assignment: {
    title: string;
    total_points: number;
    assignment_type: string;
    subject: {
      name: string;
      code: string;
    };
  };
}

interface SubjectGradeSummary {
  subject_name: string;
  subject_code: string;
  total_assignments: number;
  completed_assignments: number;
  average_percentage: number;
  letter_grade: string;
  trend: 'up' | 'down' | 'stable';
}

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectGradeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchGrades();
    }
  }, [user?.id]);

  const fetchGrades = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get student's enrolled subjects first
      const { data: subjectEnrollments } = await (supabase as any)
        .from('subject_enrollments')
        .select('subject_id, subjects(*)')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const subjectIds = subjectEnrollments?.map((se: any) => se.subject_id) || [];

      if (subjectIds.length === 0) {
        setGrades([]);
        setSubjectSummaries([]);
        return;
      }

      // Fetch grades for assignments in enrolled subjects
      const { data: gradesData, error } = await (supabase as any)
        .from('grades')
        .select(`
          id,
          points_earned,
          percentage,
          letter_grade,
          feedback,
          submitted_at,
          graded_at,
          is_late,
          assignments:assignment_id (
            title,
            total_points,
            assignment_type,
            subjects:subject_id (
              name,
              code
            )
          )
        `)
        .eq('student_id', user.id)
        .not('graded_at', 'is', null)
        .order('graded_at', { ascending: false });

      if (error) throw error;

      // Process grades
      const processedGrades = gradesData?.map((grade: any) => ({
        id: grade.id,
        points_earned: grade.points_earned,
        percentage: grade.percentage,
        letter_grade: grade.letter_grade,
        feedback: grade.feedback,
        submitted_at: grade.submitted_at,
        graded_at: grade.graded_at,
        is_late: grade.is_late,
        assignment: {
          title: grade.assignments.title,
          total_points: grade.assignments.total_points,
          assignment_type: grade.assignments.assignment_type,
          subject: grade.assignments.subjects
        }
      })) || [];

      setGrades(processedGrades);

      // Calculate subject summaries
      const summaries = subjectEnrollments?.map((enrollment: any) => {
        const subject = enrollment.subjects;
        const subjectGrades = processedGrades.filter((grade: Grade) => 
          grade.assignment.subject.code === subject.code
        );

        const totalAssignments = subjectGrades.length;
        const averagePercentage = totalAssignments > 0 
          ? subjectGrades.reduce((sum, grade) => sum + grade.percentage, 0) / totalAssignments 
          : 0;

        // Simple trend calculation (compare recent vs older grades)
        const recentGrades = subjectGrades.slice(0, Math.ceil(totalAssignments / 2));
        const olderGrades = subjectGrades.slice(Math.ceil(totalAssignments / 2));
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (recentGrades.length > 0 && olderGrades.length > 0) {
          const recentAvg = recentGrades.reduce((sum, g) => sum + g.percentage, 0) / recentGrades.length;
          const olderAvg = olderGrades.reduce((sum, g) => sum + g.percentage, 0) / olderGrades.length;
          const diff = recentAvg - olderAvg;
          trend = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable';
        }

        return {
          subject_name: subject.name,
          subject_code: subject.code,
          total_assignments: totalAssignments,
          completed_assignments: totalAssignments,
          average_percentage: averagePercentage,
          letter_grade: getLetterGrade(averagePercentage),
          trend
        };
      }) || [];

      setSubjectSummaries(summaries);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({
        title: "Error",
        description: "Failed to fetch grades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeBadgeColor = (letterGrade: string) => {
    switch (letterGrade) {
      case 'A':
        return 'bg-green-500';
      case 'B':
        return 'bg-blue-500';
      case 'C':
        return 'bg-yellow-500';
      case 'D':
        return 'bg-orange-500';
      case 'F':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredGrades = selectedSubject === 'all' 
    ? grades 
    : grades.filter(grade => grade.assignment.subject.code === selectedSubject);

  const overallAverage = grades.length > 0 
    ? grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length 
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Grades</h1>
            <p className="text-muted-foreground">Track your academic performance across all subjects</p>
          </div>
          <Button variant="outline" onClick={fetchGrades} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Overall Performance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{overallAverage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Overall Average</div>
                <Badge className={`mt-1 ${getGradeBadgeColor(getLetterGrade(overallAverage))}`}>
                  {getLetterGrade(overallAverage)}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{grades.length}</div>
                <div className="text-sm text-muted-foreground">Total Assignments Graded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{subjectSummaries.length}</div>
                <div className="text-sm text-muted-foreground">Subjects Enrolled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Performance breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ))
              ) : subjectSummaries.length > 0 ? (
                subjectSummaries.map((summary) => (
                  <div key={summary.subject_code} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                       onClick={() => setSelectedSubject(summary.subject_code)}>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{summary.subject_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {summary.completed_assignments} assignments completed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTrendIcon(summary.trend)}
                      <div className="text-right">
                        <div className="font-medium">{summary.average_percentage.toFixed(1)}%</div>
                        <Badge className={`${getGradeBadgeColor(summary.letter_grade)} text-xs`}>
                          {summary.letter_grade}
                        </Badge>
                      </div>
                      <Progress value={summary.average_percentage} className="w-16" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No grades available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subject Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedSubject === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSubject('all')}
          >
            All Subjects
          </Button>
          {subjectSummaries.map((summary) => (
            <Button
              key={summary.subject_code}
              variant={selectedSubject === summary.subject_code ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(summary.subject_code)}
            >
              {summary.subject_code}
            </Button>
          ))}
        </div>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>
              {selectedSubject === 'all' 
                ? 'All recent grades across subjects' 
                : `Recent grades for ${selectedSubject}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                ))
              ) : filteredGrades.length > 0 ? (
                filteredGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {grade.assignment.title}
                        {grade.is_late && <Badge variant="destructive" className="text-xs">Late</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{grade.assignment.subject.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {grade.assignment.assignment_type}
                        </Badge>
                        <span>Graded: {formatDate(grade.graded_at)}</span>
                      </div>
                      {grade.feedback && (
                        <div className="text-sm text-muted-foreground mt-1 italic">
                          "{grade.feedback}"
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {grade.points_earned}/{grade.assignment.total_points}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{grade.percentage.toFixed(1)}%</span>
                        <Badge className={getGradeBadgeColor(grade.letter_grade)}>
                          {grade.letter_grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No grades found</h3>
                  <p className="text-muted-foreground">
                    {selectedSubject === 'all'
                      ? "No assignments have been graded yet."
                      : `No grades found for ${selectedSubject}.`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentGrades;