import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, profile, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile && !loading) {
      console.log("Redirecting user:", { 
        email: user.email, 
        role: profile.role, 
        roleType: typeof profile.role,
        fullProfile: profile 
      });
      const dashboardRoute = `/${profile.role}`;
      console.log("Navigating to:", dashboardRoute);
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      // Wait a bit for profile to load, then redirect
      setTimeout(() => {
        if (profile) {
          console.log("Manual redirect after login:", profile.role);
          navigate(`/${profile.role}`, { replace: true });
        }
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center text-base">
            Sign in to your EduLearn account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
