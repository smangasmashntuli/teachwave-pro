import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BookOpen, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  GraduationCap,
  UserCheck
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
  student_name: string;
  email: string;
  group_name: string;
  enrollment_date: string;
}

const SubjectGroupManagement = () => {
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch student enrollments with group information
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          student:profiles!student_enrollments_student_id_fkey(full_name, email),
          subject_group:subject_groups(name)
        `)
        .eq('is_active', true)
        .not('subject_group_id', 'is', null);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else {
        const formattedEnrollments = enrollments?.map((enrollment: any) => ({
          id: enrollment.id,
          student_name: enrollment.student?.full_name || 'Unknown',
          email: enrollment.student?.email || 'Unknown',
          group_name: enrollment.subject_group?.name || 'No Group',
          enrollment_date: enrollment.enrollment_date
        })) || [];

        setStudentEnrollments(formattedEnrollments);
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
                    <Button size="sm" variant="outline" className="flex-1">
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
              <CardTitle>Student Enrollments</CardTitle>
              <CardDescription>
                Students who have selected their subject groups
              </CardDescription>
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
                        <Badge>{enrollment.group_name}</Badge>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
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
    </div>
  );
};

export default SubjectGroupManagement;