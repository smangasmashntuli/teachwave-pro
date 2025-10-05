import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("student" | "teacher" | "admin")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  
  console.log("ProtectedRoute: Checking access", {
    hasUser: !!user,
    hasProfile: !!profile,
    loading,
    userRole: profile?.role,
    allowedRoles,
    currentPath: window.location.pathname
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on user role
    console.log("ProtectedRoute: Role mismatch detected", {
      userRole: profile.role,
      allowedRoles,
      roleType: typeof profile.role,
      includes: allowedRoles.includes(profile.role)
    });
    const redirectTo = `/${profile.role}`;
    console.log("ProtectedRoute: Redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;