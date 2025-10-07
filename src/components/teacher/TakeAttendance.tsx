import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, X, CalendarIcon, Check, XIcon, Clock, Search, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TakeAttendanceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  studentId: string;
  attendance: "present" | "absent" | "late" | null;
  previousAttendance: number; // percentage
}

const TakeAttendance = ({ isOpen, onClose }: TakeAttendanceProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology"];
  const grades = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  // Mock student data
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "Alice Johnson", grade: "Grade 10", studentId: "ST001", attendance: null, previousAttendance: 95 },
    { id: "2", name: "Bob Smith", grade: "Grade 10", studentId: "ST002", attendance: null, previousAttendance: 87 },
    { id: "3", name: "Carol Davis", grade: "Grade 10", studentId: "ST003", attendance: null, previousAttendance: 92 },
    { id: "4", name: "David Wilson", grade: "Grade 10", studentId: "ST004", attendance: null, previousAttendance: 78 },
    { id: "5", name: "Emma Brown", grade: "Grade 10", studentId: "ST005", attendance: null, previousAttendance: 89 },
    { id: "6", name: "Frank Miller", grade: "Grade 10", studentId: "ST006", attendance: null, previousAttendance: 94 },
    { id: "7", name: "Grace Lee", grade: "Grade 10", studentId: "ST007", attendance: null, previousAttendance: 85 },
    { id: "8", name: "Henry Taylor", grade: "Grade 10", studentId: "ST008", attendance: null, previousAttendance: 91 },
  ]);

  const markAttendance = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, attendance: status }
          : student
      )
    );
  };

  const markAllPresent = () => {
    setStudents(prev => 
      prev.map(student => ({ ...student, attendance: "present" as const }))
    );
  };

  const markAllAbsent = () => {
    setStudents(prev => 
      prev.map(student => ({ ...student, attendance: "absent" as const }))
    );
  };

  const clearAll = () => {
    setStudents(prev => 
      prev.map(student => ({ ...student, attendance: null }))
    );
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const attendanceStats = {
    total: students.length,
    present: students.filter(s => s.attendance === "present").length,
    absent: students.filter(s => s.attendance === "absent").length,
    late: students.filter(s => s.attendance === "late").length,
    unmarked: students.filter(s => s.attendance === null).length,
  };

  const handleSave = async () => {
    const unmarkedCount = attendanceStats.unmarked;
    if (unmarkedCount > 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Attendance",
        description: `Please mark attendance for ${unmarkedCount} remaining student(s).`,
      });
      return;
    }

    setSaving(true);
    try {
      // Simulate saving attendance
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Attendance Saved",
        description: `Attendance for ${selectedSubject} - ${selectedGrade} on ${format(selectedDate, 'PPP')} has been saved.`,
      });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save attendance. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceColor = (status: string | null) => {
    switch (status) {
      case "present": return "text-green-600 bg-green-50";
      case "absent": return "text-red-600 bg-red-50";
      case "late": return "text-yellow-600 bg-yellow-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getAttendancePercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Take Attendance
              </CardTitle>
              <CardDescription>
                Mark student attendance for your class
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Class Selection */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSubject && selectedGrade && (
            <>
              {/* Attendance Stats */}
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{attendanceStats.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{attendanceStats.unmarked}</div>
                      <div className="text-sm text-muted-foreground">Unmarked</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={markAllPresent}>
                    <Check className="h-4 w-4 mr-1" />
                    All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={markAllAbsent}>
                    <XIcon className="h-4 w-4 mr-1" />
                    All Absent
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>

              {/* Student List */}
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {filteredStudents.map((student, index) => (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center justify-between p-4 hover:bg-muted/50",
                          index !== filteredStudents.length - 1 && "border-b"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">ID: {student.studentId}</span>
                              <Badge 
                                variant="secondary" 
                                className={getAttendancePercentageColor(student.previousAttendance)}
                              >
                                {student.previousAttendance}% attendance
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant={student.attendance === "present" ? "default" : "outline"}
                            size="sm"
                            onClick={() => markAttendance(student.id, "present")}
                            className={student.attendance === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            variant={student.attendance === "late" ? "default" : "outline"}
                            size="sm"
                            onClick={() => markAttendance(student.id, "late")}
                            className={student.attendance === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Late
                          </Button>
                          <Button
                            variant={student.attendance === "absent" ? "default" : "outline"}
                            size="sm"
                            onClick={() => markAttendance(student.id, "absent")}
                            className={student.attendance === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                          >
                            <XIcon className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving || attendanceStats.unmarked > 0}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeAttendance;