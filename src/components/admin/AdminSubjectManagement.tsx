import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Grade {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  grade_id: string;
  created_at: string;
  grade: {
    name: string;
  };
}

interface NewSubject {
  name: string;
  code: string;
  description: string;
  grade_id: string;
}

const AdminSubjectManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [newSubject, setNewSubject] = useState<NewSubject>({
    name: '',
    code: '',
    description: '',
    grade_id: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter subjects when search term or grade filter changes
  useEffect(() => {
    filterSubjects();
  }, [subjects, searchTerm, gradeFilter]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      
      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('name');

      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

      // Fetch subjects with grades
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          *,
          grade:grades(name)
        `)
        .order('created_at', { ascending: false });

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch data"
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    // Filter by grade
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(subject => subject.grade_id === gradeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSubjects(filtered);
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.grade_id) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from('subjects')
        .insert({
          name: newSubject.name,
          code: newSubject.code,
          description: newSubject.description || null,
          grade_id: newSubject.grade_id
        })
        .select(`
          *,
          grade:grades(name)
        `)
        .single();

      if (error) throw error;

      setSubjects([data, ...subjects]);

      // Reset form
      setNewSubject({
        name: '',
        code: '',
        description: '',
        grade_id: ''
      });

      setIsCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "Subject created successfully"
      });

    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || "Failed to create subject"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from('subjects')
        .update({
          name: editingSubject.name,
          code: editingSubject.code,
          description: editingSubject.description,
          grade_id: editingSubject.grade_id
        })
        .eq('id', editingSubject.id)
        .select(`
          *,
          grade:grades(name)
        `)
        .single();

      if (error) throw error;

      // Update local state
      setSubjects(subjects.map(subject => 
        subject.id === editingSubject.id ? data : subject
      ));

      setIsEditDialogOpen(false);
      setEditingSubject(null);

      toast({
        title: "Success",
        description: "Subject updated successfully"
      });

    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update subject"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      setSubjects(subjects.filter(subject => subject.id !== subjectId));

      toast({
        title: "Success",
        description: "Subject deleted successfully"
      });

    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Failed to delete subject"
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getSubjectStats = () => {
    const gradeStats = grades.map(grade => ({
      grade: grade.name,
      count: subjects.filter(s => s.grade_id === grade.id).length
    }));
    return { total: subjects.length, gradeStats };
  };

  const stats = getSubjectStats();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {stats.gradeStats.slice(0, 3).map((grade, index) => (
          <Card key={grade.grade}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GraduationCap className={`h-8 w-8 ${
                  index === 0 ? 'text-green-600' : 
                  index === 1 ? 'text-purple-600' : 'text-orange-600'
                }`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{grade.grade}</p>
                  <p className="text-2xl font-bold">{grade.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Subject Management
              </CardTitle>
              <CardDescription>
                Manage all subjects and their details
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subject</DialogTitle>
                  <DialogDescription>
                    Add a new subject to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name*</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Mathematics"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Subject Code*</Label>
                    <Input
                      id="code"
                      placeholder="e.g., MATH101"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade*</Label>
                    <Select value={newSubject.grade_id} onValueChange={(value) => setNewSubject({...newSubject, grade_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map(grade => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter subject description"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubject} disabled={loading}>
                    {loading ? "Creating..." : "Create Subject"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subjects List */}
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No subjects found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map(subject => (
                <Card key={subject.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{subject.name}</h3>
                          <p className="text-sm text-muted-foreground">Code: {subject.code}</p>
                        </div>
                        <Badge variant="secondary">
                          {subject.grade.name}
                        </Badge>
                      </div>
                      
                      {subject.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {subject.description}
                        </p>
                      )}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        Created: {new Date(subject.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Dialog open={isEditDialogOpen && editingSubject?.id === subject.id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingSubject(subject)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Subject</DialogTitle>
                              <DialogDescription>
                                Update subject information
                              </DialogDescription>
                            </DialogHeader>
                            {editingSubject && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit_name">Subject Name</Label>
                                  <Input
                                    id="edit_name"
                                    value={editingSubject.name}
                                    onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_code">Subject Code</Label>
                                  <Input
                                    id="edit_code"
                                    value={editingSubject.code}
                                    onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_grade">Grade</Label>
                                  <Select 
                                    value={editingSubject.grade_id} 
                                    onValueChange={(value) => setEditingSubject({...editingSubject, grade_id: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {grades.map(grade => (
                                        <SelectItem key={grade.id} value={grade.id}>
                                          {grade.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit_description">Description</Label>
                                  <Textarea
                                    id="edit_description"
                                    value={editingSubject.description || ''}
                                    onChange={(e) => setEditingSubject({...editingSubject, description: e.target.value})}
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {setIsEditDialogOpen(false); setEditingSubject(null);}}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateSubject} disabled={loading}>
                                {loading ? "Updating..." : "Update Subject"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {subject.name}? 
                                This action cannot be undone and may affect associated assignments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete Subject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubjectManagement;