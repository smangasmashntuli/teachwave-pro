import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, Video, FileText, BarChart } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Rich Learning Content",
      description: "Access PDFs, videos, slides, and interactive materials organized by subjects"
    },
    {
      icon: Video,
      title: "Virtual Classrooms",
      description: "Join live classes and access recorded sessions anytime, anywhere"
    },
    {
      icon: FileText,
      title: "Quizzes & Assignments",
      description: "Complete tests and assignments with automatic grading and feedback"
    },
    {
      icon: BarChart,
      title: "Performance Tracking",
      description: "Monitor progress with detailed analytics and grade reports"
    },
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Connect with teachers and classmates through integrated communication"
    },
    {
      icon: Award,
      title: "Achievement System",
      description: "Track attendance, grades, and milestones throughout your learning journey"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TeachWave
            </span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold animate-fade-in">
              Transform Your Learning Experience
            </h1>
            <p className="text-xl md:text-2xl text-white/90 animate-fade-in">
              A comprehensive platform for learners, teachers, and administrators to collaborate, learn, and grow together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Start Learning Today
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 border-white/30 text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete e-learning ecosystem designed for modern education
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-soft hover:shadow-medium transition-all duration-300 hover-scale">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of students and educators already using EduLearn
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 EduLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
