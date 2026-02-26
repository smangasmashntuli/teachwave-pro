import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Trophy, ArrowLeft, TrendingUp, Award, Target } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Grade {
  id: number;
  grade: number;
  feedback: string | null;
  submitted_at: string;
  graded_at: string;
  assignment_title: string;
  total_points: number;
  due_date: string;
  subject_name: string;
  subject_code: string;
}

interface Statistics {
  totalAssignments: number;
  averagePercentage: number;
  totalPoints: number;
  earnedPoints: number;
}

export default function StudentGrades() {
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalAssignments: 0,
    averagePercentage: 0,
    totalPoints: 0,
    earnedPoints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await studentAPI.getGrades();
      setGrades(response.data.grades);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      toast({
        title: 'Error',
        description: 'Failed to load grades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Distinction', color: 'bg-green-500' };
    if (percentage >= 60) return { level: 'Merit', color: 'bg-blue-500' };
    if (percentage >= 50) return { level: 'Pass', color: 'bg-yellow-500' };
    return { level: 'Needs Improvement', color: 'bg-red-500' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading grades...</div>
      </div>
    );
  }

  const overallGradeLevel = getGradeLevel(statistics.averagePercentage);

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
          <Trophy className="h-8 w-8" />
          My Grades
        </h1>
        <p className="text-gray-600 mt-2">Track your academic performance</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGradeColor(statistics.averagePercentage)}`}>
              {statistics.averagePercentage}%
            </div>
            <Badge className={`${overallGradeLevel.color} mt-2`}>
              {overallGradeLevel.level}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded Assignments</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.earnedPoints}</div>
            <p className="text-xs text-muted-foreground">Out of {statistics.totalPoints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averagePercentage >= 50 ? '100' : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.averagePercentage >= 50 ? 'Passing all' : 'Need improvement'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
          <CardDescription>All your graded assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="mx-auto h-12 w-12 mb-4" />
              <p>No graded assignments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Graded Date</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => {
                    const percentage = Math.round((grade.grade / grade.total_points) * 100);
                    const gradeLevel = getGradeLevel(percentage);

                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.assignment_title}</TableCell>
                        <TableCell>
                          <div>
                            <div>{grade.subject_name}</div>
                            <div className="text-sm text-gray-500">{grade.subject_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {grade.grade} / {grade.total_points}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getGradeColor(percentage)}`}>
                              {percentage}%
                            </span>
                            <Badge className={gradeLevel.color} variant="secondary">
                              {gradeLevel.level}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(grade.graded_at)}</TableCell>
                        <TableCell>
                          {grade.feedback ? (
                            <span className="text-sm">{grade.feedback.substring(0, 50)}...</span>
                          ) : (
                            <span className="text-gray-400">No feedback</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
