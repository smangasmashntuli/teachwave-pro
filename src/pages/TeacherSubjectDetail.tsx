import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Plus, FileText, CheckCircle, Clock, Users } from 'lucide-react';

interface SubjectDetail {
  subject: {
    id: number;
    name: string;
    code: string;
    description: string;
    grade: string;
    gradeId: number;
  };
  counts: {
    materials: number;
    quizzes: number;
    tests: number;
    assignments: number;
    resources: number;
    students: number;
  };
}

interface Question {
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'long_answer';
  points: number;
  correctAnswer: string;
  options?: string[];
}

export default function TeacherSubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Quiz creation state
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizTotalPoints, setQuizTotalPoints] = useState(10);
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [quizDueDate, setQuizDueDate] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  // Test creation state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testTotalPoints, setTestTotalPoints] = useState(100);
  const [testDuration, setTestDuration] = useState(60);
  const [testDueDate, setTestDueDate] = useState('');
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);

  // Material upload state
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileType, setMaterialFileType] = useState('');

  // Resource upload state
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceType, setResourceType] = useState('file');
  const [resourceFileUrl, setResourceFileUrl] = useState('');
  const [resourceExternalLink, setResourceExternalLink] = useState('');

  useEffect(() => {
    fetchSubjectDetail();
  }, [id]);

  const fetchSubjectDetail = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getSubjectDetail(Number(id));
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
      const response = await teacherAPI.getLearningMaterials(Number(id));
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
      const response = await teacherAPI.getQuizzes(Number(id));
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
      const response = await teacherAPI.getTests(Number(id));
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
      const response = await teacherAPI.getResources(Number(id));
      setResources(response.data.resources);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      });
    }
  };

  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      questionText: '',
      questionType: 'mcq',
      points: 1,
      correctAnswer: '',
      options: ['', '', '', '']
    }]);
  };

  const updateQuizQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const removeQuizQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async () => {
    try {
      const totalPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);
      await teacherAPI.createQuiz(Number(id), {
        title: quizTitle,
        description: quizDescription,
        gradeId: subjectDetail?.subject.gradeId,
        totalPoints: totalPoints,
        timeLimitMinutes: quizTimeLimit,
        dueDate: quizDueDate,
        questions: quizQuestions
      });
      
      toast({
        title: 'Success',
        description: 'Quiz created successfully',
      });
      
      setQuizDialogOpen(false);
      resetQuizForm();
      fetchQuizzes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create quiz',
        variant: 'destructive',
      });
    }
  };

  const resetQuizForm = () => {
    setQuizTitle('');
    setQuizDescription('');
    setQuizTotalPoints(10);
    setQuizTimeLimit(15);
    setQuizDueDate('');
    setQuizQuestions([]);
  };

  const addTestQuestion = () => {
    setTestQuestions([...testQuestions, {
      questionText: '',
      questionType: 'mcq',
      points: 1,
      correctAnswer: '',
      options: ['', '', '', '']
    }]);
  };

  const updateTestQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...testQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setTestQuestions(updated);
  };

  const removeTestQuestion = (index: number) => {
    setTestQuestions(testQuestions.filter((_, i) => i !== index));
  };

  const handleCreateTest = async () => {
    try {
      const totalPoints = testQuestions.reduce((sum, q) => sum + q.points, 0);
      await teacherAPI.createTest(Number(id), {
        title: testTitle,
        description: testDescription,
        gradeId: subjectDetail?.subject.gradeId,
        totalPoints: totalPoints,
        durationMinutes: testDuration,
        dueDate: testDueDate,
        questions: testQuestions
      });
      
      toast({
        title: 'Success',
        description: 'Test created successfully',
      });
      
      setTestDialogOpen(false);
      resetTestForm();
      fetchTests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create test',
        variant: 'destructive',
      });
    }
  };

  const resetTestForm = () => {
    setTestTitle('');
    setTestDescription('');
    setTestTotalPoints(100);
    setTestDuration(60);
    setTestDueDate('');
    setTestQuestions([]);
  };

  const handleUploadMaterial = async () => {
    try {
      await teacherAPI.createLearningMaterial(Number(id), {
        title: materialTitle,
        description: materialDescription,
        gradeId: subjectDetail?.subject.gradeId,
        fileUrl: materialFileUrl,
        fileType: materialFileType
      });
      
      toast({
        title: 'Success',
        description: 'Learning material uploaded successfully',
      });
      
      setMaterialDialogOpen(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialFileUrl('');
      setMaterialFileType('');
      fetchMaterials();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to upload material',
        variant: 'destructive',
      });
    }
  };

  const handleUploadResource = async () => {
    try {
      await teacherAPI.createResource(Number(id), {
        title: resourceTitle,
        description: resourceDescription,
        gradeId: subjectDetail?.subject.gradeId,
        resourceType: resourceType,
        fileUrl: resourceFileUrl,
        externalLink: resourceExternalLink
      });
      
      toast({
        title: 'Success',
        description: 'Resource uploaded successfully',
      });
      
      setResourceDialogOpen(false);
      setResourceTitle('');
      setResourceDescription('');
      setResourceType('file');
      setResourceFileUrl('');
      setResourceExternalLink('');
      fetchResources();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to upload resource',
        variant: 'destructive',
      });
    }
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
          <Button variant="outline" size="icon" onClick={() => navigate('/teacher/subjects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">{subjectDetail.subject.name}</h2>
            <p className="text-muted-foreground">
              {subjectDetail.subject.code} • {subjectDetail.subject.grade}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjectDetail.counts.students}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjectDetail.counts.quizzes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjectDetail.counts.tests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjectDetail.counts.materials + subjectDetail.counts.resources}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials" onClick={() => materials.length === 0 && fetchMaterials()}>Learning Materials</TabsTrigger>
            <TabsTrigger value="quizzes" onClick={() => quizzes.length === 0 && fetchQuizzes()}>Quizzes</TabsTrigger>
            <TabsTrigger value="tests" onClick={() => tests.length === 0 && fetchTests()}>Tests</TabsTrigger>
            <TabsTrigger value="resources" onClick={() => resources.length === 0 && fetchResources()}>Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Code:</strong> {subjectDetail.subject.code}</p>
                <p><strong>Grade:</strong> {subjectDetail.subject.grade}</p>
                <p><strong>Description:</strong> {subjectDetail.subject.description}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Learning Materials</h3>
              <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Learning Material</DialogTitle>
                    <DialogDescription>Add a new learning material for this subject</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="material-title">Title</Label>
                      <Input
                        id="material-title"
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-description">Description</Label>
                      <Textarea
                        id="material-description"
                        value={materialDescription}
                        onChange={(e) => setMaterialDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-url">File URL</Label>
                      <Input
                        id="material-url"
                        value={materialFileUrl}
                        onChange={(e) => setMaterialFileUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-type">File Type</Label>
                      <Input
                        id="material-type"
                        value={materialFileType}
                        onChange={(e) => setMaterialFileType(e.target.value)}
                        placeholder="pdf, docx, pptx, etc."
                      />
                    </div>
                    <Button onClick={handleUploadMaterial}>Upload</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {materials.length === 0 ? (
              <p className="text-muted-foreground">No learning materials yet</p>
            ) : (
              <div className="grid gap-4">
                {materials.map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <CardTitle>{material.title}</CardTitle>
                      <CardDescription>{material.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {new Date(material.created_at).toLocaleDateString()}
                      </p>
                      {material.file_url && (
                        <Button variant="outline" className="mt-2" asChild>
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            View File
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Quizzes</h3>
              <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quiz
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Quiz</DialogTitle>
                    <DialogDescription>Add quiz details and questions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quiz-title">Title</Label>
                      <Input
                        id="quiz-title"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiz-description">Description</Label>
                      <Textarea
                        id="quiz-description"
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quiz-time">Time Limit (minutes)</Label>
                        <Input
                          id="quiz-time"
                          type="number"
                          value={quizTimeLimit}
                          onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiz-due">Due Date</Label>
                        <Input
                          id="quiz-due"
                          type="datetime-local"
                          value={quizDueDate}
                          onChange={(e) => setQuizDueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Questions</h4>
                        <Button type="button" onClick={addQuizQuestion} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Question
                        </Button>
                      </div>

                      {quizQuestions.map((question, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6 space-y-3">
                            <div className="flex justify-between">
                              <h5 className="font-medium">Question {index + 1}</h5>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeQuizQuestion(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            
                            <div>
                              <Label>Question Type</Label>
                              <Select
                                value={question.questionType}
                                onValueChange={(value) => updateQuizQuestion(index, 'questionType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True/False</SelectItem>
                                  <SelectItem value="short_answer">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Question Text</Label>
                              <Textarea
                                value={question.questionText}
                                onChange={(e) => updateQuizQuestion(index, 'questionText', e.target.value)}
                              />
                            </div>

                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={question.points}
                                onChange={(e) => updateQuizQuestion(index, 'points', Number(e.target.value))}
                              />
                            </div>

                            {question.questionType === 'mcq' && (
                              <div className="space-y-2">
                                <Label>Options (one per line)</Label>
                                {question.options?.map((option, optIndex) => (
                                  <Input
                                    key={optIndex}
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optIndex] = e.target.value;
                                      updateQuizQuestion(index, 'options', newOptions);
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            <div>
                              <Label>Correct Answer</Label>
                              <Input
                                value={question.correctAnswer}
                                onChange={(e) => updateQuizQuestion(index, 'correctAnswer', e.target.value)}
                                placeholder={question.questionType === 'true_false' ? 'True or False' : 'Enter correct answer'}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button onClick={handleCreateQuiz} className="w-full">
                      Create Quiz
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {quizzes.length === 0 ? (
              <p className="text-muted-foreground">No quizzes yet</p>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <CardTitle>{quiz.title}</CardTitle>
                      <CardDescription>{quiz.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Questions:</strong> {quiz.question_count}</p>
                        <p><strong>Time Limit:</strong> {quiz.time_limit_minutes} minutes</p>
                        <p><strong>Total Points:</strong> {quiz.total_points}</p>
                        <p><strong>Submissions:</strong> {quiz.submission_count}</p>
                        {quiz.due_date && (
                          <p><strong>Due:</strong> {new Date(quiz.due_date).toLocaleString()}</p>
                        )}
                      </div>
                      <Button className="mt-4" variant="outline">
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tests</h3>
              <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Test</DialogTitle>
                    <DialogDescription>Add test details and questions (MCQ, True/False, Short Answer, Essay)</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-title">Title</Label>
                      <Input
                        id="test-title"
                        value={testTitle}
                        onChange={(e) => setTestTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="test-description">Description</Label>
                      <Textarea
                        id="test-description"
                        value={testDescription}
                        onChange={(e) => setTestDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="test-duration">Duration (minutes)</Label>
                        <Input
                          id="test-duration"
                          type="number"
                          value={testDuration}
                          onChange={(e) => setTestDuration(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="test-due">Due Date</Label>
                        <Input
                          id="test-due"
                          type="datetime-local"
                          value={testDueDate}
                          onChange={(e) => setTestDueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Questions</h4>
                        <Button type="button" onClick={addTestQuestion} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Question
                        </Button>
                      </div>

                      {testQuestions.map((question, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6 space-y-3">
                            <div className="flex justify-between">
                              <h5 className="font-medium">Question {index + 1}</h5>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeTestQuestion(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            
                            <div>
                              <Label>Question Type</Label>
                              <Select
                                value={question.questionType}
                                onValueChange={(value) => updateTestQuestion(index, 'questionType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True/False</SelectItem>
                                  <SelectItem value="short_answer">Short Answer</SelectItem>
                                  <SelectItem value="long_answer">Essay</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Question Text</Label>
                              <Textarea
                                value={question.questionText}
                                onChange={(e) => updateTestQuestion(index, 'questionText', e.target.value)}
                              />
                            </div>

                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={question.points}
                                onChange={(e) => updateTestQuestion(index, 'points', Number(e.target.value))}
                              />
                            </div>

                            {question.questionType === 'mcq' && (
                              <div className="space-y-2">
                                <Label>Options</Label>
                                {question.options?.map((option, optIndex) => (
                                  <Input
                                    key={optIndex}
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optIndex] = e.target.value;
                                      updateTestQuestion(index, 'options', newOptions);
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {(question.questionType === 'mcq' || question.questionType === 'true_false' || question.questionType === 'short_answer') && (
                              <div>
                                <Label>Correct Answer {question.questionType === 'short_answer' && '(for reference)'}</Label>
                                <Input
                                  value={question.correctAnswer}
                                  onChange={(e) => updateTestQuestion(index, 'correctAnswer', e.target.value)}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button onClick={handleCreateTest} className="w-full">
                      Create Test
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {tests.length === 0 ? (
              <p className="text-muted-foreground">No tests yet</p>
            ) : (
              <div className="grid gap-4">
                {tests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle>{test.title}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Questions:</strong> {test.question_count}</p>
                        <p><strong>Duration:</strong> {test.duration_minutes} minutes</p>
                        <p><strong>Total Points:</strong> {test.total_points}</p>
                        <p><strong>Submissions:</strong> {test.submission_count}</p>
                        {test.due_date && (
                          <p><strong>Due:</strong> {new Date(test.due_date).toLocaleString()}</p>
                        )}
                      </div>
                      <Button className="mt-4" variant="outline">
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Additional Resources</h3>
              <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resource
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Resource</DialogTitle>
                    <DialogDescription>Add an additional resource for students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resource-title">Title</Label>
                      <Input
                        id="resource-title"
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="resource-description">Description</Label>
                      <Textarea
                        id="resource-description"
                        value={resourceDescription}
                        onChange={(e) => setResourceDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="resource-type">Type</Label>
                      <Select value={resourceType} onValueChange={setResourceType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="link">External Link</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {resourceType === 'link' ? (
                      <div>
                        <Label htmlFor="resource-link">External Link</Label>
                        <Input
                          id="resource-link"
                          value={resourceExternalLink}
                          onChange={(e) => setResourceExternalLink(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="resource-file-url">File URL</Label>
                        <Input
                          id="resource-file-url"
                          value={resourceFileUrl}
                          onChange={(e) => setResourceFileUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                    <Button onClick={handleUploadResource}>Upload</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {resources.length === 0 ? (
              <p className="text-muted-foreground">No resources yet</p>
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
                        Type: {resource.resource_type}
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
      </div>
    </div>
  );
}
