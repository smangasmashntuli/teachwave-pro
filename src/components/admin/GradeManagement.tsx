import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Grade {
  id: string;
  name: string;
  description: string | null;
  academic_year: string;
  created_at: string;
}

const GradeManagement = () => {
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    academic_year: "2024-2025"
  });
  const queryClient = useQueryClient();

  const { data: grades, isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Grade[];
    }
  });

  const createGradeMutation = useMutation({
    mutationFn: async (gradeData: typeof formData) => {
      const { data, error } = await supabase
        .from("grades")
        .insert([gradeData] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Grade created successfully",
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

  const updateGradeMutation = useMutation({
    mutationFn: async ({ id, ...gradeData }: { id: string } & typeof formData) => {
      const { data, error } = await (supabase as any)
        .from("grades")
        .update(gradeData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      setOpen(false);
      resetForm();
      setEditingGrade(null);
      toast({
        title: "Success",
        description: "Grade updated successfully",
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

  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grades")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({
        title: "Success",
        description: "Grade deleted successfully",
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
      academic_year: "2024-2025"
    });
  };

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({
      name: grade.name,
      description: grade.description || "",
      academic_year: grade.academic_year
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGrade) {
      updateGradeMutation.mutate({ id: editingGrade.id, ...formData });
    } else {
      createGradeMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this grade? This will also delete all associated subjects.")) {
      deleteGradeMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Grade Management</CardTitle>
            <CardDescription>Manage academic grades and classes</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? "Edit Grade" : "Add New Grade"}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade ? "Update the grade information below." : "Create a new grade for students."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Grade Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Grade 10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the grade"
                  />
                </div>
                <div>
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGradeMutation.isPending || updateGradeMutation.isPending}
                  >
                    {editingGrade ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading grades...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades?.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-medium">{grade.name}</TableCell>
                  <TableCell>{grade.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{grade.academic_year}</Badge>
                  </TableCell>
                  <TableCell>{new Date(grade.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(grade)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(grade.id)}
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

export default GradeManagement;