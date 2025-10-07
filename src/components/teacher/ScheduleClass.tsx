import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Video, X, CalendarIcon, Clock, Users, Link as LinkIcon, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleClassProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleClass = ({ isOpen, onClose }: ScheduleClassProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [classDate, setClassDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [passcode, setPasscode] = useState("");
  const [recordSession, setRecordSession] = useState(true);
  const [sendReminders, setSendReminders] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [maxStudents, setMaxStudents] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [recurrenceEnd, setRecurrenceEnd] = useState<Date>();
  const [scheduling, setScheduling] = useState(false);

  const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology"];
  const grades = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  const durations = ["30 minutes", "45 minutes", "1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours"];
  const recurrenceOptions = ["Daily", "Weekly", "Bi-weekly", "Monthly"];

  const generateMeetingLink = () => {
    const randomId = Math.random().toString(36).substring(2, 15);
    setMeetingLink(`https://meet.teachwave.com/${randomId}`);
  };

  const generatePasscode = () => {
    const code = Math.random().toString().substring(2, 8);
    setPasscode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduling(true);

    try {
      // Simulate class scheduling
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Class Scheduled Successfully",
        description: `${title} scheduled for ${format(classDate!, 'PPP')} at ${startTime}`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      setGrade("");
      setClassDate(undefined);
      setStartTime("");
      setDuration("");
      setMeetingLink("");
      setPasscode("");
      setRecordSession(true);
      setSendReminders(true);
      setAllowChat(true);
      setMaxStudents("");
      setIsRecurring(false);
      setRecurrencePattern("");
      setRecurrenceEnd(undefined);
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scheduling Failed",
        description: "There was an error scheduling the class. Please try again.",
      });
    } finally {
      setScheduling(false);
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
                <Video className="h-5 w-5" />
                Schedule Class
              </CardTitle>
              <CardDescription>
                Create a new virtual class session for your students
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
              <h3 className="text-lg font-semibold">Class Details</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Class Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Algebra - Solving Quadratic Equations"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students (Optional)</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={grade} onValueChange={setGrade} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Class Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will be covered in this class..."
                  rows={3}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !classDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {classDate ? format(classDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={classDate}
                        onSelect={setClassDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((dur) => (
                        <SelectItem key={dur} value={dur}>
                          {dur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recurring Classes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="recurring">Recurring Class</Label>
                    <p className="text-sm text-muted-foreground">
                      Schedule this class to repeat
                    </p>
                  </div>
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {isRecurring && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pattern">Recurrence Pattern</Label>
                      <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          {recurrenceOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !recurrenceEnd && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {recurrenceEnd ? format(recurrenceEnd, "PPP") : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={recurrenceEnd}
                            onSelect={setRecurrenceEnd}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Meeting Settings</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Button type="button" variant="outline" size="sm" onClick={generateMeetingLink}>
                      Generate Link
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="meetingLink"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.teachwave.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passcode">Meeting Passcode</Label>
                    <Button type="button" variant="outline" size="sm" onClick={generatePasscode}>
                      Generate Code
                    </Button>
                  </div>
                  <Input
                    id="passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="123456"
                  />
                </div>
              </div>

              {/* Class Options */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="record">Record Session</Label>
                      <p className="text-sm text-muted-foreground">
                        Save recording for students to review
                      </p>
                    </div>
                    <Switch
                      id="record"
                      checked={recordSession}
                      onCheckedChange={setRecordSession}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders">Send Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Email reminders to students
                      </p>
                    </div>
                    <Switch
                      id="reminders"
                      checked={sendReminders}
                      onCheckedChange={setSendReminders}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="chat">Allow Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can use text chat during class
                    </p>
                  </div>
                  <Switch
                    id="chat"
                    checked={allowChat}
                    onCheckedChange={setAllowChat}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={scheduling}>
                {scheduling ? "Scheduling..." : "Schedule Class"}
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

export default ScheduleClass;