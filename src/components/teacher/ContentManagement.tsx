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
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Upload, FileText, Video, Link, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface LearningContent {
  id: string;
  title: string;
  description: string | null;
  content_type: "pdf" | "video" | "document" | "link" | "image";
  file_url: string | null;
  file_size: number | null;
  subject_id: string | null;
  is_published: boolean | null;
  created_at: string;
  subjects?: {
    name: string;
  } | null;
}

const ContentManagement = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<LearningContent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "document" as "pdf" | "video" | "document" | "link" | "image",
    file_url: "",
    subject_id: "",
    is_published: false
  });
  const queryClient = useQueryClient();

  // Get teacher's subjects
  const { data: subjects } = useQuery({
    queryKey: ["teacher-subjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("teacher_subjects")
        .select("*")
        .eq("teacher_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get learning content
  const { data: content, isLoading } = useQuery({
    queryKey: ["learning-content", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("learning_content")
        .select(`
          *,
          subjects (
            name
          )
        `)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LearningContent[];
    },
    enabled: !!user?.id,
  });

  const createContentMutation = useMutation({
    mutationFn: async (contentData: typeof formData) => {
      const { data, error } = await (supabase as any)
        .from("learning_content")
        .insert([{ ...contentData, teacher_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-content"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Content created successfully",
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

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, ...contentData }: { id: string } & typeof formData) => {
      const { data, error } = await (supabase as any)
        .from("learning_content")
        .update(contentData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-content"] });
      setOpen(false);
      resetForm();
      setEditingContent(null);
      toast({
        title: "Success",
        description: "Content updated successfully",
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

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await (supabase as any)
        .from("learning_content")
        .update({ is_published })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-content"] });
      toast({
        title: "Success",
        description: "Content visibility updated",
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

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("learning_content")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-content"] });
      toast({
        title: "Success",
        description: "Content deleted successfully",
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
      title: "",
      description: "",
      content_type: "document",
      file_url: "",
      subject_id: "",
      is_published: false
    });
  };

  const handleEdit = (content: LearningContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description || "",
      content_type: content.content_type,
      file_url: content.file_url || "",
      subject_id: content.subject_id || "",
      is_published: content.is_published || false
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContent) {
      updateContentMutation.mutate({ id: editingContent.id, ...formData });
    } else {
      createContentMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this content?")) {
      deleteContentMutation.mutate(id);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Learning Content</CardTitle>
            <CardDescription>Manage educational materials for your subjects</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingContent ? "Edit Content" : "Add New Content"}
                </DialogTitle>
                <DialogDescription>
                  {editingContent ? "Update the content information below." : "Create new learning material."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Chapter 5: Algebra Basics"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject_id">Subject *</Label>
                  <Select value={formData.subject_id} onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject: any) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content_type">Content Type *</Label>
                  <Select value={formData.content_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, content_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file_url">File URL or Link</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the content"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createContentMutation.isPending || updateContentMutation.isPending}
                  >
                    {editingContent ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading content...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getContentIcon(item.content_type)}
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.content_type}</Badge>
                  </TableCell>
                  <TableCell>{item.subjects?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={item.is_published || false}
                        onCheckedChange={(checked) => 
                          togglePublishMutation.mutate({ id: item.id, is_published: checked })
                        }
                      />
                      <span className="text-sm">
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
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

export default ContentManagement;