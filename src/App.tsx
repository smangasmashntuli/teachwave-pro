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
import StudentSubjectDetail from "./pages/StudentSubjectDetail";
import StudentAssignments from "./pages/StudentAssignments";
import StudentGrades from "./pages/StudentGrades";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSubjects from "./pages/TeacherSubjects";
import TeacherSubjectDetail from "./pages/TeacherSubjectDetail";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherAssignments from "./pages/TeacherAssignments";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManageTeachers from "./pages/ManageTeachers";
import AdminReports from "./pages/AdminReports";
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
            
            {/* Student Routes */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
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
                  <StudentSubjectDetail />
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
              path="/student/grades" 
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentGrades />
                </ProtectedRoute>
              } 
            />
            
            {/* Teacher Routes */}
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
              path="/teacher/students" 
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherStudents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/assignments" 
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherAssignments />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManageUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/teachers" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManageTeachers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminReports />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
