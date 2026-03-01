import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Users, MessageSquare, Phone, Circle, Hand } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface ClassDetails {
  id: number;
  class_name: string;
  subject_name: string;
  grade_name: string;
  teacher_name: string;
  room_id: string;
  status: string;
  is_recording: boolean;
}

const StudentVirtualClassroom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // State
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false); // Start muted for students
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // User info from auth context
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Initialize
  useEffect(() => {
    if (!roomId) return;

    loadClassDetails();
    initializeMedia();
    setupWebSocket();

    return () => {
      cleanup();
    };
  }, [roomId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadClassDetails = async () => {
    try {
      const response = await api.get(`/virtual-classroom/room/${roomId}`);
      setClassDetails(response.data.class);
      setIsRecording(response.data.class.is_recording);

      if (response.data.class.status !== 'live') {
        toast.error('This class is not currently live');
        navigate('/student/classes');
        return;
      }

      // Join the class
      await api.post(`/virtual-classroom/join/${response.data.class.id}`);
      toast.success('Joined class successfully');
    } catch (error) {
      console.error('Failed to load class details:', error);
      toast.error('Failed to join class');
      navigate('/student/classes');
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Start with audio muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      toast.success('Camera and microphone ready');
    } catch (error) {
      console.error('Failed to access media devices:', error);
      toast.error('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const setupWebSocket = () => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        userName: user.full_name,
        userRole: 'student'
      });
    });

    socket.on('room-participants', (existingParticipants) => {
      setParticipantCount(existingParticipants.length);
      existingParticipants.forEach((participant: any) => {
        createPeerConnection(participant.socketId, true, participant);
      });
    });

    socket.on('user-joined', async (data) => {
      const { socketId, userName } = data;
      setParticipantCount((prev) => prev + 1);
      
      addSystemMessage(`${userName} joined the class`);
      createPeerConnection(socketId, true, data);
    });

    socket.on('user-left', (data) => {
      const { socketId, userName } = data;
      setParticipantCount((prev) => prev - 1);
      
      addSystemMessage(`${userName} left the class`);
      removePeerConnection(socketId);
    });

    socket.on('offer', async ({ socketId, offer }) => {
      await handleOffer(socketId, offer);
    });

    socket.on('answer', async ({ socketId, answer }) => {
      await handleAnswer(socketId, answer);
    });

    socket.on('ice-candidate', async ({ socketId, candidate }) => {
      await handleIceCandidate(socketId, candidate);
    });

    socket.on('chat-message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on('peer-media-state-change', ({ socketId, isVideoEnabled, isAudioEnabled }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId ? { ...p, isVideoEnabled, isAudioEnabled } : p
        )
      );
    });

    socket.on('peer-screen-share-start', ({ socketId }) => {
      toast.info('Teacher is sharing screen');
    });

    socket.on('peer-screen-share-stop', ({ socketId }) => {
      toast.info('Screen sharing ended');
    });

    socket.on('recording-state-changed', ({ isRecording }) => {
      setIsRecording(isRecording);
      addSystemMessage(isRecording ? 'Class recording started' : 'Class recording stopped');
    });
  };

  const createPeerConnection = (socketId: string, isInitiator: boolean, userData: any) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const participant: Participant = {
        socketId,
        userId: userData.userId,
        userName: userData.userName,
        userRole: userData.userRole,
        stream: event.streams[0],
        isVideoEnabled: true,
        isAudioEnabled: true
      };

      setParticipants((prev) => {
        const exists = prev.find((p) => p.socketId === socketId);
        if (exists) {
          return prev.map((p) => (p.socketId === socketId ? participant : p));
        }
        return [...prev, participant];
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId: socketId,
          candidate: event.candidate
        });
      }
    };

    peerConnectionsRef.current.set(socketId, peerConnection);

    // Create offer if initiator
    if (isInitiator) {
      createOffer(socketId, peerConnection);
    }
  };

  const createOffer = async (socketId: string, peerConnection: RTCPeerConnection) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit('offer', {
          roomId,
          targetSocketId: socketId,
          offer
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (socketId: string, offer: RTCSessionDescriptionInit) => {
    let peerConnection = peerConnectionsRef.current.get(socketId);

    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection!.addTrack(track, localStream);
        });
      }

      peerConnectionsRef.current.set(socketId, peerConnection);
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (socketRef.current) {
      socketRef.current.emit('answer', {
        targetSocketId: socketId,
        answer
      });
    }
  };

  const handleAnswer = async (socketId: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peerConnectionsRef.current.get(socketId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (socketId: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peerConnectionsRef.current.get(socketId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const removePeerConnection = (socketId: string) => {
    const peerConnection = peerConnectionsRef.current.get(socketId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(socketId);
    }

    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);

        if (socketRef.current) {
          socketRef.current.emit('media-state-change', {
            roomId,
            isVideoEnabled: videoTrack.enabled,
            isAudioEnabled
          });
        }

        toast.info(videoTrack.enabled ? 'Camera on' : 'Camera off');
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);

        if (socketRef.current) {
          socketRef.current.emit('media-state-change', {
            roomId,
            isVideoEnabled,
            isAudioEnabled: audioTrack.enabled
          });
        }

        toast.info(audioTrack.enabled ? 'Microphone on' : 'Microphone off');
      }
    }
  };

  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    
    if (socketRef.current) {
      socketRef.current.emit('chat-message', {
        roomId,
        message: handRaised ? '🖐️ lowered hand' : '✋ raised hand',
        userName: user.full_name,
        userRole: 'student'
      });
    }

    toast.info(handRaised ? 'Hand lowered' : 'Hand raised');
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      roomId,
      message: messageInput,
      userName: user.full_name,
      userRole: 'student'
    });

    setMessageInput('');
  };

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'system',
      userName: 'System',
      userRole: 'teacher',
      message,
      timestamp: new Date(),
      type: 'system'
    };
    setChatMessages((prev) => [...prev, systemMessage]);
  };

  const leaveClass = async () => {
    if (!classDetails) return;

    try {
      await api.post(`/virtual-classroom/leave/${classDetails.id}`);
      toast.success('Left class successfully');
      navigate('/student/classes');
    } catch (error) {
      console.error('Error leaving class:', error);
      navigate('/student/classes');
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
    }
  };

  if (!classDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Joining classroom...</p>
        </div>
      </div>
    );
  }

  // Find the teacher in participants
  const teacher = participants.find((p) => p.userRole === 'teacher');

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{classDetails.class_name}</h1>
          <p className="text-sm text-gray-400">
            {classDetails.subject_name} - {classDetails.grade_name} • Teacher: {classDetails.teacher_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="h-3 w-3 mr-1 fill-current" />
              Recording
            </Badge>
          )}
          <Badge variant="secondary">
            <Users className="h-4 w-4 mr-1" />
            {participantCount + 1} participants
          </Badge>
          <Button onClick={leaveClass} variant="destructive">
            <Phone className="h-4 w-4 mr-2" />
            Leave Class
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Teacher Video - Larger */}
              {teacher && (
                <Card className="relative bg-gray-800 border-gray-700 col-span-2 lg:col-span-2">
                  <ParticipantVideo participant={teacher} isTeacher />
                </Card>
              )}

              {/* Local Video (Student) */}
              <Card className="relative bg-gray-800 border-gray-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
                  You
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {handRaised && (
                    <div className="bg-yellow-500 rounded-full p-1 animate-pulse">
                      <Hand className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {!isVideoEnabled && (
                    <div className="bg-red-500 rounded-full p-1">
                      <VideoOff className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {!isAudioEnabled && (
                    <div className="bg-red-500 rounded-full p-1">
                      <MicOff className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </Card>

              {/* Other Student Videos */}
              {participants
                .filter((p) => p.userRole === 'student')
                .map((participant) => (
                  <ParticipantVideo key={participant.socketId} participant={participant} />
                ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={toggleVideo}
                variant={isVideoEnabled ? 'default' : 'destructive'}
                size="lg"
                className="rounded-full w-14 h-14"
              >
                {isVideoEnabled ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={toggleAudio}
                variant={isAudioEnabled ? 'default' : 'destructive'}
                size="lg"
                className="rounded-full w-14 h-14"
              >
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>

              <Button
                onClick={toggleHandRaise}
                variant={handRaised ? 'secondary' : 'outline'}
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <Hand className={`h-6 w-6 ${handRaised ? 'animate-bounce' : ''}`} />
              </Button>

              <Button
                onClick={() => setShowChat(!showChat)}
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>

              <Button
                onClick={() => setShowParticipants(!showParticipants)}
                variant="outline"
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <Users className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => {
                  setShowChat(true);
                  setShowParticipants(false);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showChat ? 'text-white border-b-2 border-primary' : 'text-gray-400'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => {
                  setShowChat(false);
                  setShowParticipants(true);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showParticipants
                    ? 'text-white border-b-2 border-primary'
                    : 'text-gray-400'
                }`}
              >
                Participants ({participantCount + 1})
              </button>
            </div>

            {/* Chat */}
            {showChat && (
              <>
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-3 ${msg.type === 'system' ? 'text-center' : ''}`}
                    >
                      {msg.type === 'system' ? (
                        <p className="text-xs text-gray-400">{msg.message}</p>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {msg.userName}
                            </span>
                            <Badge variant={msg.userRole === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                              {msg.userRole}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300">{msg.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 border-gray-600 text-white"
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </div>
              </>
            )}

            {/* Participants */}
            {showParticipants && (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {/* Teacher */}
                  {teacher && (
                    <div className="flex items-center gap-3 p-2 rounded bg-gray-700">
                      <Avatar>
                        <AvatarFallback>{teacher.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{teacher.userName}</p>
                        <Badge variant="default" className="text-xs">
                          Teacher
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* You */}
                  <div className="flex items-center gap-3 p-2 rounded bg-gray-700">
                    <Avatar>
                      <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {user.full_name} (You)
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Student
                      </Badge>
                    </div>
                    {handRaised && <Hand className="h-4 w-4 text-yellow-500 animate-pulse" />}
                  </div>

                  {/* Other Students */}
                  {participants
                    .filter((p) => p.userRole === 'student')
                    .map((participant) => (
                      <div
                        key={participant.socketId}
                        className="flex items-center gap-3 p-2 rounded bg-gray-700"
                      >
                        <Avatar>
                          <AvatarFallback>{participant.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {participant.userName}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Student
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {!participant.isVideoEnabled && (
                            <VideoOff className="h-4 w-4 text-gray-400" />
                          )}
                          {!participant.isAudioEnabled && (
                            <MicOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Participant Video Component
const ParticipantVideo: React.FC<{ participant: Participant; isTeacher?: boolean }> = ({
  participant,
  isTeacher = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <Card className="relative bg-gray-800 border-gray-700 h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
        {participant.userName}
        {isTeacher && <Badge variant="default" className="text-xs">Teacher</Badge>}
      </div>
      <div className="absolute top-2 right-2 flex gap-2">
        {!participant.isVideoEnabled && (
          <div className="bg-red-500 rounded-full p-1">
            <VideoOff className="h-4 w-4 text-white" />
          </div>
        )}
        {!participant.isAudioEnabled && (
          <div className="bg-red-500 rounded-full p-1">
            <MicOff className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StudentVirtualClassroom;
