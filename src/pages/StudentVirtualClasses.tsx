import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Users, Clock, Eye, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '@/lib/api';

interface VirtualClass {
  id: number;
  class_name: string;
  subject_name: string;
  grade_name: string;
  teacher_name: string;
  scheduled_start: string;
  scheduled_end: string;
  room_id: string;
  status: string;
  my_attendance?: string;
  recordings_count: number;
  description?: string;
}

interface Recording {
  id: number;
  class_name: string;
  recording_name: string;
  subject_name: string;
  grade_name: string;
  teacher_name: string;
  file_path: string;
  duration: number;
  views_count: number;
  recording_started_at: string;
  created_at: string;
}

const StudentVirtualClasses: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, recordingsRes] = await Promise.all([
        api.get('/virtual-classroom/student/classes'),
        api.get('/virtual-classroom/student/recordings')
      ]);

      setClasses(classesRes.data.classes || []);
      setRecordings(recordingsRes.data.recordings || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load virtual classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (virtualClass: VirtualClass) => {
    navigate(`/student/virtual-classroom/${virtualClass.room_id}`);
  };

  const handlePlayRecording = async (recording: Recording) => {
    try {
      // Increment view count
      await api.post(`/virtual-classroom/recording/${recording.id}/view`);
      setSelectedRecording(recording);
    } catch (error) {
      console.error('Failed to play recording:', error);
      toast.error('Failed to play recording');
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
        return 'bg-green-500 animate-pulse';
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
      <div>
        <h1 className="text-3xl font-bold">Virtual Classes</h1>
        <p className="text-muted-foreground">Join live classes and watch recordings</p>
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
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for scheduled virtual classes
                </p>
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
                      <Users className="h-4 w-4 mr-2" />
                      Teacher: {virtualClass.teacher_name}
                    </div>
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

                    {virtualClass.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {virtualClass.description}
                      </p>
                    )}

                    {virtualClass.my_attendance && (
                      <Badge variant="secondary" className="text-xs">
                        You {virtualClass.my_attendance === 'present' ? 'attended' : virtualClass.my_attendance}
                      </Badge>
                    )}

                    <div className="pt-2">
                      <Button
                        onClick={() => handleJoinClass(virtualClass)}
                        className="w-full"
                        disabled={virtualClass.status === 'cancelled'}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {virtualClass.status === 'live' ? 'Join Now' : 'Join at Start Time'}
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
                      <Users className="h-4 w-4 mr-2" />
                      Teacher: {virtualClass.teacher_name}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(virtualClass.scheduled_start), 'PPP')}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Video className="h-4 w-4 mr-2" />
                      {virtualClass.recordings_count} recording(s)
                    </div>

                    {virtualClass.my_attendance && (
                      <Badge
                        variant={virtualClass.my_attendance === 'present' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {virtualClass.my_attendance === 'present' ? 'Attended' : 'Absent'}
                      </Badge>
                    )}
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
                <p className="text-sm text-muted-foreground mt-2">
                  Recordings from your classes will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recordings.map((recording) => (
                <Card key={recording.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{recording.recording_name}</CardTitle>
                    <CardDescription>
                      {recording.subject_name} - {recording.grade_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Teacher: {recording.teacher_name}
                    </div>
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

                    <div className="pt-2">
                      <Button
                        onClick={() => handlePlayRecording(recording)}
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Watch Recording
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
              {selectedRecording?.subject_name} - {selectedRecording?.grade_name} •{' '}
              {selectedRecording?.teacher_name}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <p className="text-white">
              Recording playback will be implemented with a video player
            </p>
            {/* TODO: Implement video player */}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {selectedRecording?.duration && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Duration: {formatDuration(selectedRecording.duration)}
              </div>
            )}
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              {selectedRecording?.views_count} views
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentVirtualClasses;
