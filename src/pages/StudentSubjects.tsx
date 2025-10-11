import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const StudentSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!user?.id) return setLoading(false);
      setLoading(true);

      try {
        // Join subject_enrollments -> subjects -> grades to fetch complete details
        const { data } = await (supabase as any)
          .from('subject_enrollments')
          .select(`
            *, 
            subjects(
              *,
              grades(name)
            )
          `)
          .eq('student_id', user.id)
          .eq('is_active', true);

        // normalize to subject rows
        const subs = (data || []).map((row: any) => row.subjects || row.subject);
        setSubjects(subs.filter(Boolean));
      } catch (err) {
        console.error('Error loading student subjects', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Subjects</h1>
          <p className="text-muted-foreground">Click a subject to view materials and assignments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1,2,3].map(i => (
              <Card key={i}><CardHeader/><CardContent className="h-24"/></Card>
            ))
          ) : (
            subjects.map((s: any) => (
              <Link key={s.id} to={`/student/subjects/${s.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                        {s.grades?.name || 'Unknown Grade'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono bg-gray-100 px-2 py-1 rounded w-fit">
                      {s.code}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}

          {!loading && subjects.length === 0 && (
            <div className="text-center text-muted-foreground col-span-full">No subjects found. Please select a subject group.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentSubjects;
