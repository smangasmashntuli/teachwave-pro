import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, User, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Teacher {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  grade: {
    name: string;
  };
}

interface Assignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  assigned_date: string;
  is_active: boolean;
  teacher: Teacher;
  subject: Subject;
}

const TeacherAssignments = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      
      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone')
        .eq('role', 'teacher');

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Fetch subjects with grades
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id, 
          name, 
          code,
          grade:grades(name)
        `);

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch existing assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          teacher_id,
          subject_id,
          assigned_date,
          is_active,
          teacher:profiles(id, email, full_name, phone),
          subject:subjects(
            id, 
            name, 
            code,
            grade:grades(name)
          )
        `)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch data"
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAssignSubject = async () => {
    if (!selectedTeacher || !selectedSubject) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select both a teacher and a subject"
      });
      return;
    }

    // Check if assignment already exists
    const existingAssignment = assignments.find(
      a => a.teacher_id === selectedTeacher && a.subject_id === selectedSubject
    );

    if (existingAssignment) {
      toast({
        variant: "destructive",
        title: "Assignment Exists",
        description: "This teacher is already assigned to this subject"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from('teacher_assignments')
        .insert({
          teacher_id: selectedTeacher,
          subject_id: selectedSubject,
          is_active: true
        })
        .select(`
          id,
          teacher_id,
          subject_id,
          assigned_date,
          is_active,
          teacher:profiles(id, email, full_name, phone),
          subject:subjects(
            id, 
            name, 
            code,
            grade:grades(name)
          )
        `)
        .single();

      if (error) throw error;

      setAssignments([...assignments, data]);
      setSelectedTeacher('');
      setSelectedSubject('');

      toast({
        title: "Success",
        description: "Teacher assigned to subject successfully"
      });

    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: error.message || "Failed to assign teacher to subject"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      setLoading(true);

      const { error } = await (supabase as any)
        .from('teacher_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignments(assignments.filter(a => a.id !== assignmentId));

      toast({
        title: "Success",
        description: "Assignment removed successfully"
      });

    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove assignment"
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Assign Teacher to Subject
          </CardTitle>
          <CardDescription>
            Assign teachers to subjects they will be responsible for teaching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher">Select Teacher</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {teacher.full_name} ({teacher.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {subject.name} ({subject.code}) - {subject.grade?.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAssignSubject} 
                disabled={loading || !selectedTeacher || !selectedSubject}
                className="w-full"
              >
                {loading ? "Assigning..." : "Assign Subject"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Current Teacher Assignments ({assignments.length})
          </CardTitle>
          <CardDescription>
            View and manage all active teacher-subject assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No teacher assignments found</p>
              <p className="text-sm">Start by assigning teachers to subjects above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{assignment.teacher.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{assignment.teacher.email}</p>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className="ml-2">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {assignment.subject.name}
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        {assignment.subject.code}
                      </Badge>
                      <Badge variant="default" className="ml-2">
                        {assignment.subject.grade?.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {assignment.teacher.full_name} from teaching {assignment.subject.name}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove Assignment
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherAssignments;