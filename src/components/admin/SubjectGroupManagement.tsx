import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  BookOpen, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  GraduationCap,
  UserCheck,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SubjectGroup {
  id: string;
  name: string;
  description: string;
  grade_id: string;
  is_active: boolean;
  grade: {
    name: string;
  };
  subjects: Subject[];
  student_count: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface StudentEnrollment {
  id: string;
  student_id: string;
  student_name: string;
  email: string;
  group_name: string;
  group_id: string;
  grade_name: string;
  enrollment_date: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Grade {
  id: string;
  name: string;
}

const SubjectGroupManagement = () => {
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  
  // Enrollment management state
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isEditEnrollmentDialogOpen, setIsEditEnrollmentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [editingEnrollment, setEditingEnrollment] = useState<StudentEnrollment | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<SubjectGroup[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subject groups with their subjects and grade information
      const { data: groups, error: groupsError } = await supabase
        .from('subject_groups')
        .select(`
          *,
          grade:grades(name),
          subject_group_assignments(
            subject:subjects(*)
          )
        `)
        .eq('is_active', true)
        .order('grade_id', { ascending: true });

      if (groupsError) {
        console.error('Error fetching subject groups:', groupsError);
        toast({
          title: "Error",
          description: "Failed to fetch subject groups",
          variant: "destructive",
        });
        return;
      }

      // Fetch student counts for each group
      const groupsWithCounts = await Promise.all(
        groups?.map(async (group: any) => {
          const { count } = await supabase
            .from('student_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('subject_group_id', group.id)
            .eq('is_active', true);

          return {
            ...group,
            subjects: group.subject_group_assignments?.map((sga: any) => sga.subject) || [],
            student_count: count || 0
          };
        }) || []
      );

      setSubjectGroups(groupsWithCounts);

      // Fetch student enrollments with group and grade information
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          student:profiles!student_enrollments_student_id_fkey(full_name, email),
          subject_group:subject_groups(name, grade:grades(name))
        `)
        .eq('is_active', true)
        .not('subject_group_id', 'is', null);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else {
        const formattedEnrollments = enrollments?.map((enrollment: any) => ({
          id: enrollment.id,
          student_id: enrollment.student_id,
          student_name: enrollment.student?.full_name || 'Unknown',
          email: enrollment.student?.email || 'Unknown',
          group_name: enrollment.subject_group?.name || 'No Group',
          group_id: enrollment.subject_group_id,
          grade_name: enrollment.subject_group?.grade?.name || 'Unknown',
          enrollment_date: enrollment.enrollment_date
        })) || [];

        setStudentEnrollments(formattedEnrollments);
      }

      // Fetch all students for enrollment dropdown
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'student')
        .order('full_name');

      if (!studentsError) {
        setStudents(studentsData || []);
      }

      // Fetch all grades for grade selection
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('id, name')
        .order('name');

      if (!gradesError) {
        setGrades(gradesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleAssignments = async () => {
    try {
      // Create some sample teacher assignments for testing
      const { data: teachers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .limit(3);

      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .limit(5);

      if (teachers && subjects && teachers.length > 0 && subjects.length > 0) {
        const assignments: any[] = [];
        
        // Assign first teacher to first 2 subjects
        assignments.push({
          teacher_id: (teachers[0] as any).id,
          subject_id: (subjects[0] as any).id,
          is_active: true
        });

        if (subjects[1]) {
          assignments.push({
            teacher_id: (teachers[0] as any).id,
            subject_id: (subjects[1] as any).id,
            is_active: true
          });
        }

        // Assign second teacher if available
        if (teachers[1] && subjects[2]) {
          assignments.push({
            teacher_id: (teachers[1] as any).id,
            subject_id: (subjects[2] as any).id,
            is_active: true
          });
        }

        const { error } = await (supabase
          .from('teacher_assignments') as any)
          .insert(assignments);

        if (error) {
          console.error('Error creating assignments:', error);
          toast({
            title: "Error", 
            description: "Failed to create sample teacher assignments",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: `Created ${assignments.length} teacher assignments`,
          });
        }
      } else {
        toast({
          title: "Info",
          description: "No teachers or subjects available for assignment",
        });
      }
    } catch (error) {
      console.error('Error creating sample assignments:', error);
    }
  };

  const handleEditGroup = (group: SubjectGroup) => {
    setEditingGroup(group);
    setEditFormData({
      name: group.name,
      description: group.description
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGroup) return;

    try {
      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase
        .from('subject_groups') as any)
        .update(updateData)
        .eq('id', editingGroup.id);

      if (error) {
        console.error('Error updating subject group:', error);
        toast({
          title: "Error",
          description: "Failed to update subject group",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Subject group updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingGroup(null);
      setEditFormData({ name: '', description: '' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating subject group:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingGroup(null);
    setEditFormData({ name: '', description: '' });
  };

  // Enrollment management functions
  const handleGradeSelection = (gradeId: string) => {
    setSelectedGrade(gradeId);
    const groupsForGrade = subjectGroups.filter(group => group.grade_id === gradeId);
    setFilteredGroups(groupsForGrade);
    setSelectedGroup(''); // Reset group selection when grade changes
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudent || !selectedGroup) {
      toast({
        title: "Error",
        description: "Please select both a student and a subject group",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if student is already enrolled
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('*')
        .eq('student_id', selectedStudent)
        .eq('is_active', true)
        .single();

      if (existingEnrollment) {
        // Update existing enrollment
        const { error } = await (supabase
          .from('student_enrollments') as any)
          .update({
            subject_group_id: selectedGroup,
            enrollment_date: new Date().toISOString()
          })
          .eq('student_id', selectedStudent);

        if (error) throw error;
      } else {
        // Create new enrollment
        const { error } = await (supabase
          .from('student_enrollments') as any)
          .insert({
            student_id: selectedStudent,
            subject_group_id: selectedGroup,
            enrollment_date: new Date().toISOString(),
            is_active: true
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Student enrolled successfully",
      });

      setIsEnrollDialogOpen(false);
      setSelectedStudent('');
      setSelectedGroup('');
      setSelectedGrade('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to enroll student",
        variant: "destructive",
      });
    }
  };

  const handleEditEnrollment = (enrollment: StudentEnrollment) => {
    setEditingEnrollment(enrollment);
    setSelectedStudent(enrollment.student_id);
    setSelectedGrade(subjectGroups.find(g => g.id === enrollment.group_id)?.grade_id || '');
    setSelectedGroup(enrollment.group_id);
    
    // Set filtered groups based on current grade
    const currentGradeId = subjectGroups.find(g => g.id === enrollment.group_id)?.grade_id;
    if (currentGradeId) {
      const groupsForGrade = subjectGroups.filter(group => group.grade_id === currentGradeId);
      setFilteredGroups(groupsForGrade);
    }
    
    setIsEditEnrollmentDialogOpen(true);
  };

  const handleUpdateEnrollment = async () => {
    if (!editingEnrollment || !selectedGroup) {
      toast({
        title: "Error",
        description: "Please select a subject group",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase
        .from('student_enrollments') as any)
        .update({
          subject_group_id: selectedGroup,
          enrollment_date: new Date().toISOString()
        })
        .eq('id', editingEnrollment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enrollment updated successfully",
      });

      setIsEditEnrollmentDialogOpen(false);
      setEditingEnrollment(null);
      setSelectedStudent('');
      setSelectedGroup('');
      setSelectedGrade('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast({
        title: "Error",
        description: "Failed to update enrollment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student enrollment?')) {
      return;
    }

    try {
      const { error } = await (supabase
        .from('student_enrollments') as any)
        .update({ is_active: false })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student enrollment removed",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing enrollment:', error);
      toast({
        title: "Error",
        description: "Failed to remove enrollment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Subject Groups Management</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Subject Groups Management</h3>
          <p className="text-muted-foreground">Manage student subject groups and enrollments for all grades (8-12)</p>
        </div>
        <div className="space-x-2">
          <Button onClick={createSampleAssignments} variant="outline">
            <UserCheck className="mr-2 h-4 w-4" />
            Create Sample Teacher Assignments
          </Button>
          <Button onClick={fetchData} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Subject Groups</TabsTrigger>
          <TabsTrigger value="enrollments">Student Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          {/* Group by Grade */}
          {['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(gradeName => {
            const gradeGroups = subjectGroups.filter(group => group.grade?.name === gradeName);
            
            if (gradeGroups.length === 0) return null;
            
            return (
              <div key={gradeName} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-semibold">{gradeName}</h3>
                  <Badge variant="outline">{gradeGroups.length} groups</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {gradeGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>{group.description}</CardDescription>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Badge variant="secondary">
                              {group.student_count} students
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {group.grade?.name}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Subjects ({group.subjects.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {group.subjects.map((subject) => (
                        <div key={subject.id} className="flex justify-between items-center text-sm">
                          <span>{subject.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {subject.code}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditGroup(group)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Users className="mr-1 h-3 w-3" />
                      Students
                    </Button>
                  </div>
                </CardContent>
              </Card>
                  ))}
                  
                  {/* Add new group card for each grade */}
                  <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-2">
                      <Plus className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500 text-center">Add New Subject Group for {gradeName}</p>
                      <Button variant="outline">Create Group</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Student Enrollments</CardTitle>
                  <CardDescription>
                    Students who have selected their subject groups
                  </CardDescription>
                </div>
                <Button onClick={() => setIsEnrollDialogOpen(true)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Enroll Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentEnrollments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="mx-auto h-12 w-12 mb-4" />
                  <p>No student enrollments found</p>
                  <p className="text-sm">Students will appear here once they select their subject groups</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{enrollment.student_name}</div>
                        <div className="text-sm text-gray-500">{enrollment.email}</div>
                        <div className="text-xs text-gray-400">
                          Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex flex-col gap-1">
                          <Badge variant="default">{enrollment.group_name}</Badge>
                          <Badge variant="outline" className="text-xs">{enrollment.grade_name}</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditEnrollment(enrollment)}
                            title="Edit enrollment"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteEnrollment(enrollment.id)}
                            title="Remove enrollment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enroll Student Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enroll Student in Subject Group</DialogTitle>
            <DialogDescription>
              Select a student and assign them to a subject group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right">
                Student
              </Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade" className="text-right">
                Grade
              </Label>
              <Select value={selectedGrade} onValueChange={handleGradeSelection}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                Subject Group
              </Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedGrade}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a subject group" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnrollStudent}>Enroll Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Enrollment Dialog */}
      <Dialog open={isEditEnrollmentDialogOpen} onOpenChange={setIsEditEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student Enrollment</DialogTitle>
            <DialogDescription>
              Change the subject group for {editingEnrollment?.student_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right">
                Student
              </Label>
              <Input
                className="col-span-3"
                value={editingEnrollment?.student_name || ''}
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="grade" className="text-right">
                Grade
              </Label>
              <Select value={selectedGrade} onValueChange={handleGradeSelection}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                Subject Group
              </Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedGrade}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a subject group" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEnrollmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEnrollment}>Update Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subject Group</DialogTitle>
            <DialogDescription>
              Make changes to the subject group details here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Group Name
              </Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectGroupManagement;