import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, Users, Play, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface VirtualClass {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  meeting_url: string | null;
  recording_url: string | null;
  attendance_code: string | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  subject: {
    id: string;
    name: string;
    code: string;
  };
  attendance?: {
    id: string;
    status: 'present' | 'absent' | 'late';
    joined_at: string;
  };
}

const StudentClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'today' | 'completed' | 'all'>('upcoming');

  useEffect(() => {
    if (user?.id) {
      fetchClasses();
    }
  }, [user?.id]);

  const fetchClasses = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get student's enrolled subjects first
      const { data: subjectEnrollments } = await (supabase as any)
        .from('subject_enrollments')
        .select('subject_id')
        .eq('student_id', user.id)
        .eq('is_active', true);

      const subjectIds = subjectEnrollments?.map((se: any) => se.subject_id) || [];

      if (subjectIds.length === 0) {
        setClasses([]);
        return;
      }

      // Fetch virtual classes for enrolled subjects
      const { data: classesData, error } = await (supabase as any)
        .from('virtual_classes')
        .select(`
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          meeting_url,
          recording_url,
          attendance_code,
          status,
          subjects:subject_id (
            id,
            name,
            code
          ),
          class_attendance!left (
            id,
            status,
            joined_at,
            student_id
          )
        `)
        .in('subject_id', subjectIds)
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      // Process classes and their attendance
      const processedClasses = classesData?.map((classData: any) => ({
        id: classData.id,
        title: classData.title,
        description: classData.description,
        scheduled_start: classData.scheduled_start,
        scheduled_end: classData.scheduled_end,
        actual_start: classData.actual_start,
        actual_end: classData.actual_end,
        meeting_url: classData.meeting_url,
        recording_url: classData.recording_url,
        attendance_code: classData.attendance_code,
        status: classData.status,
        subject: classData.subjects,
        attendance: classData.class_attendance?.find((att: any) => att.student_id === user.id)
      })) || [];

      setClasses(processedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = (subjectId: string) => {
    // Navigate to the student virtual classroom
    navigate(`/student/classroom/${subjectId}`);
  };

  const getStatusBadge = (classData: VirtualClass) => {
    const now = new Date();
    const startTime = new Date(classData.scheduled_start);
    const endTime = new Date(classData.scheduled_end);

    switch (classData.status) {
      case 'ongoing':
        return <Badge className="bg-green-500">Live Now</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        if (now > endTime) {
          return <Badge className="bg-gray-500">Ended</Badge>;
        }
        if (now >= startTime && now <= endTime) {
          return <Badge className="bg-green-500">Live Now</Badge>;
        }
        return <Badge className="bg-blue-500">Scheduled</Badge>;
    }
  };

  const getAttendanceBadge = (attendance: VirtualClass['attendance']) => {
    if (!attendance) return null;
    
    const color = {
      present: 'bg-green-500',
      late: 'bg-yellow-500',
      absent: 'bg-red-500'
    }[attendance.status];

    return <Badge className={color}>{attendance.status}</Badge>;
  };

  const filteredClasses = classes.filter(classData => {
    const now = new Date();
    const startTime = new Date(classData.scheduled_start);
    const endTime = new Date(classData.scheduled_end);
    const isToday = startTime.toDateString() === now.toDateString();

    switch (filter) {
      case 'upcoming':
        return startTime > now;
      case 'today':
        return isToday;
      case 'completed':
        return classData.status === 'completed' || endTime < now;
      default:
        return true;
    }
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} minutes`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground">Virtual classroom schedule and recordings</p>
          </div>
          <Button variant="outline" onClick={fetchClasses} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {(['upcoming', 'today', 'completed', 'all'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="capitalize"
            >
              {filterType}
            </Button>
          ))}
        </div>

        {/* Classes List */}
        <div className="grid gap-4">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredClasses.length > 0 ? (
            filteredClasses.map((classData) => (
              <Card key={classData.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        {classData.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <CardDescription className="m-0">
                          {classData.subject?.name}
                        </CardDescription>
                        <Badge variant="outline" className="text-xs">
                          {classData.subject?.code}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(classData)}
                      {getAttendanceBadge(classData.attendance)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{classData.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>Start: {formatDateTime(classData.scheduled_start)}</div>
                        <div>End: {formatDateTime(classData.scheduled_end)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Duration: {getDuration(classData.scheduled_start, classData.scheduled_end)}</span>
                    </div>
                    {classData.attendance && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Attendance: {formatDateTime(classData.attendance.joined_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {classData.status === 'completed' && classData.recording_url 
                        ? "Recording available" 
                        : classData.status === 'ongoing' 
                        ? "Class is live now" 
                        : "Scheduled class"}
                    </div>
                    
                    <div className="flex gap-2">
                      {classData.status === 'ongoing' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleJoinClass(classData.subject?.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Join Virtual Classroom
                        </Button>
                      )}
                      {classData.recording_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={classData.recording_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Watch Recording
                          </a>
                        </Button>
                      )}
                      {!classData.recording_url && classData.status !== 'ongoing' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleJoinClass(classData.subject?.id)}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Join Classroom
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No classes found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "No classes have been scheduled for your subjects yet."
                  : `No ${filter} classes found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentClasses;