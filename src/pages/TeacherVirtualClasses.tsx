import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Video, Calendar, Users, Clock, Trash2, Eye, Download, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/api';

interface VirtualClass {
  id: number;
  class_name: string;
  subject_name: string;
  grade_name: string;
  scheduled_start: string;
  scheduled_end: string;
  room_id: string;
  meeting_url: string;
  status: string;
  recording_enabled: boolean;
  is_recording: boolean;
  attendance_count: number;
  recordings_count: number;
  description?: string;
}

interface Recording {
  id: number;
  class_name: string;
  recording_name: string;
  subject_name: string;
  grade_name: string;
  file_path: string;
  duration: number;
  views_count: number;
  recording_started_at: string;
  created_at: string;
}

interface Subject {
  id: number;
  name: string;
  grade_id: number;
  grade_name: string;
}

const TeacherVirtualClasses: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    class_name: '',
    subject_id: '',
    grade_id: '',
    scheduled_start: '',
    scheduled_end: '',
    description: '',
    recording_enabled: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, recordingsRes, subjectsRes] = await Promise.all([
        api.get('/virtual-classroom/teacher/classes'),
        api.get('/virtual-classroom/teacher/recordings'),
        api.get('/teacher/subjects')
      ]);

      setClasses(classesRes.data.classes || []);
      setRecordings(recordingsRes.data.recordings || []);
      setSubjects(subjectsRes.data.subjects || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load virtual classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_name || !formData.subject_id || !formData.scheduled_start) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/virtual-classroom/create', formData);
      toast.success('Virtual class created successfully');
      setShowCreateDialog(false);
      setFormData({
        class_name: '',
        subject_id: '',
        grade_id: '',
        scheduled_start: '',
        scheduled_end: '',
        description: '',
        recording_enabled: false
      });
      loadData();
    } catch (error) {
      console.error('Failed to create class:', error);
      toast.error('Failed to create virtual class');
    }
  };

  const handleStartClass = (virtualClass: VirtualClass) => {
    navigate(`/virtual-classroom/${virtualClass.room_id}`);
  };

  const handleDeleteRecording = async (recordingId: number) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      await api.delete(`/virtual-classroom/recording/${recordingId}`);
      toast.success('Recording deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const upcomingClasses = classes.filter((c) => c.status === 'scheduled' || c.status === 'live');
  const pastClasses = classes.filter((c) => c.status === 'completed');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Virtual Classrooms</h1>
          <p className="text-muted-foreground">Manage your virtual classes and recordings</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Virtual Class</DialogTitle>
              <DialogDescription>Schedule a new virtual classroom session</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <Label htmlFor="class_name">Class Name *</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="e.g., Mathematics Lesson 1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject_id">Subject *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => {
                    const subject = subjects.find((s) => s.id.toString() === value);
                    setFormData({
                      ...formData,
                      subject_id: value,
                      grade_id: subject?.grade_id.toString() || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.grade_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduled_start">Start Time *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduled_end">End Time</Label>
                <Input
                  id="scheduled_end"
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will you cover in this class?"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recording_enabled">Enable Recording</Label>
                <Switch
                  id="recording_enabled"
                  checked={formData.recording_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, recording_enabled: checked })
                  }
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Class</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming & Live ({upcomingClasses.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past Classes ({pastClasses.length})</TabsTrigger>
          <TabsTrigger value="recordings">Recordings ({recordings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingClasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming classes</p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingClasses.map((virtualClass) => (
                <Card key={virtualClass.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{virtualClass.class_name}</CardTitle>
                        <CardDescription>
                          {virtualClass.subject_name} - {virtualClass.grade_name}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(virtualClass.status)}>
                        {virtualClass.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(virtualClass.scheduled_start), 'PPP')}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {format(new Date(virtualClass.scheduled_start), 'p')}
                      {virtualClass.scheduled_end &&
                        ` - ${format(new Date(virtualClass.scheduled_end), 'p')}`}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {virtualClass.attendance_count} participants
                    </div>

                    {virtualClass.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {virtualClass.description}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleStartClass(virtualClass)}
                        className="flex-1"
                        variant={virtualClass.status === 'live' ? 'default' : 'outline'}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {virtualClass.status === 'live' ? 'Join' : 'Start'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastClasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No past classes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastClasses.map((virtualClass) => (
                <Card key={virtualClass.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{virtualClass.class_name}</CardTitle>
                    <CardDescription>
                      {virtualClass.subject_name} - {virtualClass.grade_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(virtualClass.scheduled_start), 'PPP')}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {virtualClass.attendance_count} attended
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Video className="h-4 w-4 mr-2" />
                      {virtualClass.recordings_count} recording(s)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          {recordings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recordings available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recordings.map((recording) => (
                <Card key={recording.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{recording.recording_name}</CardTitle>
                    <CardDescription>
                      {recording.subject_name} - {recording.grade_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(recording.recording_started_at), 'PPP')}
                    </div>
                    {recording.duration && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDuration(recording.duration)}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 mr-2" />
                      {recording.views_count} views
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedRecording(recording)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecording(recording.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recording Viewer Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedRecording?.recording_name}</DialogTitle>
            <DialogDescription>
              {selectedRecording?.subject_name} - {selectedRecording?.grade_name}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <p className="text-white">
              Recording playback will be implemented with a video player
            </p>
            {/* TODO: Implement video player */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherVirtualClasses;
