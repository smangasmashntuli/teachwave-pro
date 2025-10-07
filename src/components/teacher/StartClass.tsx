import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  X, 
  Users, 
  Mic, 
  MicOff, 
  VideoOff, 
  Settings, 
  Share, 
  MessageSquare, 
  Hand,
  ScreenShare,
  Circle,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Camera,
  Monitor,
  Send,
  Paperclip,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WebRTCService, PeerConnection } from "@/lib/webrtc";
import { ChatService, ChatMessage as ChatMsg, ChatUser } from "@/lib/chat";

interface StartClassProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo?: {
    title: string;
    subject: string;
    grade: string;
    students: number;
    time: string;
  };
}

const StartClass = ({ isOpen, onClose, classInfo }: StartClassProps) => {
  // Video/Audio state
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [classStarted, setClassStarted] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  // WebRTC and Chat services
  const [webrtcService, setWebrtcService] = useState<WebRTCService | null>(null);
  const [chatService, setChatService] = useState<ChatService | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  
  // UI state
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  // Generate room ID based on class info
  const roomId = `class_${classInfo?.title?.replace(/\s+/g, '_').toLowerCase() || 'demo'}_${Date.now()}`;
  const teacherId = 'teacher_' + Math.random().toString(36).substr(2, 9);
  const teacherName = 'Teacher'; // In real app, get from auth context

  // Initialize media devices
  const initializeMedia = useCallback(async () => {
    setIsInitializing(true);
    
    try {
      const service = new WebRTCService(true); // true = teacher
      setWebrtcService(service);
      
      // Get available devices
      const devices = await service.getAvailableDevices();
      setAvailableDevices(devices);
      
      // Initialize media with current settings
      const stream = await service.initializeMedia({
        video: isVideoOn,
        audio: isAudioOn
      });
      
      setLocalStream(stream);
      setPermissionsGranted(true);
      
      // Set up local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      toast({
        title: "Media Initialized",
        description: "Camera and microphone are ready.",
      });
      
    } catch (error) {
      console.error('Error initializing media:', error);
      toast({
        title: "Media Access Denied",
        description: "Please allow camera and microphone access to start the class.",
        variant: "destructive"
      });
      setPermissionsGranted(false);
    } finally {
      setIsInitializing(false);
    }
  }, [isVideoOn, isAudioOn]);
  
  // Initialize chat service
  const initializeChat = useCallback(async () => {
    try {
      const service = new ChatService(roomId, teacherId, teacherName, 'teacher');
      
      // Set up event listeners
      service.onMessage((message) => {
        setChatMessages(prev => [...prev, message]);
      });
      
      service.onUserJoined((user) => {
        setChatUsers(prev => [...prev, user]);
        toast({
          title: "Student Joined",
          description: `${user.name} joined the class.`,
        });
      });
      
      service.onUserLeft((userId) => {
        setChatUsers(prev => prev.filter(u => u.id !== userId));
      });
      
      service.onConnectionState((connected) => {
        setConnectionStatus(connected ? 'connected' : 'disconnected');
      });
      
      // Connect to chat server (fallback to demo mode if no server)
      try {
        await service.connect('ws://localhost:8080');
      } catch (error) {
        console.warn('Chat server not available, using demo mode');
        // Demo mode - simulate some messages
        const demoMessages: ChatMsg[] = [
          {
            id: '1',
            userId: 'demo_student_1',
            userName: 'Alice Johnson',
            userRole: 'student',
            message: 'Good morning, teacher!',
            timestamp: new Date(),
            type: 'text'
          }
        ];
        setChatMessages(demoMessages);
      }
      
      setChatService(service);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }, [roomId, teacherId, teacherName]);

  const handleStartClass = async () => {
    if (!permissionsGranted) {
      await initializeMedia();
      if (!permissionsGranted) return;
    }
    
    setClassStarted(true);
    setConnectionStatus('connecting');
    
    // Initialize chat
    await initializeChat();
    
    setConnectionStatus('connected');
    
    toast({
      title: "Class Started",
      description: "Your virtual class is now live. Students can join using the meeting link.",
    });
  };

  const handleEndClass = () => {
    // Stop recording if active
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
    
    // Clean up WebRTC
    if (webrtcService) {
      webrtcService.cleanup();
    }
    
    // Disconnect chat
    if (chatService) {
      chatService.disconnect();
    }
    
    setClassStarted(false);
    setConnectionStatus('disconnected');
    
    toast({
      title: "Class Ended",
      description: "The virtual class has been ended. Recording saved automatically.",
    });
    
    onClose();
  };

  const toggleVideo = async () => {
    if (webrtcService) {
      const newState = !isVideoOn;
      webrtcService.toggleVideo(newState);
      setIsVideoOn(newState);
      
      toast({
        title: newState ? "Camera On" : "Camera Off",
        description: newState ? "Your camera is now on." : "Your camera is now off.",
      });
    }
  };

  const toggleAudio = async () => {
    if (webrtcService) {
      const newState = !isAudioOn;
      webrtcService.toggleAudio(newState);
      setIsAudioOn(newState);
      
      toast({
        title: newState ? "Microphone On" : "Microphone Off",
        description: newState ? "Your microphone is now on." : "Your microphone is now off.",
      });
    }
  };

  const toggleRecording = () => {
    if (!isRecording && webrtcService) {
      const recorder = webrtcService.startRecording();
      if (recorder) {
        setMediaRecorder(recorder);
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Class recording has started.",
        });
      } else {
        toast({
          title: "Recording Failed",
          description: "Unable to start recording.",
          variant: "destructive"
        });
      }
    } else if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Class recording has been stopped and saved.",
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!webrtcService) return;
    
    if (!isScreenSharing) {
      try {
        await webrtcService.startScreenShare();
        setIsScreenSharing(true);
        toast({
          title: "Screen Share Started",
          description: "You are now sharing your screen.",
        });
      } catch (error) {
        toast({
          title: "Screen Share Failed",
          description: "Unable to start screen sharing.",
          variant: "destructive"
        });
      }
    } else {
      await webrtcService.stopScreenShare();
      setIsScreenSharing(false);
      toast({
        title: "Screen Share Stopped",
        description: "Screen sharing has been stopped.",
      });
    }
  };

  const sendMessage = () => {
    if (chatMessage.trim() && chatService) {
      chatService.sendTextMessage(chatMessage);
      setChatMessage("");
    }
  };

  // Handle peer connections (when students join)
  const handlePeerConnection = useCallback((peerId: string, peerName: string) => {
    if (!webrtcService) return;
    
    const peerConnection = webrtcService.createPeerConnection(
      peerId,
      peerName,
      'student',
      (remoteStream) => {
        // Handle remote video stream
        const videoElement = remoteVideosRef.current.get(peerId);
        if (videoElement) {
          videoElement.srcObject = remoteStream;
        }
      },
      (state) => {
        console.log(`Peer ${peerName} connection state:`, state);
      }
    );
    
    setConnectedPeers(prev => new Map(prev.set(peerId, {
      id: peerId,
      name: peerName,
      role: 'student',
      connection: peerConnection,
      isVideoEnabled: true,
      isAudioEnabled: true
    })));
  }, [webrtcService]);

  // Initialize media when component opens
  useEffect(() => {
    if (isOpen && !localStream) {
      initializeMedia();
    }
  }, [isOpen, initializeMedia, localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcService) {
        webrtcService.cleanup();
      }
      if (chatService) {
        chatService.disconnect();
      }
    };
  }, [webrtcService, chatService]);

  if (!isOpen) return null;

  const defaultClassInfo = {
    title: "Mathematics - Quadratic Equations",
    subject: "Mathematics",
    grade: "Grade 10",
    students: 28,
    time: "Today, 10:00 AM"
  };

  const currentClass = classInfo || defaultClassInfo;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {classStarted ? "Live Class" : "Start Virtual Class"}
              </CardTitle>
              <CardDescription>
                {currentClass.title} - {currentClass.grade}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {classStarted && (
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!classStarted ? (
            // Pre-class setup
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Subject & Grade</Label>
                      <p className="text-lg">{currentClass.subject} - {currentClass.grade}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expected Students</Label>
                      <p className="text-lg">{currentClass.students} students</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Meeting Link</Label>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 p-2 bg-muted rounded text-sm">
                        https://meet.teachwave.com/math-grade10-abc123
                      </code>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Camera Preview */}
              {localStream && (
                <Card>
                  <CardHeader>
                    <CardTitle>Camera Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pre-class Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Camera</Label>
                        <p className="text-sm text-muted-foreground">Turn on your camera</p>
                      </div>
                      <Switch checked={isVideoOn} onCheckedChange={setIsVideoOn} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Microphone</Label>
                        <p className="text-sm text-muted-foreground">Turn on your microphone</p>
                      </div>
                      <Switch checked={isAudioOn} onCheckedChange={setIsAudioOn} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Record Class</Label>
                        <p className="text-sm text-muted-foreground">Save for later review</p>
                      </div>
                      <Switch checked={isRecording} onCheckedChange={setIsRecording} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Chat</Label>
                        <p className="text-sm text-muted-foreground">Allow student messages</p>
                      </div>
                      <Switch checked={showChat} onCheckedChange={setShowChat} />
                    </div>
                  </div>

                  {!permissionsGranted && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Camera and microphone permissions required to start class
                      </p>
                    </div>
                  )}

                  {availableDevices.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Available Devices</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {availableDevices.filter(d => d.kind === 'videoinput').length > 0 && (
                          <p>📹 {availableDevices.filter(d => d.kind === 'videoinput').length} camera(s) detected</p>
                        )}
                        {availableDevices.filter(d => d.kind === 'audioinput').length > 0 && (
                          <p>🎤 {availableDevices.filter(d => d.kind === 'audioinput').length} microphone(s) detected</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  onClick={handleStartClass} 
                  size="lg" 
                  className="flex-1"
                  disabled={isInitializing || (!permissionsGranted && !isInitializing)}
                >
                  {isInitializing ? (
                    <>
                      <Circle className="h-5 w-5 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Video className="h-5 w-5 mr-2" />
                      Start Class
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Active class interface
            <div className="space-y-4">
              {/* Video Controls Bar */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isVideoOn ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleVideo}
                  >
                    {isVideoOn ? <Camera className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isAudioOn ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleAudio}
                  >
                    {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isScreenSharing ? "default" : "outline"}
                    size="sm"
                    onClick={toggleScreenShare}
                  >
                    <ScreenShare className="h-4 w-4" />
                    {isScreenSharing && <span className="ml-1">Sharing</span>}
                  </Button>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleRecording}
                  >
                    <Circle className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording && <span className="ml-1">REC</span>}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                    {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'} 
                    {connectionStatus}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {connectedPeers.size + chatUsers.length} participants
                  </span>
                  <Button variant="destructive" size="sm" onClick={handleEndClass}>
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Class
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Video/Presentation Area */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
                        {localStream ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            {isScreenSharing ? (
                              <div className="text-center">
                                <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Screen sharing active</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>No video stream</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Video controls overlay */}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          {!isVideoOn && (
                            <Badge variant="secondary">Camera Off</Badge>
                          )}
                          {!isAudioOn && (
                            <Badge variant="secondary">Muted</Badge>
                          )}
                          {isScreenSharing && (
                            <Badge variant="default">Screen Sharing</Badge>
                          )}
                        </div>
                        
                        {isRecording && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="destructive" className="animate-pulse">
                              ● REC
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Student video grid */}
                  {connectedPeers.size > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Student Videos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Array.from(connectedPeers.values()).map((peer) => (
                            <div key={peer.id} className="aspect-video bg-black rounded relative">
                              <video
                                ref={(el) => {
                                  if (el) remoteVideosRef.current.set(peer.id, el);
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover rounded"
                              />
                              <div className="absolute bottom-1 left-1">
                                <Badge variant="secondary" className="text-xs">
                                  {peer.name}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Tabs defaultValue="students" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="students">Students</TabsTrigger>
                      <TabsTrigger value="chat">Chat</TabsTrigger>
                      <TabsTrigger value="hands">Hands</TabsTrigger>
                    </TabsList>

                    <TabsContent value="students" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Participants ({chatUsers.length + connectedPeers.size})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <ScrollArea className="h-64">
                            {/* Teacher (self) */}
                            <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-bold">T</span>
                                </div>
                                <span className="text-sm font-medium">You (Teacher)</span>
                              </div>
                              <div className="flex gap-1">
                                <Badge variant="default" className="text-xs">Host</Badge>
                              </div>
                            </div>
                            
                            {/* Connected students */}
                            {chatUsers.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <span className="text-sm">{user.name}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Badge 
                                    variant={user.isOnline ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {user.isOnline ? 'online' : 'offline'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            
                            {/* WebRTC peers */}
                            {Array.from(connectedPeers.values()).map((peer) => (
                              <div key={peer.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-xs">
                                      {peer.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <span className="text-sm">{peer.name}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Badge variant="default" className="text-xs">video</Badge>
                                  {!peer.isVideoEnabled && (
                                    <VideoOff className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  {!peer.isAudioEnabled && (
                                    <MicOff className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {chatUsers.length === 0 && connectedPeers.size === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No students connected yet
                              </p>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="chat" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Class Chat ({chatMessages.length})</CardTitle>
                            {chatService?.isConnected() ? (
                              <Badge variant="default" className="text-xs">Connected</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ScrollArea className="h-48">
                            <div className="space-y-3">
                              {chatMessages.map((msg) => (
                                <div key={msg.id} className={`text-sm p-2 rounded ${
                                  msg.type === 'system' ? 'bg-muted' : 
                                  msg.userRole === 'teacher' ? 'bg-primary/10' : 'bg-secondary/50'
                                }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs">{msg.userName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {msg.userRole}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{msg.message}</p>
                                  {msg.metadata?.fileName && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                      <Paperclip className="h-3 w-3" />
                                      {msg.metadata.fileName}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {chatMessages.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No messages yet. Start the conversation!
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                          
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Type a message to all participants..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                  }
                                }}
                                rows={2}
                                className="flex-1"
                              />
                              <div className="flex flex-col gap-1">
                                <Button size="sm" onClick={sendMessage} disabled={!chatMessage.trim()}>
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Paperclip className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {connectionStatus !== 'connected' && (
                              <p className="text-xs text-muted-foreground">
                                💡 Chat server not available. Messages will be local only.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="hands" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Hand className="h-4 w-4" />
                            Raised Hands (0)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <ScrollArea className="h-48">
                            {/* In a real implementation, this would track raised hands from students */}
                            <div className="text-sm text-muted-foreground text-center py-8">
                              <Hand className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No raised hands</p>
                              <p className="text-xs mt-1">Students can raise their hands during the class</p>
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StartClass;