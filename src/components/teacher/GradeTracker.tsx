import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getDashboardService, type StudentWithProgress, type AssignmentWithStats, type Grade } from '@/integrations/supabase/dashboard';
import { 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Edit,
  Save,
  X,
  Plus,
  Filter
} from 'lucide-react';

interface GradeTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  teacherId: string;
}

interface StudentGrade extends StudentWithProgress {
  grades: (Grade & { assignment_title: string })[];
  overall_grade: number;
  missing_assignments: number;
}

const GradeTracker: React.FC<GradeTrackerProps> = ({ isOpen, onClose, classId, teacherId }) => {
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentGrade | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeFilter, setGradeFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    points_earned: '',
    percentage: '',
    letter_grade: '',
    feedback: ''
  });

  const dashboardService = getDashboardService(teacherId);

  useEffect(() => {
    if (isOpen && classId) {
      loadGradeData();
    }
  }, [isOpen, classId]);

  const loadGradeData = async () => {
    setLoading(true);
    try {
      const [studentsData, assignmentsData] = await Promise.all([
        dashboardService.getClassStudents(classId!),
        dashboardService.getClassAssignments(classId!)
      ]);

      // Fetch grades for each student
      const studentsWithGrades = await Promise.all(
        studentsData.map(async (student) => {
          const grades = await getStudentGrades(student.id);
          const overallGrade = calculateOverallGrade(grades);
          const missingAssignments = assignmentsData.length - grades.filter(g => g.points_earned !== null).length;
          
          return {
            ...student,
            grades,
            overall_grade: overallGrade,
            missing_assignments: missingAssignments
          };
        })
      );

      setStudents(studentsWithGrades);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading grade data:', error);
      toast({
        title: "Error",
        description: "Failed to load grade data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStudentGrades = async (studentId: string): Promise<(Grade & { assignment_title: string })[]> => {
    try {
      // This would be a more specific query in real implementation
      const recentGrades = await dashboardService.getRecentGrades(classId!, 100);
      return recentGrades.filter(grade => grade.student_id === studentId);
    } catch (error) {
      console.error('Error fetching student grades:', error);
      return [];
    }
  };

  const calculateOverallGrade = (grades: Grade[]): number => {
    const validGrades = grades.filter(g => g.percentage !== null);
    if (!validGrades.length) return 0;
    return Math.round(validGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / validGrades.length * 100) / 100;
  };

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeTrend = (trend: string | null) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const filterStudents = (students: StudentGrade[]): StudentGrade[] => {
    switch (gradeFilter) {
      case 'high':
        return students.filter(s => s.overall_grade >= 85);
      case 'medium':
        return students.filter(s => s.overall_grade >= 70 && s.overall_grade < 85);
      case 'low':
        return students.filter(s => s.overall_grade < 70);
      default:
        return students;
    }
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setEditForm({
      points_earned: grade.points_earned?.toString() || '',
      percentage: grade.percentage?.toString() || '',
      letter_grade: grade.letter_grade || '',
      feedback: grade.feedback || ''
    });
  };

  const handleSaveGrade = async () => {
    if (!editingGrade) return;

    try {
      const updates = {
        points_earned: parseFloat(editForm.points_earned) || null,
        percentage: parseFloat(editForm.percentage) || null,
        letter_grade: editForm.letter_grade || null,
        feedback: editForm.feedback || null,
        graded_at: new Date().toISOString()
      };

      await dashboardService.updateGrade(editingGrade.id, updates);
      
      toast({
        title: "Grade Updated",
        description: "The grade has been successfully updated."
      });

      setEditingGrade(null);
      await loadGradeData(); // Refresh data
    } catch (error) {
      console.error('Error updating grade:', error);
      toast({
        title: "Error",
        description: "Failed to update grade. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Grade Tracker & Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={gradeFilter} onValueChange={(value: any) => setGradeFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="high">High Performers (85%+)</SelectItem>
                  <SelectItem value="medium">Average (70-84%)</SelectItem>
                  <SelectItem value="low">Needs Attention (&lt;70%)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Student Grades</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Class Statistics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Total Students</span>
                    </div>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Class Average</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {students.length > 0 
                        ? Math.round(students.reduce((sum, s) => sum + s.overall_grade, 0) / students.length) 
                        : 0}%
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Assignments</span>
                    </div>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Graded</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {assignments.reduce((sum, a) => sum + a.graded_count, 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['A (90-100%)', 'B (80-89%)', 'C (70-79%)', 'D (60-69%)', 'F (0-59%)'].map((gradeRange, index) => {
                      const minGrade = [90, 80, 70, 60, 0][index];
                      const maxGrade = [100, 89, 79, 69, 59][index];
                      const count = students.filter(s => s.overall_grade >= minGrade && s.overall_grade <= maxGrade).length;
                      const percentage = students.length > 0 ? (count / students.length) * 100 : 0;
                      
                      return (
                        <div key={gradeRange} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{gradeRange}</span>
                            <span>{count} students ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-4 mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filterStudents(students).map((student) => (
                    <Card key={student.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedStudent(student)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {student.first_name[0]}{student.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{student.first_name} {student.last_name}</h4>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getGradeColor(student.overall_grade)}`}>
                                {student.overall_grade}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.missing_assignments} missing
                              </p>
                            </div>
                            {getGradeTrend(student.grade_trend)}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Progress value={student.overall_grade} className="h-2" />
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            Attendance: {student.attendance_rate || 0}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Completion: {student.assignment_completion_rate || 0}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 mt-6">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {assignment.assignment_type} • {assignment.total_points} points
                            </p>
                            {assignment.due_date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {assignment.submitted_count} submitted
                              </Badge>
                              <Badge variant="outline">
                                {assignment.graded_count} graded
                              </Badge>
                            </div>
                            <p className="text-lg font-bold mt-2">
                              Avg: {assignment.average_score}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Improving Students</span>
                        <Badge variant="default" className="bg-green-500">
                          {students.filter(s => s.grade_trend === 'improving').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Stable Performance</span>
                        <Badge variant="secondary">
                          {students.filter(s => s.grade_trend === 'stable').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Declining Students</span>
                        <Badge variant="destructive">
                          {students.filter(s => s.grade_trend === 'declining').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>At-Risk Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {students.filter(s => s.overall_grade < 70 || s.missing_assignments > 2).map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium">
                              {student.first_name} {student.last_name}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {student.overall_grade}% • {student.missing_assignments} missing
                            </Badge>
                          </div>
                        ))}
                        {students.filter(s => s.overall_grade < 70 || s.missing_assignments > 2).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No at-risk students identified
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStudent.first_name} {selectedStudent.last_name} - Detailed Grades
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{selectedStudent.overall_grade}%</p>
                    <p className="text-sm text-muted-foreground">Overall Grade</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{selectedStudent.attendance_rate || 0}%</p>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{selectedStudent.missing_assignments}</p>
                    <p className="text-sm text-muted-foreground">Missing Assignments</p>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {selectedStudent.grades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h5 className="font-medium">{grade.assignment_title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {grade.graded_at ? new Date(grade.graded_at).toLocaleDateString() : 'Not graded'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getGradeColor(grade.percentage || 0)}`}>
                          {grade.percentage || 0}%
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditGrade(grade)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Grade Edit Modal */}
      {editingGrade && (
        <Dialog open={!!editingGrade} onOpenChange={() => setEditingGrade(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Grade</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="points">Points Earned</Label>
                  <Input
                    id="points"
                    type="number"
                    value={editForm.points_earned}
                    onChange={(e) => setEditForm(prev => ({ ...prev, points_earned: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="percentage">Percentage</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.percentage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, percentage: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="letterGrade">Letter Grade</Label>
                <Select value={editForm.letter_grade} onValueChange={(value) => setEditForm(prev => ({ ...prev, letter_grade: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={editForm.feedback}
                  onChange={(e) => setEditForm(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Add feedback for the student..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingGrade(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGrade}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Grade
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GradeTracker;