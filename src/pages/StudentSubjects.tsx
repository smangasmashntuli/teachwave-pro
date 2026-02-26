import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, ArrowLeft, Calendar } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  enrollment_date: string;
}

export default function StudentSubjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await studentAPI.getSubjects();
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subjects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading subjects...</div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">My Subjects</h1>
        <p className="text-gray-600 mt-2">View your enrolled subjects</p>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <p>No subjects enrolled yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {subject.name}
                </CardTitle>
                <CardDescription>Code: {subject.code}</CardDescription>
              </CardHeader>
              <CardContent>
                {subject.description && (
                  <p className="text-sm text-gray-600 mb-4">{subject.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Enrolled: {new Date(subject.enrollment_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/student/subjects/${subject.id}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
