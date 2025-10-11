import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Video, Image, X, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StorageHealthCheck } from "@/components/StorageHealthCheck";

interface UploadContentProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Subject {
  id: string;
  name: string;
  grades: {
    id: string;
    name: string;
  };
}



const UploadContent = ({ isOpen, onClose }: UploadContentProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [contentType, setContentType] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Dynamic data from database
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const contentTypes = ["Lesson Material", "Homework", "Reference Document", "Video Lecture", "Presentation"];

  // Load subjects and grades from database
  useEffect(() => {
    if (isOpen) {
      loadSubjectsAndGrades();
    }
  }, [isOpen]);

  const loadSubjectsAndGrades = async () => {
    setLoading(true);
    try {
      // Load all available subjects (we'll handle assignment automatically)
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id, 
          name, 
          grades (
            id,
            name
          )
        `)
        .order('name');

      if (subjectsError) {
        console.error('Error loading subjects:', JSON.stringify(subjectsError, null, 2));
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load subjects: ${subjectsError.message || 'Unknown error'}`,
        });
        return;
      }

      setSubjects(subjectsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load form data: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <Video className="h-4 w-4 text-red-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')) {
      return <Image className="h-4 w-4 text-green-500" />;
    }
    return <File className="h-4 w-4 text-blue-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload content.",
      });
      return;
    }

    console.log('Current user:', { id: user.id, email: user.email });

    // Check user profile and role
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    console.log('User profile:', profile);

    if (!profile || profile.role !== 'teacher') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You must be a teacher to upload content.",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one file to upload.",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles = [];

      // Upload each file to Supabase Storage
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `content/${user.id}/${fileName}`;

        let uploadResult = await supabase.storage
          .from('learning-materials')
          .upload(filePath, file);

        // Handle upload errors with helpful messages
        if (uploadResult.error) {
          console.error('Upload error:', uploadResult.error);
          
          if (uploadResult.error.message?.includes('Bucket not found')) {
            // Try to create bucket if it doesn't exist
            console.log('Storage bucket not found, attempting to create...');
            
            const { error: bucketError } = await supabase.storage.createBucket('learning-materials', {
              public: true,
              fileSizeLimit: 10485760, // 10MB
              allowedMimeTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'video/mp4',
                'video/avi',
                'video/mov',
                'image/jpeg',
                'image/png',
                'image/gif'
              ]
            });
            
            if (bucketError && !bucketError.message?.includes('already exists')) {
              console.warn('Could not create storage bucket:', bucketError);
              throw new Error('File storage is not set up. Please create the "learning-materials" storage bucket in your Supabase dashboard. See STORAGE_SETUP_INSTRUCTIONS.md for detailed steps.');
            }

            // Retry upload after bucket creation attempt
            uploadResult = await supabase.storage
              .from('learning-materials')
              .upload(filePath, file);
              
            if (uploadResult.error) {
              console.error('Upload still failed after bucket creation:', uploadResult.error);
              throw new Error(`Upload failed: ${uploadResult.error.message}. Please try again or contact support.`);
            } else {
              console.log('Upload succeeded after bucket creation');
            }
          } else if (uploadResult.error.message?.includes('File size')) {
            throw new Error(`File "${file.name}" is too large. Please ensure files are under 10MB.`);
          } else if (uploadResult.error.message?.includes('mime type') || uploadResult.error.message?.includes('file type')) {
            throw new Error(`File type "${file.type}" is not supported. Please use PDF, Word, PowerPoint, images, or MP4 videos.`);
          } else {
            throw new Error(`Failed to upload ${file.name}: ${uploadResult.error.message}`);
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('learning-materials')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        });
      }

      // Save content records to database (one for each file)
      const selectedSubject = subjects.find(s => s.id === subject);
      
      // Map content type to enum values (pdf, video, document, link, image)
      const getContentTypeEnum = (type: string, fileName: string) => {
        // First check file extension
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pdf';
        if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(ext || '')) return 'video';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext || '')) return 'image';
        
        // Then check content type selection
        const typeMap: Record<string, string> = {
          'Video Lecture': 'video',
          'Presentation': 'document', 
          'Lesson Material': 'document',
          'Homework': 'document',
          'Reference Document': 'document'
        };
        return typeMap[type] || 'document';
      };

      // Ensure teacher is assigned to the subject (create assignment if it doesn't exist)
      const { error: assignmentError } = await (supabase as any)
        .from('teacher_assignments')
        .upsert({
          teacher_id: user.id,
          subject_id: subject,
          is_active: true
        }, {
          onConflict: 'teacher_id,subject_id'
        });

      if (assignmentError) {
        console.error('Assignment error:', assignmentError);
        // Continue anyway - the assignment might already exist
      }

      const contentRecords = uploadedFiles.map(file => ({
        title: `${title} - ${file.name}`,
        description,
        subject_id: subject,
        content_type: getContentTypeEnum(contentType, file.name),
        file_url: file.url,
        file_size: file.size,
        teacher_id: user.id,
        is_published: true
      }));

      const { error: dbError } = await (supabase as any)
        .from('learning_content')
        .insert(contentRecords);

      if (dbError) {
        console.error('Database error:', JSON.stringify(dbError, null, 2));
        console.error('Content records being inserted:', JSON.stringify(contentRecords, null, 2));
        throw new Error(`Failed to save content record: ${dbError.message || 'Unknown error'}`);
      }

      toast({
        title: "Content Uploaded Successfully",
        description: `${files.length} file(s) uploaded for ${selectedSubject?.name || 'selected subject'}. You are now assigned to teach this subject.`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      setContentType("");
      setFiles([]);
      onClose();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "There was an error uploading your content. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Content
              </CardTitle>
              <CardDescription>
                Share learning materials with your students
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <StorageHealthCheck />
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Content Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Algebra Basics - Chapter 3"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select value={contentType} onValueChange={setContentType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject} required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading subjects..." : "Select subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.id}>
                      {subj.name} {subj.grades ? `(${subj.grades.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the content and learning objectives..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Files</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-foreground">
                        Click to upload files
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        PDF, DOC, PPT, MP4, Images up to 10MB each
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({files.length})</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.name)}
                          <span className="text-sm font-medium truncate">{file.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={uploading || files.length === 0 || !title || !subject || !contentType || loading}
              >
                {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadContent;