import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Users, 
  MessageCircle, 
  Send,
  Settings,
  Monitor,
  Volume2,
  VolumeX,
  Crown,
  Share,
  Shield
} from "lucide-react";
import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp: string;
  sender_role: 'teacher' | 'student';
}

interface ClassParticipant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  session_role: 'presenter' | 'attendee';
  video_enabled: boolean;
  audio_enabled: boolean;
  joined_at: string;
  is_sharing_screen?: boolean;
  connection_status: 'connected' | 'connecting' | 'disconnected';
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface SharedContent {
  type: 'screen' | 'camera' | 'slides' | 'document';
  url?: string;
  title?: string;
  presenter_id: string;
}

const VirtualClassroom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Video/Audio refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  
  // WebRTC state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<{ [key: string]: RTCPeerConnection }>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isInClass, setIsInClass] = useState(false);
  
  // Class state
  const [classData, setClassData] = useState<any>(null);
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  
  // Presenter and content sharing state
  const [currentPresenter, setCurrentPresenter] = useState<ClassParticipant | null>(null);
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [isPresenter, setIsPresenter] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  
  // Real-time subscriptions
  const [classChannel, setClassChannel] = useState<any>(null);
  const [chatChannel, setChatChannel] = useState<any>(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeClass();
    return () => {
      cleanup();
    };
  }, [id, user?.id]);

  const initializeClass = async () => {
    if (!id || !user?.id) return;

    try {
      setIsLoading(true);

      // Get or create virtual class
      let { data: virtualClass, error } = await (supabase as any)
        .from('virtual_classes')
        .select(`
          *,
          subjects!inner(name, code)
        `)
        .eq('subject_id', id)
        .eq('status', 'ongoing')
        .single();

      if (error || !virtualClass) {
        // Check if there are any scheduled classes that could be started
        const { data: scheduledClass } = await (supabase as any)
          .from('virtual_classes')
          .select(`
            *,
            subjects!inner(name, code)
          `)
          .eq('subject_id', id)
          .eq('status', 'scheduled')
          .order('scheduled_start', { ascending: true })
          .limit(1)
          .single();

        // Check if user is a teacher who can create classes
        if (user.role === 'teacher') {
          // If there's a scheduled class, start it
          if (scheduledClass) {
            const { data: updatedClass, error: updateError } = await (supabase as any)
              .from('virtual_classes')
              .update({
                status: 'ongoing',
                actual_start: new Date().toISOString(),
                meeting_url: `classroom-${scheduledClass.id}-${Date.now()}`
              })
              .eq('id', scheduledClass.id)
              .select(`
                *,
                subjects!inner(name, code)
              `)
              .single();

            if (updateError) throw updateError;
            virtualClass = updatedClass;
          } else {
            // Create new class if none exists and user is a teacher
            const { data: newClass, error: createError } = await (supabase as any)
            .from('virtual_classes')
            .insert({
              subject_id: id,
              teacher_id: user.id,
              title: `Live Class - ${new Date().toLocaleString()}`,
              scheduled_start: new Date().toISOString(),
              actual_start: new Date().toISOString(),
              status: 'ongoing',
              meeting_url: `classroom-${id}-${Date.now()}`,
              attendance_code: Math.random().toString(36).substring(2, 8).toUpperCase()
            })
            .select(`
              *,
              subjects!inner(name, code)
            `)
            .single();

            if (createError) {
              throw createError;
            }
            virtualClass = newClass;
          }
        } else {
          // For students, check if there's a scheduled class they can join
          if (scheduledClass) {
            // Show message that class is scheduled but not started yet
            throw new Error('Class is scheduled but not started yet. Please wait for the teacher to start the class.');
          } else {
            // Student trying to join non-existent class
            throw new Error('No active class session found for this subject');
          }
        }
      }

      if (!virtualClass) {
        throw new Error('Failed to initialize virtual classroom');
      }

      setClassData(virtualClass);

      // Auto-add teacher to attendance if they're the teacher and not already present
      if (user?.role === 'teacher' && virtualClass.teacher_id === user.id) {
        await ensureTeacherAttendance(virtualClass.id);
        setIsInClass(true); // Teacher is automatically in class when they start it
      }

      // Setup real-time subscriptions
      setupRealTimeSubscriptions(virtualClass.id);

      // Load existing chat messages
      await loadChatMessages(virtualClass.id);

      // Load participants
      await loadParticipants(virtualClass.id);

    } catch (error) {
      console.error('Error initializing class:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize virtual classroom";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If it's a student and no class exists, redirect back
      if (user?.role === 'student' && errorMessage.includes('No active class session')) {
        setTimeout(() => {
          navigate('/student/classes');
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeSubscriptions = (classId: string) => {
    // Class participants subscription
    const classChannel = supabase
      .channel(`class-${classId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'class_attendance', filter: `class_id=eq.${classId}` },
        (payload) => {
          console.log('Participant change:', payload);
          loadParticipants(classId);
        }
      )
      .subscribe();

    // Chat subscription
    const chatChannel = supabase
      .channel(`chat-${classId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'class_chat', filter: `class_id=eq.${classId}` },
        async (payload) => {
          console.log('New chat message received:', payload);
          
          // Fetch the complete message with sender profile info
          const { data: messageWithProfile } = await (supabase as any)
            .from('class_chat')
            .select(`
              *,
              profiles!class_chat_sender_id_fkey(full_name, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithProfile) {
            const formattedMessage: ChatMessage = {
              id: messageWithProfile.id,
              sender_id: messageWithProfile.sender_id,
              sender_name: messageWithProfile.profiles?.full_name || 'Unknown',
              message: messageWithProfile.message,
              timestamp: messageWithProfile.created_at,
              sender_role: messageWithProfile.profiles?.role || 'student'
            };

            setChatMessages(prev => [...prev, formattedMessage]);
          }
        }
      )
      .subscribe();

    setClassChannel(classChannel);
    setChatChannel(chatChannel);
  };

  const loadChatMessages = async (classId: string) => {
    try {
      console.log('Loading chat messages for class:', classId);
      
      const { data: messages, error } = await (supabase as any)
        .from('class_chat')
        .select(`
          *,
          profiles!class_chat_sender_id_fkey(full_name, role)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat messages:', error);
        toast({
          title: "Chat Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
        return;
      }

      console.log('Loaded chat messages:', messages?.length || 0);

      if (messages) {
        const formattedMessages: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          sender_name: msg.profiles?.full_name || 'Unknown User',
          message: msg.message,
          timestamp: msg.created_at,
          sender_role: msg.profiles?.role || 'student'
        }));
        
        console.log('Formatted chat messages:', formattedMessages);
        setChatMessages(formattedMessages);
      } else {
        console.log('No chat messages found, setting empty array');
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Chat loading error:', error);
      setChatMessages([]);
    }
  };

  const ensureTeacherAttendance = async (classId: string) => {
    try {
      // Check if teacher is already in attendance
      const { data: existingAttendance } = await (supabase as any)
        .from('class_attendance')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', user?.id)
        .single();

      if (!existingAttendance) {
        // Add teacher to attendance
        await (supabase as any)
          .from('class_attendance')
          .insert({
            class_id: classId,
            student_id: user?.id,
            status: 'present',
            joined_at: new Date().toISOString(),
            video_enabled: true,
            audio_enabled: true
          });
      }
    } catch (error) {
      console.error('Error ensuring teacher attendance:', error);
    }
  };

  const loadParticipants = async (classId: string) => {
    const { data: attendance } = await (supabase as any)
      .from('class_attendance')
      .select(`
        *,
        profiles!class_attendance_student_id_fkey(id, full_name, role)
      `)
      .eq('class_id', classId)
      .eq('status', 'present');

    if (attendance) {
      const formattedParticipants = attendance.map(att => ({
        id: att.student_id,
        name: att.profiles?.full_name || 'Unknown',
        role: att.profiles?.role || 'student',
        session_role: (att.profiles?.role === 'teacher' ? 'presenter' : 'attendee') as 'presenter' | 'attendee',
        video_enabled: att.video_enabled || false,
        audio_enabled: att.audio_enabled || false,
        joined_at: att.joined_at,
        is_sharing_screen: false,
        connection_status: 'connected' as const
      }));
      
      setParticipants(formattedParticipants);
      
      // Find and set the current presenter (teacher)
      const presenter = formattedParticipants.find(p => p.session_role === 'presenter');
      setCurrentPresenter(presenter || null);
      
      // Set if current user is presenter
      setIsPresenter(user?.role === 'teacher' && presenter?.id === user?.id);
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera/microphone. Please check permissions.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const joinClass = async () => {
    try {
      if (!classData?.id) {
        toast({
          title: "Error",
          description: "Class data not available. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      const stream = await initializeMedia();
      
      // Check if user is already in attendance
      const { data: existingAttendance } = await (supabase as any)
        .from('class_attendance')
        .select('id')
        .eq('class_id', classData.id)
        .eq('student_id', user?.id)
        .single();

      if (!existingAttendance) {
        // Record attendance for new participants
        await (supabase as any)
          .from('class_attendance')
          .insert({
            class_id: classData.id,
            student_id: user?.id,
            status: 'present',
            joined_at: new Date().toISOString(),
            video_enabled: isVideoEnabled,
            audio_enabled: isAudioEnabled
          });
      } else {
        // Update existing attendance to present
        await (supabase as any)
          .from('class_attendance')
          .update({
            status: 'present',
            joined_at: new Date().toISOString(),
            video_enabled: isVideoEnabled,
            audio_enabled: isAudioEnabled,
            left_at: null
          })
          .eq('id', existingAttendance.id);
      }

      setIsInClass(true);
      
      toast({
        title: "Joined Class",
        description: "You have successfully joined the virtual classroom",
      });
    } catch (error) {
      console.error('Error joining class:', error);
      toast({
        title: "Error",
        description: "Failed to join class",
        variant: "destructive",
      });
    }
  };

  const leaveClass = async () => {
    try {
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      // Close peer connections
      Object.values(peerConnections).forEach(pc => pc.close());
      setPeerConnections({});

      // Update attendance
      await (supabase as any)
        .from('class_attendance')
        .update({ 
          status: 'absent',
          left_at: new Date().toISOString()
        })
        .eq('class_id', classData.id)
        .eq('student_id', user?.id);

      setIsInClass(false);
      
      toast({
        title: "Left Class",
        description: "You have left the virtual classroom",
      });
    } catch (error) {
      console.error('Error leaving class:', error);
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);

        // Update in database
        await (supabase as any)
          .from('class_attendance')
          .update({ video_enabled: !isVideoEnabled })
          .eq('class_id', classData.id)
          .eq('student_id', user?.id);
      }
    }
  };

  const toggleAudio = async () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);

        // Update in database
        await (supabase as any)
          .from('class_attendance')
          .update({ audio_enabled: !isAudioEnabled })
          .eq('class_id', classData.id)
          .eq('student_id', user?.id);
      }
    }
  };

  const startScreenShare = async () => {
    if (!isPresenter) {
      toast({
        title: "Access Denied",
        description: "Only the presenter can share screen",
        variant: "destructive",
      });
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setScreenShareStream(screenStream);
      setIsScreenSharing(true);

      // Update shared content state
      const newContent: SharedContent = {
        type: 'screen',
        title: 'Screen Share',
        presenter_id: user?.id || ''
      };
      setSharedContent([newContent]);

      // Update in database
      await (supabase as any)
        .from('class_attendance')
        .update({ is_sharing_screen: true })
        .eq('class_id', classData.id)
        .eq('student_id', user?.id);

      toast({
        title: "Screen Sharing Started",
        description: "You are now sharing your screen with the class",
      });

      // Handle screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast({
        title: "Screen Share Error",
        description: "Could not start screen sharing. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScreenShare = async () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
    }

    setIsScreenSharing(false);
    setSharedContent([]);

    // Update in database
    await (supabase as any)
      .from('class_attendance')
      .update({ is_sharing_screen: false })
      .eq('class_id', classData.id)
      .eq('student_id', user?.id);

    toast({
      title: "Screen Sharing Stopped",
      description: "Screen sharing has been ended",
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !classData || !user?.id) {
      console.log('Cannot send message: missing data', {
        hasMessage: !!newMessage.trim(),
        hasClassData: !!classData,
        hasUser: !!user?.id
      });
      return;
    }

    // Debug: Check if user is in attendance before sending message
    console.log('Checking user attendance before sending message...');
    const { data: attendance, error: attendanceError } = await (supabase as any)
      .from('class_attendance')
      .select('status')
      .eq('class_id', classData.id)
      .eq('student_id', user.id)
      .single();

    console.log('User attendance status:', { attendance, attendanceError });
    
    if (!attendance || attendance.status !== 'present') {
      toast({
        title: "Cannot send message",
        description: "You need to join the class first to send messages",
        variant: "destructive",
      });
      return;
    }

    const messageText = newMessage.trim();
    console.log('Sending message:', messageText);

    try {
      const { data, error } = await (supabase as any)
        .from('class_chat')
        .insert({
          class_id: classData.id,
          sender_id: user.id,
          message: messageText,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Message sent successfully:', data);
      setNewMessage('');
      
      // Show success feedback
      toast({
        title: "Message sent",
        description: "Your message has been sent to the class",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peerConnections).forEach(pc => pc.close());
    
    if (classChannel) {
      supabase.removeChannel(classChannel);
    }
    
    if (chatChannel) {
      supabase.removeChannel(chatChannel);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing Virtual Classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">
            {classData?.subject?.name} - {classData?.subject?.code}
          </h1>
          <p className="text-sm text-gray-300">{classData?.title}</p>
          
          {/* Presenter & Sharing Status */}
          <div className="flex items-center gap-4 mt-2">
            {currentPresenter && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-400">
                  <Crown className="h-3 w-3 mr-1" />
                  Presenter: {currentPresenter.profiles?.full_name || 'Unknown'}
                </Badge>
              </div>
            )}
            
            {sharedContent.length > 0 && (
              <div className="flex items-center gap-2">
                {sharedContent.map((content, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-600/20 text-green-400 border-green-400">
                    <Share className="h-3 w-3 mr-1" />
                    Sharing: {content.type}
                  </Badge>
                ))}
              </div>
            )}
            
            {user?.role === 'teacher' && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                <Shield className="h-3 w-3 mr-1" />
                You are the presenter
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-white border-white">
            <Users className="h-3 w-3 mr-1" />
            {participants.length} participants
          </Badge>
          <Button 
            onClick={() => {
              if (user?.role === 'teacher') {
                navigate(`/teacher/subjects/${id}`);
              } else {
                navigate('/student/classes');
              }
            }} 
            variant="outline"
            size="sm"
          >
            Exit Class
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="grid gap-4 h-full">
            {/* Local Video */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 h-64">
                <div className="relative h-full bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant={isVideoEnabled ? "default" : "destructive"}
                      onClick={toggleVideo}
                      disabled={!isInClass}
                    >
                      {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isAudioEnabled ? "default" : "destructive"}
                      onClick={toggleAudio}
                      disabled={!isInClass}
                    >
                      {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary">
                      You ({user?.role || 'student'})
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              {participants.map((participant) => (
                <Card key={participant.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-2 h-32">
                    <div className="relative h-full bg-gray-900 rounded overflow-hidden">
                      {/* Placeholder for participant video */}
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <div className="text-2xl font-bold">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute top-1 left-1 flex flex-col gap-1">
                        <Badge 
                          variant={participant.session_role === 'presenter' ? 'default' : 'secondary'} 
                          className={`text-xs ${participant.session_role === 'presenter' ? 'bg-yellow-600 text-white' : ''}`}
                        >
                          {participant.session_role === 'presenter' ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" />
                              Presenter
                            </>
                          ) : (
                            <>
                              {participant.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                            </>
                          )}
                        </Badge>
                        
                        {/* Connection Status */}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            participant.connection_status === 'connected' 
                              ? 'border-green-400 text-green-400' 
                              : participant.connection_status === 'connecting'
                              ? 'border-yellow-400 text-yellow-400'
                              : 'border-red-400 text-red-400'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            participant.connection_status === 'connected' 
                              ? 'bg-green-400' 
                              : participant.connection_status === 'connecting'
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                          }`} />
                          {participant.connection_status || 'offline'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-1 left-1 flex space-x-1">
                        {participant.video_enabled ? (
                          <Video className="h-3 w-3 text-green-400" />
                        ) : (
                          <VideoOff className="h-3 w-3 text-red-400" />
                        )}
                        {participant.audio_enabled ? (
                          <Mic className="h-3 w-3 text-green-400" />
                        ) : (
                          <MicOff className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                      <div className="absolute bottom-1 right-1">
                        <Badge variant="outline" className="text-xs">
                          {participant.name}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isInClass ? (
                <Button onClick={joinClass} className="bg-green-600 hover:bg-green-700">
                  <Video className="h-4 w-4 mr-2" />
                  Join Class
                </Button>
              ) : (
                <Button onClick={leaveClass} variant="destructive">
                  <Phone className="h-4 w-4 mr-2" />
                  Leave Class
                </Button>
              )}
            </div>

            {/* Presenter Controls (Teacher Only) */}
            {user?.role === 'teacher' && isInClass && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                    Presenter Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Screen Share */}
                    <Button
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      variant={isScreenSharing ? "destructive" : "default"}
                      size="sm"
                      className="h-auto py-2 px-3"
                    >
                      <Monitor className="h-4 w-4 mb-1" />
                      <span className="text-xs">
                        {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                      </span>
                    </Button>

                    {/* Settings */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-3"
                      onClick={() => {
                        // TODO: Add presenter settings
                        toast({
                          title: "Settings",
                          description: "Presenter settings coming soon!",
                        });
                      }}
                    >
                      <Settings className="h-4 w-4 mb-1" />
                      <span className="text-xs">Settings</span>
                    </Button>
                  </div>

                  {/* Sharing Status */}
                  {sharedContent.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">Currently Sharing:</div>
                      {sharedContent.map((content, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Share className="h-3 w-3 text-green-400" />
                            <span className="text-xs">{content.type}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              if (content.type === 'screen') {
                                stopScreenShare();
                              }
                            }}
                          >
                            Stop
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Participant Management */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Class Management:</div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1"
                        onClick={() => {
                          toast({
                            title: "Mute All",
                            description: "Mute all participants feature coming soon!",
                          });
                        }}
                      >
                        <VolumeX className="h-3 w-3 mr-1" />
                        Mute All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1"
                        onClick={() => {
                          toast({
                            title: "End Class",
                            description: "End class for all participants?",
                          });
                        }}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        End Class
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar with Tabs */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="participants" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  People ({participants.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-800 rounded">
                  <div>Messages: {chatMessages.length} | Class: {classData?.id?.slice(0, 8)} | User: {user?.id?.slice(0, 8)}</div>
                  <div>In Class: {isInClass ? 'Yes' : 'No'} | Role: {user?.role} | Participants: {participants.length}</div>
                  <button 
                    onClick={async () => {
                      const { data } = await (supabase as any)
                        .from('class_attendance')
                        .select('*')
                        .eq('class_id', classData?.id)
                        .eq('student_id', user?.id);
                      console.log('My attendance:', data);
                    }}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs mt-1"
                  >
                    Debug Attendance
                  </button>
                </div>
              )}
              
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => {
                  const senderParticipant = participants.find(p => p.id === message.sender_id);
                  const isPresenter = senderParticipant?.session_role === 'presenter';
                  
                  return (
                    <div key={message.id} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-1">
                          {isPresenter && (
                            <Crown className="h-3 w-3 text-yellow-400" />
                          )}
                          <Badge 
                            variant={message.sender_role === 'teacher' ? 'default' : 'secondary'} 
                            className={`text-xs ${isPresenter ? 'bg-yellow-600/20 text-yellow-400 border-yellow-400' : ''}`}
                          >
                            {message.sender_name}
                            {isPresenter && ' (Presenter)'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm rounded p-2 ${
                        isPresenter 
                          ? 'text-yellow-100 bg-yellow-900/20 border border-yellow-600/30'
                          : 'text-gray-200 bg-gray-700'
                      }`}>
                        {message.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
                disabled={!isInClass || !classData}
                title={!isInClass ? "Join the class to send messages" : ""}
              />
              <Button 
                onClick={sendMessage} 
                size="sm" 
                disabled={!isInClass || !classData || !newMessage.trim()}
                title={!isInClass ? "Join the class to send messages" : ""}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {participants.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No participants</p>
                </div>
              ) : (
                participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{participant.name}</span>
                          {participant.session_role === 'presenter' && (
                            <Crown className="h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={participant.session_role === 'presenter' ? 'default' : 'secondary'}
                            className={`text-xs ${participant.session_role === 'presenter' ? 'bg-yellow-600 text-white' : ''}`}
                          >
                            {participant.session_role === 'presenter' ? 'Presenter' : participant.role}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              participant.connection_status === 'connected' 
                                ? 'border-green-400 text-green-400' 
                                : participant.connection_status === 'connecting'
                                ? 'border-yellow-400 text-yellow-400'
                                : 'border-red-400 text-red-400'
                            }`}
                          >
                            {participant.connection_status || 'offline'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {participant.video_enabled ? (
                        <Video className="h-4 w-4 text-green-400" />
                      ) : (
                        <VideoOff className="h-4 w-4 text-red-400" />
                      )}
                      {participant.audio_enabled ? (
                        <Mic className="h-4 w-4 text-green-400" />
                      ) : (
                        <MicOff className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
      </div>
    </div>
  );
};

export default VirtualClassroom;