import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (email: string, password: string, fullName: string, role: string = 'student') =>
    api.post('/auth/signup', { email, password, fullName, role }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
};

export const studentAPI = {
  getDashboard: () =>
    api.get('/student/dashboard'),
  
  getSubjects: () =>
    api.get('/student/subjects'),
  
  getAssignments: () =>
    api.get('/student/assignments'),
  
  getAssignment: (id: number) =>
    api.get(`/student/assignments/${id}`),
  
  submitAssignment: (id: number, data: { submission_text: string; file_url?: string }) =>
    api.post(`/student/assignments/${id}/submit`, data),
  
  getGrades: () =>
    api.get('/student/grades'),
  
  // Subject Detail
  getSubjectDetail: (subjectId: number) =>
    api.get(`/student/subjects/${subjectId}/detail`),
  
  getLearningMaterials: (subjectId: number) =>
    api.get(`/student/subjects/${subjectId}/learning-materials`),
  
  // Quizzes
  getQuizzes: (subjectId: number) =>
    api.get(`/student/subjects/${subjectId}/quizzes`),
  
  getQuiz: (quizId: number) =>
    api.get(`/student/quizzes/${quizId}`),
  
  submitQuiz: (quizId: number, data: { answers: Array<{questionId: number, answerText: string}> }) =>
    api.post(`/student/quizzes/${quizId}/submit`, data),
  
  getQuizResults: (quizId: number) =>
    api.get(`/student/quizzes/${quizId}/results`),
  
  // Tests
  getTests: (subjectId: number) =>
    api.get(`/student/subjects/${subjectId}/tests`),
  
  getTest: (testId: number) =>
    api.get(`/student/tests/${testId}`),
  
  submitTest: (testId: number, data: { answers: Array<{questionId: number, answerText: string}> }) =>
    api.post(`/student/tests/${testId}/submit`, data),
  
  getTestResults: (testId: number) =>
    api.get(`/student/tests/${testId}/results`),
  
  // Resources
  getResources: (subjectId: number) =>
    api.get(`/student/subjects/${subjectId}/resources`),
};

export const teacherAPI = {
  getDashboard: () =>
    api.get('/teacher/dashboard'),
  
  getSubjects: () =>
    api.get('/teacher/subjects'),
  
  getStudents: (subjectId?: number, gradeId?: number) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId.toString());
    if (gradeId) params.append('gradeId', gradeId.toString());
    return api.get(`/teacher/students?${params.toString()}`);
  },
  
  getAssignments: () =>
    api.get('/teacher/assignments'),
  
  createAssignment: (data: any) =>
    api.post('/teacher/assignments', data),
  
  getAssignmentSubmissions: (assignmentId: number) =>
    api.get(`/teacher/assignments/${assignmentId}/submissions`),
  
  gradeSubmission: (submissionId: number, data: { grade: number; feedback: string }) =>
    api.put(`/teacher/submissions/${submissionId}/grade`, data),
  
  // Subject Detail
  getSubjectDetail: (subjectId: number) =>
    api.get(`/teacher/subjects/${subjectId}/detail`),
  
  // Learning Materials
  getLearningMaterials: (subjectId: number) =>
    api.get(`/teacher/subjects/${subjectId}/learning-materials`),
  
  createLearningMaterial: (subjectId: number, data: any) =>
    api.post(`/teacher/subjects/${subjectId}/learning-materials`, data),
  
  // Quizzes
  getQuizzes: (subjectId: number) =>
    api.get(`/teacher/subjects/${subjectId}/quizzes`),
  
  createQuiz: (subjectId: number, data: any) =>
    api.post(`/teacher/subjects/${subjectId}/quizzes`, data),
  
  getQuizResults: (quizId: number) =>
    api.get(`/teacher/quizzes/${quizId}/results`),
  
  // Tests
  getTests: (subjectId: number) =>
    api.get(`/teacher/subjects/${subjectId}/tests`),
  
  createTest: (subjectId: number, data: any) =>
    api.post(`/teacher/subjects/${subjectId}/tests`, data),
  
  getTestResults: (testId: number) =>
    api.get(`/teacher/tests/${testId}/results`),
  
  // Resources
  getResources: (subjectId: number) =>
    api.get(`/teacher/subjects/${subjectId}/resources`),
  
  createResource: (subjectId: number, data: any) =>
    api.post(`/teacher/subjects/${subjectId}/resources`, data),
};

export const adminAPI = {
  // User Management
  getUsers: () =>
    api.get('/admin/users'),
  
  createUser: (data: any) =>
    api.post('/admin/users', data),
  
  updateUser: (id: number, data: any) =>
    api.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`),
  
  // Teacher Management
  getTeachers: () =>
    api.get('/admin/teachers'),
  
  assignTeacher: (data: { teacher_id: number; subject_id: number; grade_id: number }) =>
    api.post('/admin/teacher-assignments', data),
  
  removeTeacherAssignment: (id: number) =>
    api.delete(`/admin/teacher-assignments/${id}`),
  
  // Subject Management
  getSubjects: () =>
    api.get('/admin/subjects'),
  
  getGrades: () =>
    api.get('/admin/grades'),
  
  getSubjectGroups: () =>
    api.get('/admin/subject-groups'),
  
  // Statistics & Activities
  getStats: () =>
    api.get('/admin/stats'),
  
  getActivities: () =>
    api.get('/admin/activities'),
};

export default api;
