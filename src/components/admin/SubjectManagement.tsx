import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  code: string;
  grade_id: string | null;
  grades?: {
    name: string;
  } | null;
}

const SubjectManagement = () => {
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    grade_id: ""
  });
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .select(`
          *,
          grades (
            name
          )
        `)
        .order("name");
      
      if (error) throw error;
      return data as Subject[];
    }
  });

  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("grades")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: typeof formData) => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .insert([subjectData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, ...subjectData }: { id: string } & typeof formData) => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .update(subjectData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      resetForm();
      setEditingSubject(null);
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("subjects")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      grade_id: ""
    });
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || "",
      code: subject.code,
      grade_id: subject.grade_id || ""
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, ...formData });
    } else {
      createSubjectMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subject? This will also delete all related content.")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>Manage subjects for each grade</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? "Edit Subject" : "Add New Subject"}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject ? "Update the subject information below." : "Create a new subject."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Subject Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., MATH10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grade_id">Grade *</Label>
                  <Select value={formData.grade_id} onValueChange={(value) => setFormData(prev => ({ ...prev, grade_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades?.map((grade: any) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the subject"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                  >
                    {editingSubject ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading subjects...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects?.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{subject.code}</Badge>
                  </TableCell>
                  <TableCell>{subject.grades?.name || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{subject.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(subject)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectManagement;