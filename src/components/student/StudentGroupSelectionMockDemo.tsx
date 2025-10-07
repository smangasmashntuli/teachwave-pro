import React, { useState } from 'react';
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

// Mock data for demo purposes
const mockGrades: Grade[] = [
  { id: '8', name: 'Grade 8', description: 'Foundation phase of high school' },
  { id: '9', name: 'Grade 9', description: 'Intermediate phase of high school' },
  { id: '10', name: 'Grade 10', description: 'Senior phase - First year' },
  { id: '11', name: 'Grade 11', description: 'Senior phase - Second year' },
  { id: '12', name: 'Grade 12', description: 'Final year - Matric' },
];

const mockSubjectGroups: SubjectGroup[] = [
  // Grade 8 Core
  {
    id: 'g8-core',
    name: 'Grade 8 Core',
    description: 'All mandatory subjects for Grade 8',
    grade_id: '8',
    subjects: [
      { id: 's1', name: 'IsiZulu Grade 8', code: 'ZULU_8', description: 'IsiZulu Home Language' },
      { id: 's2', name: 'English FAL Grade 8', code: 'ENG_FAL_8', description: 'English First Additional Language' },
      { id: 's3', name: 'Mathematics Grade 8', code: 'MATH_8', description: 'Mathematics' },
      { id: 's4', name: 'Geography Grade 8', code: 'GEO_8', description: 'Geography' },
      { id: 's5', name: 'Natural Sciences Grade 8', code: 'NAT_SCI_8', description: 'Natural Sciences' },
      { id: 's6', name: 'Technology Grade 8', code: 'TECH_8', description: 'Technology' },
      { id: 's7', name: 'History Grade 8', code: 'HIST_8', description: 'History' },
      { id: 's8', name: 'Life Orientation Grade 8', code: 'LO_8', description: 'Life Orientation' },
    ]
  },
  // Grade 9 Core
  {
    id: 'g9-core',
    name: 'Grade 9 Core',
    description: 'All mandatory subjects for Grade 9',
    grade_id: '9',
    subjects: [
      { id: 's9', name: 'IsiZulu Grade 9', code: 'ZULU_9', description: 'IsiZulu Home Language' },
      { id: 's10', name: 'English FAL Grade 9', code: 'ENG_FAL_9', description: 'English First Additional Language' },
      { id: 's11', name: 'Mathematics Grade 9', code: 'MATH_9', description: 'Mathematics' },
      { id: 's12', name: 'Geography Grade 9', code: 'GEO_9', description: 'Geography' },
      { id: 's13', name: 'Natural Sciences Grade 9', code: 'NAT_SCI_9', description: 'Natural Sciences' },
      { id: 's14', name: 'Technology Grade 9', code: 'TECH_9', description: 'Technology' },
      { id: 's15', name: 'History Grade 9', code: 'HIST_9', description: 'History' },
      { id: 's16', name: 'Life Orientation Grade 9', code: 'LO_9', description: 'Life Orientation' },
    ]
  },
  // Grade 10 streams
  {
    id: 'g10-science',
    name: 'Grade 10 Science',
    description: 'Science stream for Grade 10',
    grade_id: '10',
    subjects: [
      { id: 's17', name: 'English FAL Grade 10', code: 'ENG_FAL_10', description: 'English First Additional Language' },
      { id: 's18', name: 'IsiZulu Grade 10', code: 'ZULU_10', description: 'IsiZulu Home Language' },
      { id: 's19', name: 'Life Orientation Grade 10', code: 'LO_10', description: 'Life Orientation' },
      { id: 's20', name: 'Physical Sciences Grade 10', code: 'PHY_SCI_10', description: 'Physics and Chemistry' },
      { id: 's21', name: 'Life Sciences Grade 10', code: 'LIFE_SCI_10', description: 'Biology' },
      { id: 's22', name: 'Mathematics Grade 10', code: 'MATH_10', description: 'Pure Mathematics' },
      { id: 's23', name: 'Geography Grade 10', code: 'GEO_10', description: 'Geography' },
    ]
  },
  {
    id: 'g10-accounting',
    name: 'Grade 10 Accounting',
    description: 'Accounting stream for Grade 10',
    grade_id: '10',
    subjects: [
      { id: 's24', name: 'English FAL Grade 10', code: 'ENG_FAL_10', description: 'English First Additional Language' },
      { id: 's25', name: 'IsiZulu Grade 10', code: 'ZULU_10', description: 'IsiZulu Home Language' },
      { id: 's26', name: 'Life Orientation Grade 10', code: 'LO_10', description: 'Life Orientation' },
      { id: 's27', name: 'Accounting Grade 10', code: 'ACC_10', description: 'Accounting' },
      { id: 's28', name: 'Business Studies Grade 10', code: 'BUS_STUD_10', description: 'Business Studies' },
      { id: 's29', name: 'Economics Grade 10', code: 'ECON_10', description: 'Economics' },
      { id: 's30', name: 'Mathematical Literacy Grade 10', code: 'MATH_LIT_10', description: 'Mathematical Literacy' },
    ]
  },
  {
    id: 'g10-humanities',
    name: 'Grade 10 Humanities',
    description: 'Humanities stream for Grade 10',
    grade_id: '10',
    subjects: [
      { id: 's31', name: 'English FAL Grade 10', code: 'ENG_FAL_10', description: 'English First Additional Language' },
      { id: 's32', name: 'IsiZulu Grade 10', code: 'ZULU_10', description: 'IsiZulu Home Language' },
      { id: 's33', name: 'Life Orientation Grade 10', code: 'LO_10', description: 'Life Orientation' },
      { id: 's34', name: 'History Grade 10', code: 'HIST_10', description: 'History' },
      { id: 's35', name: 'Geography Grade 10', code: 'GEO_HUM_10', description: 'Geography' },
      { id: 's36', name: 'Mathematical Literacy Grade 10', code: 'MATH_LIT_HUM_10', description: 'Mathematical Literacy' },
    ]
  },
  // Grade 11 streams
  {
    id: 'g11-science',
    name: 'Grade 11 Science',
    description: 'Science stream for Grade 11',
    grade_id: '11',
    subjects: [
      { id: 's37', name: 'English FAL Grade 11', code: 'ENG_FAL_11', description: 'English First Additional Language' },
      { id: 's38', name: 'IsiZulu Grade 11', code: 'ZULU_11', description: 'IsiZulu Home Language' },
      { id: 's39', name: 'Life Orientation Grade 11', code: 'LO_11', description: 'Life Orientation' },
      { id: 's40', name: 'Physical Sciences Grade 11', code: 'PHY_SCI_11', description: 'Physics and Chemistry' },
      { id: 's41', name: 'Life Sciences Grade 11', code: 'LIFE_SCI_11', description: 'Biology' },
      { id: 's42', name: 'Mathematics Grade 11', code: 'MATH_11', description: 'Pure Mathematics' },
      { id: 's43', name: 'Geography Grade 11', code: 'GEO_11', description: 'Geography' },
    ]
  },
  {
    id: 'g11-accounting',
    name: 'Grade 11 Accounting',
    description: 'Accounting stream for Grade 11',
    grade_id: '11',
    subjects: [
      { id: 's44', name: 'English FAL Grade 11', code: 'ENG_FAL_11', description: 'English First Additional Language' },
      { id: 's45', name: 'IsiZulu Grade 11', code: 'ZULU_11', description: 'IsiZulu Home Language' },
      { id: 's46', name: 'Life Orientation Grade 11', code: 'LO_11', description: 'Life Orientation' },
      { id: 's47', name: 'Accounting Grade 11', code: 'ACC_11', description: 'Accounting' },
      { id: 's48', name: 'Business Studies Grade 11', code: 'BUS_STUD_11', description: 'Business Studies' },
      { id: 's49', name: 'Economics Grade 11', code: 'ECON_11', description: 'Economics' },
      { id: 's50', name: 'Mathematical Literacy Grade 11', code: 'MATH_LIT_11', description: 'Mathematical Literacy' },
    ]
  },
  {
    id: 'g11-humanities',
    name: 'Grade 11 Humanities',
    description: 'Humanities stream for Grade 11',
    grade_id: '11',
    subjects: [
      { id: 's51', name: 'English FAL Grade 11', code: 'ENG_FAL_11', description: 'English First Additional Language' },
      { id: 's52', name: 'IsiZulu Grade 11', code: 'ZULU_11', description: 'IsiZulu Home Language' },
      { id: 's53', name: 'Life Orientation Grade 11', code: 'LO_11', description: 'Life Orientation' },
      { id: 's54', name: 'History Grade 11', code: 'HIST_11', description: 'History' },
      { id: 's55', name: 'Geography Grade 11', code: 'GEO_HUM_11', description: 'Geography' },
      { id: 's56', name: 'Mathematical Literacy Grade 11', code: 'MATH_LIT_HUM_11', description: 'Mathematical Literacy' },
    ]
  },
  // Grade 12 streams
  {
    id: 'g12-science',
    name: 'Grade 12 Science',
    description: 'Science stream for Grade 12 - Matric',
    grade_id: '12',
    subjects: [
      { id: 's57', name: 'English FAL', code: 'ENG_FAL', description: 'English First Additional Language' },
      { id: 's58', name: 'IsiZulu', code: 'ZULU', description: 'IsiZulu Home Language' },
      { id: 's59', name: 'Life Orientation', code: 'LO', description: 'Life Orientation' },
      { id: 's60', name: 'Physical Sciences', code: 'PHY_SCI', description: 'Physics and Chemistry' },
      { id: 's61', name: 'Life Sciences', code: 'LIFE_SCI', description: 'Biology' },
      { id: 's62', name: 'Mathematics', code: 'MATH', description: 'Pure Mathematics' },
      { id: 's63', name: 'Geography', code: 'GEO', description: 'Geography' },
    ]
  },
  {
    id: 'g12-accounting',
    name: 'Grade 12 Accounting',
    description: 'Accounting stream for Grade 12 - Matric',
    grade_id: '12',
    subjects: [
      { id: 's64', name: 'English FAL', code: 'ENG_FAL', description: 'English First Additional Language' },
      { id: 's65', name: 'IsiZulu', code: 'ZULU', description: 'IsiZulu Home Language' },
      { id: 's66', name: 'Life Orientation', code: 'LO', description: 'Life Orientation' },
      { id: 's67', name: 'Accounting', code: 'ACC', description: 'Accounting' },
      { id: 's68', name: 'Business Studies', code: 'BUS_STUD', description: 'Business Studies' },
      { id: 's69', name: 'Economics', code: 'ECON', description: 'Economics' },
      { id: 's70', name: 'Mathematical Literacy', code: 'MATH_LIT', description: 'Mathematical Literacy' },
    ]
  },
];

const StudentGroupSelectionMockDemo = () => {
  const [step, setStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const handleGradeSelection = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedGroup(''); // Reset group selection when grade changes
  };

  const handleGroupSelection = (groupId: string) => {
    setSelectedGroup(groupId);
  };

  const submitSelection = () => {
    // Mock submission - just move to confirmation step
    setStep(3);
  };

  const selectedGradeData = mockGrades.find(g => g.id === selectedGrade);
  const selectedGroupData = mockSubjectGroups.find(g => g.id === selectedGroup);
  const availableGroups = mockSubjectGroups.filter(g => g.grade_id === selectedGrade);

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
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                This is a demonstration. In the real system, your selection would be saved to the database.
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={() => window.location.reload()}>
              Try Again
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
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {mockGrades.map((grade) => (
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
                Subject groups available for {selectedGradeData?.name}
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
                                  {group.subjects.slice(0, 4).map(s => s.name.replace(/Grade \d+/g, '')).join(', ')}
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
                disabled={!selectedGroup}
                className="min-w-[200px]"
              >
                Complete Enrollment
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGroupSelectionMockDemo;