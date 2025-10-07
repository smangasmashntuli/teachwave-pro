import React from 'react';
import StudentGroupSelectionMockDemo from '@/components/student/StudentGroupSelectionMockDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Demo page to test the StudentGroupSelection component
const StudentGroupSelectionDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Student Group Selection Demo
          </h1>
          <p className="text-lg text-gray-600">
            This is a demo of the student grade and subject group selection interface.
          </p>
        </div>
        
        <Alert className="mb-6 max-w-4xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Interactive Demo:</strong> This demo uses sample data to show the complete functionality. 
            Try selecting different grades to see how the subject groups change for each level. The real system 
            will save selections to the database.
          </AlertDescription>
        </Alert>
        
        {/* Demo Interface */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Student Grade & Subject Group Selection</CardTitle>
            <CardDescription>
              This interface allows students to select their grade level and subject combination 
              for the South African curriculum (Grades 8-12). Students choose their stream from Grade 10 
              onwards and continue in that stream until matric.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentGroupSelectionMockDemo />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentGroupSelectionDemo;