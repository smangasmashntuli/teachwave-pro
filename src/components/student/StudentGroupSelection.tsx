import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  ArrowRight,
  Users,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Grade {
  id: string;
  name: string;
  description: string;
}

interface SubjectGroup {
  id: string;
  name: string;
  description: string;
  grade_id: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

const StudentGroupSelection = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available grades
      const { data: gradesData, error: gradesError } = await (supabase as any)
        .from('grades')
        .select('*')
        .order('name', { ascending: true });

      if (gradesError) {
        console.error('Error fetching grades:', gradesError);
        toast({
          title: "Error",
          description: "Failed to fetch available grades",
          variant: "destructive",
        });
        return;
      }

      setGrades(gradesData || []);

      // Fetch subject groups with their subjects
      const { data: groupsData, error: groupsError } = await (supabase as any)
        .from('subject_groups')
        .select(`
          *,
          subject_group_assignments(
            subject:subjects(*)
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (groupsError) {
        console.error('Error fetching subject groups:', groupsError);
        toast({
          title: "Error",
          description: "Failed to fetch subject groups",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to include subjects directly in the group
      const transformedGroups = groupsData?.map((group: any) => ({
        ...group,
        subjects: group.subject_group_assignments?.map((sga: any) => sga.subject) || []
      })) || [];

      setSubjectGroups(transformedGroups);

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

  const handleGradeSelection = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedGroup(''); // Reset group selection when grade changes
  };

  const handleGroupSelection = (groupId: string) => {
    setSelectedGroup(groupId);
  };

  const submitSelection = async () => {
    if (!selectedGrade || !selectedGroup) {
      toast({
        title: "Error",
        description: "Please select both a grade and a subject group",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // First, deactivate any existing enrollment for this student
      await (supabase as any)
        .from('student_enrollments')
        .update({ is_active: false })
        .eq('student_id', user?.id!)
        .eq('is_active', true);

      // Create new enrollment record
      const { error: enrollmentError } = await (supabase as any)
        .from('student_enrollments')
        .insert({
          student_id: user?.id!,
          grade_id: selectedGrade,
          subject_group_id: selectedGroup,
          enrollment_date: new Date().toISOString(),
          is_active: true
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        toast({
          title: "Error",
          description: "Failed to save your selection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your grade and subject group have been selected successfully.",
      });

      // Move to confirmation step
      setStep(3);

    } catch (error) {
      console.error('Error submitting selection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGradeData = grades.find(g => g.id === selectedGrade);
  const selectedGroupData = subjectGroups.find(g => g.id === selectedGroup);
  const availableGroups = subjectGroups.filter(g => g.grade_id === selectedGrade);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Subject Selection</h1>
            <p className="text-muted-foreground">Loading available options...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Selection Complete!</CardTitle>
            <CardDescription>
              You have successfully selected your grade and subject group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">
                  {selectedGradeData?.name} - {selectedGroupData?.name}
                </div>
                <div className="text-sm text-blue-700">
                  {selectedGroupData?.subjects.length} subjects enrolled
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Your Subjects:</h4>
              <div className="grid gap-2">
                {selectedGroupData?.subjects.map((subject) => (
                  <div key={subject.id} className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">{subject.name}</span>
                    <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>What's Next?</AlertTitle>
              <AlertDescription>
                You can now access your classes, assignments, and learning materials through your student dashboard.
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={() => window.location.reload()}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Select Your Grade and Subject Group</h1>
          <p className="text-muted-foreground">
            Choose your current grade (8-12) and the subject combination that matches your academic focus. 
            From Grade 10 onwards, you can select specialized streams like Science, Accounting, or Humanities.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span>Select Grade</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 mt-1" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span>Select Subject Group</span>
          </div>
        </div>

        {/* Step 1: Grade Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Step 1: Select Your Grade</h2>
            <RadioGroup value={selectedGrade} onValueChange={handleGradeSelection}>
              <div className="grid gap-4 md:grid-cols-3">
                {grades.map((grade) => (
                  <Card key={grade.id} className={`cursor-pointer transition-colors ${
                    selectedGrade === grade.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={grade.id} id={grade.id} />
                        <div className="flex-1">
                          <Label htmlFor={grade.id} className="cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-5 w-5 text-blue-600" />
                              <div>
                                <div className="font-medium">{grade.name}</div>
                                <div className="text-sm text-gray-500">{grade.description}</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
            
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedGrade}
                className="min-w-[200px]"
              >
                Next: Select Subject Group
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Subject Group Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Step 2: Select Your Subject Group</h2>
              <p className="text-muted-foreground">
                Subjects for {selectedGradeData?.name}
              </p>
            </div>
            
            <RadioGroup value={selectedGroup} onValueChange={handleGroupSelection}>
              <div className="grid gap-4 md:grid-cols-2">
                {availableGroups.map((group) => (
                  <Card key={group.id} className={`cursor-pointer transition-colors ${
                    selectedGroup === group.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value={group.id} id={group.id} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={group.id} className="cursor-pointer">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="h-5 w-5 text-green-600" />
                                <div>
                                  <div className="font-medium">{group.name}</div>
                                  <div className="text-sm text-gray-500">{group.description}</div>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">
                                    {group.subjects.length} subjects included:
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 pl-6">
                                  {group.subjects.slice(0, 4).map(s => s.name).join(', ')}
                                  {group.subjects.length > 4 && `, +${group.subjects.length - 4} more`}
                                </div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
            
            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={submitSelection}
                disabled={!selectedGroup || submitting}
                className="min-w-[200px]"
              >
                {submitting ? "Enrolling..." : "Complete Enrollment"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGroupSelection;