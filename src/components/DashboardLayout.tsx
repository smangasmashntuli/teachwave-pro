import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Home, Users, FileText, Video, Settings, BarChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useSessionManagement } from "@/hooks/useSessionManagement";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  
  // Initialize session management
  useSessionManagement();

  if (!profile) return null;

  const { role, full_name: userName } = profile;

  const handleLogout = async () => {
    try {
      toast({
        title: "Logging out...",
        description: "Please wait while we sign you out.",
      });
      
      // The signOut function will handle navigation
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again or refresh the page.",
      });
      
      // Force refresh if logout fails
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { icon: Home, label: "Dashboard", path: `/${role}` },
    ];

    if (role === "student") {
      return [
        ...baseItems,
        { icon: BookOpen, label: "My Subjects", path: `/${role}/subjects` },
        { icon: FileText, label: "Assignments", path: `/${role}/assignments` },
        { icon: Video, label: "Classes", path: `/${role}/classes` },
        { icon: BarChart, label: "Grades", path: `/${role}/grades` },
      ];
    }

    if (role === "teacher") {
      return [
        ...baseItems,
        { icon: BookOpen, label: "My Subjects", path: `/${role}/subjects` },
        { icon: Users, label: "Students", path: `/${role}/students` },
        { icon: FileText, label: "Assignments", path: `/${role}/assignments` },
        { icon: Video, label: "Classes", path: `/${role}/classes` },
        { icon: BarChart, label: "Analytics", path: `/${role}/analytics` },
      ];
    }

    // Admin
    return [
      ...baseItems,
      { icon: Users, label: "Users", path: `/${role}/users` },
      { icon: BookOpen, label: "Subjects", path: `/${role}/subjects` },
      { icon: Settings, label: "Settings", path: `/${role}/settings` },
      { icon: BarChart, label: "Reports", path: `/${role}/reports` },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              EduLearn
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {userName} <span className="text-primary capitalize">({role})</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 space-y-2 hidden lg:block">
            <Card className="shadow-soft">
              <CardContent className="p-4 space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link key={index} to={item.path}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

// Import Card here to avoid import issues
import { Card, CardContent } from "@/components/ui/card";

export default DashboardLayout;
