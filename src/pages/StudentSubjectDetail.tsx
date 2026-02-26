import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, CheckCircle, Clock, User, Award, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubjectDetail {
  subject: {
    id: number;
    name: string;
    code: string;
    description: string;
    grade: string;
    enrollmentDate: string;
  };
  teacher: {
    teacher_name: string;
    teacher_email: string;
    employee_number: string;
    department: string;
  } | null;
  counts: {
    materials: number;
    quizzes: number;
    tests: number;
    assignments: number;
    resources: number;
  };
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'long_answer';
  points: number;
  options: string[] | null;
  order_number: number;
}

export default function StudentSubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Quiz taking state
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Test taking state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testAnswers, setTestAnswers] = useState<{ [key: number]: string }>({});
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(0);

  // Results state
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [currentResults, setCurrentResults] = useState<any>(null);

  useEffect(() => {
    fetchSubjectDetail();
  }, [id]);

  // Quiz timer
  useEffect(() => {
    if (timeRemaining > 0 && quizDialogOpen) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && quizDialogOpen && currentQuiz) {
      handleSubmitQuiz();
    }
  }, [timeRemaining, quizDialogOpen]);

  // Test timer
  useEffect(() => {
    if (testTimeRemaining > 0 && testDialogOpen) {
      const timer = setTimeout(() => setTestTimeRemaining(testTimeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (testTimeRemaining === 0 && testDialogOpen && currentTest) {
      handleSubmitTest();
    }
  }, [testTimeRemaining, testDialogOpen]);

  const fetchSubjectDetail = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getSubjectDetail(Number(id));
      setSubjectDetail(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load subject detail',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await studentAPI.getLearningMaterials(Number(id));
      console.log('Materials received:', response.data.materials);
      setMaterials(response.data.materials);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load learning materials',
        variant: 'destructive',
      });
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await studentAPI.getQuizzes(Number(id));
      console.log('Quizzes received:', response.data.quizzes);
      setQuizzes(response.data.quizzes);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load quizzes',
        variant: 'destructive',
      });
    }
  };

  const fetchTests = async () => {
    try {
      const response = await studentAPI.getTests(Number(id));
      console.log('Tests received:', response.data.tests);
      setTests(response.data.tests);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load tests',
        variant: 'destructive',
      });
    }
  };

  const fetchResources = async () => {
    try {
      const response = await studentAPI.getResources(Number(id));
      setResources(response.data.resources);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      });
    }
  };

  const startQuiz = async (quizId: number) => {
    try {
      const response = await studentAPI.getQuiz(quizId);
      setCurrentQuiz(response.data.quiz);
      setQuizQuestions(response.data.questions);
      setQuizAnswers({});
      setTimeRemaining(response.data.quiz.time_limit_minutes * 60);
      setQuizDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to start quiz',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const answers = Object.entries(quizAnswers).map(([questionId, answerText]) => ({
        questionId: Number(questionId),
        answerText
      }));

      const response = await studentAPI.submitQuiz(currentQuiz.id, { answers });
      
      toast({
        title: 'Success',
        description: `Quiz submitted! Score: ${response.data.totalScore}`,
      });
      
      setQuizDialogOpen(false);
      fetchQuizzes();
      
      // Show results if available
      if (response.data.isGraded) {
        viewQuizResults(currentQuiz.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit quiz',
        variant: 'destructive',
      });
    }
  };

  const viewQuizResults = async (quizId: number) => {
    try {
      const response = await studentAPI.getQuizResults(quizId);
      setCurrentResults({ ...response.data, type: 'quiz' });
      setResultsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load results',
        variant: 'destructive',
      });
    }
  };

  const startTest = async (testId: number) => {
    try {
      const response = await studentAPI.getTest(testId);
      setCurrentTest(response.data.test);
      setTestQuestions(response.data.questions);
      setTestAnswers({});
      setTestTimeRemaining(response.data.test.duration_minutes * 60);
      setTestDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to start test',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitTest = async () => {
    try {
      const answers = Object.entries(testAnswers).map(([questionId, answerText]) => ({
        questionId: Number(questionId),
        answerText
      }));

      const response = await studentAPI.submitTest(currentTest.id, { answers });
      
      toast({
        title: 'Success',
        description: `Test submitted! ${response.data.isGraded ? `Score: ${response.data.totalScore}` : 'Awaiting grading'}`,
      });
      
      setTestDialogOpen(false);
      fetchTests();
      
      // Show results if fully graded
      if (response.data.isGraded) {
        viewTestResults(currentTest.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit test',
        variant: 'destructive',
      });
    }
  };

  const viewTestResults = async (testId: number) => {
    try {
      const response = await studentAPI.getTestResults(testId);
      setCurrentResults({ ...response.data, type: 'test' });
      setResultsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load results',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuizStatus = (quiz: any) => {
    if (quiz.submission_id) {
      if (quiz.is_graded) {
        return <Badge className="bg-green-500">Completed - {quiz.total_score} pts</Badge>;
      }
      return <Badge className="bg-blue-500">Submitted - Awaiting Grade</Badge>;
    }
    if (quiz.due_date && new Date(quiz.due_date) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="secondary">Not Started</Badge>;
  };

  if (loading || !subjectDetail) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/student/subjects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">{subjectDetail.subject.name}</h2>
            <p className="text-muted-foreground">
              {subjectDetail.subject.code} • {subjectDetail.subject.grade}
            </p>
          </div>
        </div>

        {/* Teacher Info Card */}
        {subjectDetail.teacher && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {subjectDetail.teacher.teacher_name}</p>
                <p><strong>Email:</strong> {subjectDetail.teacher.teacher_email}</p>
                <p><strong>Department:</strong> {subjectDetail.teacher.department}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials" onClick={() => materials.length === 0 && fetchMaterials()}>Materials</TabsTrigger>
            <TabsTrigger value="quizzes" onClick={() => quizzes.length === 0 && fetchQuizzes()}>Quizzes</TabsTrigger>
            <TabsTrigger value="tests" onClick={() => tests.length === 0 && fetchTests()}>Tests</TabsTrigger>
            <TabsTrigger value="resources" onClick={() => resources.length === 0 && fetchResources()}>Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p><strong>Code:</strong> {subjectDetail.subject.code}</p>
                <p><strong>Grade:</strong> {subjectDetail.subject.grade}</p>
                <p><strong>Description:</strong> {subjectDetail.subject.description}</p>
                <p><strong>Enrolled:</strong> {new Date(subjectDetail.subject.enrollmentDate).toLocaleDateString()}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{subjectDetail.counts.materials}</div>
                      <p className="text-sm text-muted-foreground">Materials</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{subjectDetail.counts.quizzes}</div>
                      <p className="text-sm text-muted-foreground">Quizzes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{subjectDetail.counts.tests}</div>
                      <p className="text-sm text-muted-foreground">Tests</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{subjectDetail.counts.resources}</div>
                      <p className="text-sm text-muted-foreground">Resources</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <h3 className="text-lg font-semibold">Learning Materials</h3>
            {materials.length === 0 ? (
              <p className="text-muted-foreground">No learning materials available yet</p>
            ) : (
              <div className="grid gap-4">
                {materials.map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <CardTitle>{material.title}</CardTitle>
                      <CardDescription>{material.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        Uploaded by {material.teacher_name} • {new Date(material.created_at).toLocaleDateString()}
                      </p>
                      {material.file_url && (
                        <Button variant="outline" asChild>
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            View Material
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <h3 className="text-lg font-semibold">Quizzes</h3>
            {quizzes.length === 0 ? (
              <p className="text-muted-foreground">No quizzes available yet</p>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{quiz.title}</CardTitle>
                          <CardDescription>{quiz.description}</CardDescription>
                        </div>
                        {getQuizStatus(quiz)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <p><strong>Questions:</strong> {quiz.question_count}</p>
                        <p><strong>Time Limit:</strong> {quiz.time_limit_minutes} minutes</p>
                        <p><strong>Total Points:</strong> {quiz.total_points}</p>
                        {quiz.due_date && (
                          <p><strong>Due:</strong> {new Date(quiz.due_date).toLocaleString()}</p>
                        )}
                      </div>
                      {!quiz.submission_id ? (
                        <Button onClick={() => startQuiz(quiz.id)}>
                          Start Quiz
                        </Button>
                      ) : quiz.is_graded && (
                        <Button variant="outline" onClick={() => viewQuizResults(quiz.id)}>
                          <Award className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <h3 className="text-lg font-semibold">Tests</h3>
            {tests.length === 0 ? (
              <p className="text-muted-foreground">No tests available yet</p>
            ) : (
              <div className="grid gap-4">
                {tests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{test.title}</CardTitle>
                          <CardDescription>{test.description}</CardDescription>
                        </div>
                        {getQuizStatus(test)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <p><strong>Questions:</strong> {test.question_count}</p>
                        <p><strong>Duration:</strong> {test.duration_minutes} minutes</p>
                        <p><strong>Total Points:</strong> {test.total_points}</p>
                        {test.due_date && (
                          <p><strong>Due:</strong> {new Date(test.due_date).toLocaleString()}</p>
                        )}
                      </div>
                      {!test.submission_id ? (
                        <Button onClick={() => startTest(test.id)}>
                          Start Test
                        </Button>
                      ) : test.is_graded && (
                        <Button variant="outline" onClick={() => viewTestResults(test.id)}>
                          <Award className="mr-2 h-4 w-4" />
                          View Results
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Resources</h3>
            {resources.length === 0 ? (
              <p className="text-muted-foreground">No resources available yet</p>
            ) : (
              <div className="grid gap-4">
                {resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {resource.title}
                      </CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {resource.teacher_name} • Type: {resource.resource_type}
                      </p>
                      {(resource.file_url || resource.external_link) && (
                        <Button variant="outline" asChild>
                          <a href={resource.file_url || resource.external_link} target="_blank" rel="noopener noreferrer">
                            Open Resource
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quiz Taking Dialog */}
        <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{currentQuiz?.title}</span>
                <Badge variant={timeRemaining < 60 ? "destructive" : "secondary"}>
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTime(timeRemaining)}
                </Badge>
              </DialogTitle>
              <DialogDescription>{currentQuiz?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {quizQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6 space-y-4">
                    <h4 className="font-semibold">
                      Question {index + 1} ({question.points} {question.points === 1 ? 'pt' : 'pts'})
                    </h4>
                    <p>{question.question_text}</p>

                    {question.question_type === 'mcq' && question.options && (
                      <RadioGroup
                        value={quizAnswers[question.id] || ''}
                        onValueChange={(value) => setQuizAnswers({ ...quizAnswers, [question.id]: value })}
                      >
                        {question.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`q${question.id}-opt${i}`} />
                            <Label htmlFor={`q${question.id}-opt${i}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.question_type === 'true_false' && (
                      <RadioGroup
                        value={quizAnswers[question.id] || ''}
                        onValueChange={(value) => setQuizAnswers({ ...quizAnswers, [question.id]: value })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="True" id={`q${question.id}-true`} />
                          <Label htmlFor={`q${question.id}-true`}>True</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="False" id={`q${question.id}-false`} />
                          <Label htmlFor={`q${question.id}-false`}>False</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {question.question_type === 'short_answer' && (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={quizAnswers[question.id] || ''}
                        onChange={(e) => setQuizAnswers({ ...quizAnswers, [question.id]: e.target.value })}
                        rows={3}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button onClick={handleSubmitQuiz} className="w-full">
                Submit Quiz
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Test Taking Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>{currentTest?.title}</span>
                <Badge variant={testTimeRemaining < 300 ? "destructive" : "secondary"}>
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTime(testTimeRemaining)}
                </Badge>
              </DialogTitle>
              <DialogDescription>{currentTest?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {testQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6 space-y-4">
                    <h4 className="font-semibold">
                      Question {index + 1} ({question.points} {question.points === 1 ? 'pt' : 'pts'})
                    </h4>
                    <p>{question.question_text}</p>

                    {question.question_type === 'mcq' && question.options && (
                      <RadioGroup
                        value={testAnswers[question.id] || ''}
                        onValueChange={(value) => setTestAnswers({ ...testAnswers, [question.id]: value })}
                      >
                        {question.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`t${question.id}-opt${i}`} />
                            <Label htmlFor={`t${question.id}-opt${i}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.question_type === 'true_false' && (
                      <RadioGroup
                        value={testAnswers[question.id] || ''}
                        onValueChange={(value) => setTestAnswers({ ...testAnswers, [question.id]: value })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="True" id={`t${question.id}-true`} />
                          <Label htmlFor={`t${question.id}-true`}>True</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="False" id={`t${question.id}-false`} />
                          <Label htmlFor={`t${question.id}-false`}>False</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {(question.question_type === 'short_answer' || question.question_type === 'long_answer') && (
                      <Textarea
                        placeholder="Type your answer here..."
                        value={testAnswers[question.id] || ''}
                        onChange={(e) => setTestAnswers({ ...testAnswers, [question.id]: e.target.value })}
                        rows={question.question_type === 'long_answer' ? 8 : 3}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button onClick={handleSubmitTest} className="w-full">
                Submit Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Results Dialog */}
        <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentResults?.type === 'quiz' ? currentResults?.quiz?.title : currentResults?.test?.title} - Results
              </DialogTitle>
              <div className="flex gap-4 mt-4">
                <Badge className="text-lg">
                  Score: {currentResults?.submission?.total_score} / {currentResults?.type === 'quiz' ? currentResults?.quiz?.total_points : currentResults?.test?.total_points}
                </Badge>
                {currentResults?.submission?.is_graded && (
                  <Badge variant="secondary">
                    {Math.round((currentResults?.submission?.total_score / (currentResults?.type === 'quiz' ? currentResults?.quiz?.total_points : currentResults?.test?.total_points)) * 100)}%
                  </Badge>
                )}
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {currentResults?.answers.map((answer: any, index: number) => (
                <Card key={answer.id} className={answer.is_correct === true ? 'border-green-500' : answer.is_correct === false ? 'border-red-500' : ''}>
                  <CardContent className="pt-6 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      Question {index + 1}
                      {answer.is_correct === true && <Check className="h-4 w-4 text-green-500" />}
                      {answer.is_correct === false && <X className="h-4 w-4 text-red-500" />}
                      {answer.is_correct === null && <Clock className="h-4 w-4 text-yellow-500" />}
                    </h4>
                    <p className="text-sm">{answer.question_text}</p>
                    <div>
                      <Label className="text-sm text-muted-foreground">Your Answer:</Label>
                      <p>{answer.answer_text}</p>
                    </div>
                    {answer.correct_answer && answer.question_type !== 'long_answer' && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Correct Answer:</Label>
                        <p className="text-green-600">{answer.correct_answer}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Points: {answer.points_earned} / {answer.question_points}
                      </span>
                    </div>
                    {answer.feedback && (
                      <div className="bg-blue-50 p-3 rounded">
                        <Label className="text-sm font-medium">Teacher Feedback:</Label>
                        <p className="text-sm mt-1">{answer.feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
