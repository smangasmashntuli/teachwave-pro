import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, X, CalendarIcon, Clock, Users, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Subject {
  id: string;
  name: string;
  grades: {
    id: string;
    name: string;
  };
}

interface CreateAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId?: string; // Optional pre-selected subject
  onAssignmentCreated?: () => void; // Callback to refresh parent data
}

const CreateAssignment = ({ isOpen, onClose, subjectId, onAssignmentCreated }: CreateAssignmentProps) => {
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [subject, setSubject] = useState(subjectId || "");
  const [totalMarks, setTotalMarks] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [dueTime, setDueTime] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [latePenalty, setLatePenalty] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [creating, setCreating] = useState(false);

  // Dynamic data from database
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Load teacher's assigned subjects when component opens
  useEffect(() => {
    if (isOpen && user) {
      loadTeacherSubjects();
    }
  }, [isOpen, user]);

  const loadTeacherSubjects = async () => {
    setLoading(true);
    try {
      // Get subjects assigned to this teacher
      const { data: teacherAssignments, error } = await supabase
        .from('teacher_assignments')
        .select(`
          subjects (
            id,
            name,
            grades (
              id,
              name
            )
          )
        `)
        .eq('teacher_id', user?.id);

      if (error) throw error;

      const subjectsData = teacherAssignments?.map((ta: any) => ({
        id: ta.subjects.id,
        name: ta.subjects.name,
        grades: ta.subjects.grades
      })) || [];

      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading teacher subjects:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your assigned subjects. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...uploadedFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Combine due date and time
      let dueDatetime = null;
      if (dueDate && dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number);
        dueDatetime = new Date(dueDate);
        dueDatetime.setHours(hours, minutes);
      } else if (dueDate) {
        dueDatetime = new Date(dueDate);
        dueDatetime.setHours(23, 59); // Default to end of day
      }

      // Upload attachments to storage if any
      const uploadedAttachments = [];
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `assignments/${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('learning-materials')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue with assignment creation even if file upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('learning-materials')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type
          });
        }
      }

      // Create assignment in database
      const assignmentData = {
        title,
        description: description || null,
        submission_instructions: instructions,
        subject_id: subject,
        teacher_id: user.id,
        total_marks: parseInt(totalMarks),
        due_date: dueDatetime?.toISOString() || null,
        is_published: isPublished
      };

      const { error: dbError } = await (supabase as any)
        .from('assignments')
        .insert([assignmentData]);

      if (dbError) throw dbError;

      // Get subject name for toast message
      const selectedSubject = subjects.find(s => s.id === subject);
      
      toast({
        title: "Assignment Created Successfully",
        description: `${title} has been ${isPublished ? 'published' : 'saved as draft'} for ${selectedSubject?.name || 'the selected subject'}`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setInstructions("");
      setSubject(subjectId || ""); // Keep pre-selected subject if provided
      setTotalMarks("");
      setDueDate(undefined);
      setDueTime("");
      setAllowLateSubmission(false);
      setLatePenalty("");
      setAttachments([]);
      setIsPublished(false);
      
      // Notify parent component to refresh data
      if (onAssignmentCreated) {
        onAssignmentCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Assignment creation error:', error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "There was an error creating the assignment. Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Assignment
              </CardTitle>
              <CardDescription>
                Create and manage assignments for your students
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Quadratic Equations Problem Set"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required disabled={loading || !!subjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading subjects..." : "Select subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subj) => (
                        <SelectItem key={subj.id} value={subj.id}>
                          {subj.name} {subj.grades?.name && `(${subj.grades.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subjects.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground">
                      No subjects assigned. Contact admin to assign subjects to your profile.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the assignment..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Detailed instructions for students..."
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Due Date & Settings</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowLate">Allow Late Submission</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can submit after due date
                    </p>
                  </div>
                  <Switch
                    id="allowLate"
                    checked={allowLateSubmission}
                    onCheckedChange={setAllowLateSubmission}
                  />
                </div>

                {allowLateSubmission && (
                  <div className="space-y-2">
                    <Label htmlFor="latePenalty">Late Penalty (% per day)</Label>
                    <Input
                      id="latePenalty"
                      type="number"
                      value={latePenalty}
                      onChange={(e) => setLatePenalty(e.target.value)}
                      placeholder="10"
                      min="0"
                      max="100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Attachments</h3>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="mt-2">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-foreground">
                        Click to upload assignment files
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        PDF, DOC, PPT, Images up to 10MB each
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Attached Files ({attachments.length})</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium truncate">{file.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Publish Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="publish">Publish Immediately</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this assignment visible to students now
                  </p>
                </div>
                <Switch
                  id="publish"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : isPublished ? "Create & Publish" : "Save as Draft"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAssignment;