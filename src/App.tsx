import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSubjects from "./pages/StudentSubjects";
import StudentAssignments from "./pages/StudentAssignments";
import StudentClasses from "./pages/StudentClasses";
import StudentGrades from "./pages/StudentGrades";
import SubjectDetail from "./pages/SubjectDetail";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSubjects from "./pages/TeacherSubjects";
import TeacherSubjectDetail from "./pages/TeacherSubjectDetail";
import VirtualClassroom from "./pages/VirtualClassroom";
import AdminDashboard from "./pages/AdminDashboard";
import StudentGroupSelectionDemo from "./pages/StudentGroupSelectionDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Student sub-routes */}
            <Route
              path="/student/subjects"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects/:id"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <SubjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/classes"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/grades"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentGrades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/classroom/:id"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <VirtualClassroom />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/subjects" 
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherSubjects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/subjects/:id" 
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherSubjectDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/subjects/:id/classroom" 
              element={
                <ProtectedRoute allowedRoles={["teacher", "student"]}>
                  <VirtualClassroom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/*" 
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Demo route for testing student group selection */}
            <Route path="/demo/student-selection" element={<StudentGroupSelectionDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
