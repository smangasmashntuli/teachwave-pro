import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = React.useState<any | null>(null);
  const [content, setContent] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [quizzes, setQuizzes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: subj } = await (supabase as any)
          .from('subjects')
          .select('*')
          .eq('id', id)
          .single();

        setSubject(subj);

        const [contentRes, assignRes, quizRes] = await Promise.all([
          (supabase as any).from('learning_content').select('*').eq('subject_id', id).eq('is_published', true),
          (supabase as any).from('assignments').select('*').eq('subject_id', id).eq('is_published', true),
          (supabase as any).from('quizzes').select('*').eq('subject_id', id).eq('is_published', true),
        ]);

        setContent(contentRes.data || []);
        setAssignments(assignRes.data || []);
        setQuizzes(quizRes.data || []);
      } catch (err) {
        console.error('Error loading subject detail', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{subject?.name || 'Subject'}</h1>
          <p className="text-muted-foreground">{subject?.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Learning Materials</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : (
                content.length ? (
                  <div className="space-y-3">
                    {content.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                            c.content_type === 'pdf' ? 'bg-red-100 text-red-600' :
                            c.content_type === 'video' ? 'bg-blue-100 text-blue-600' :
                            c.content_type === 'document' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {c.content_type.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{c.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {c.description || `${c.content_type} file`}
                              {c.file_size && ` • ${Math.round(c.file_size / 1024)} KB`}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={c.file_url} target="_blank" rel="noreferrer">
                            {c.content_type === 'video' ? 'Watch' : 'View'}
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No materials uploaded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : (
                assignments.length ? (
                  <div className="space-y-3">
                    {assignments.map(a => (
                      <div key={a.id} className="p-3 border rounded-lg hover:bg-muted/50">
                        <div className="font-medium">{a.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Due: {a.due_date ? new Date(a.due_date).toLocaleString() : 'N/A'}
                          {a.total_marks && ` • ${a.total_marks} marks`}
                        </div>
                        {a.description && (
                          <p className="text-sm text-muted-foreground mb-2">{a.description}</p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate('/student/assignments')}
                        >
                          View Assignment
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No assignments published yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quizzes / Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : (
                quizzes.length ? (
                  <div className="space-y-3">
                    {quizzes.map(q => (
                      <div key={q.id} className="p-3 border rounded-lg hover:bg-muted/50">
                        <div className="font-medium">{q.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Available: {q.start_date ? new Date(q.start_date).toLocaleString() : 'N/A'}
                          {q.total_marks && ` • ${q.total_marks} marks`}
                          {q.time_limit && ` • ${q.time_limit} minutes`}
                        </div>
                        {q.description && (
                          <p className="text-sm text-muted-foreground mb-2">{q.description}</p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate('/student/assignments')}
                        >
                          Take Quiz
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No quizzes available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubjectDetail;
