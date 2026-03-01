import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Monitor, Users, MessageSquare, Phone, Settings, Circle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  room_id: string;
  status: string;
  is_recording: boolean;
  recording_enabled: boolean;
}

const TeacherVirtualClassroom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // State
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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

      // Auto-start class if not already live
      if (response.data.class.status === 'scheduled') {
        await api.put(`/virtual-classroom/start/${response.data.class.id}`);
        toast.success('Class started!');
      }
    } catch (error) {
      console.error('Failed to load class details:', error);
      toast.error('Failed to load class details');
      navigate('/teacher/classes');
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
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
        userRole: 'teacher'
      });
    });

    socket.on('room-participants', (existingParticipants) => {
      setParticipantCount(existingParticipants.length);
      existingParticipants.forEach((participant: any) => {
        createPeerConnection(participant.socketId, true, participant);
      });
    });

    socket.on('user-joined', async (data) => {
      const { socketId, userName, userRole } = data;
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

    socket.on('recording-state-changed', ({ isRecording }) => {
      setIsRecording(isRecording);
      toast.info(isRecording ? 'Recording started' : 'Recording stopped');
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

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        setScreenStream(stream);
        setIsScreenSharing(true);

        if (screenShareRef.current) {
          screenShareRef.current.srcObject = stream;
        }

        // Replace video track with screen share for all peer connections
        const screenTrack = stream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((peerConnection) => {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Handle screen share stop
        screenTrack.onended = () => {
          stopScreenShare();
        };

        if (socketRef.current) {
          socketRef.current.emit('screen-share-start', { roomId });
        }

        toast.success('Screen sharing started');
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast.error('Failed to start screen sharing');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }

    setIsScreenSharing(false);

    // Switch back to camera
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    if (socketRef.current) {
      socketRef.current.emit('screen-share-stop', { roomId });
    }

    toast.info('Screen sharing stopped');
  };

  const toggleRecording = async () => {
    if (!classDetails?.recording_enabled) {
      toast.error('Recording not enabled for this class');
      return;
    }

    if (!isRecording) {
      try {
        // Start recording
        const stream = localStream || new MediaStream();
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(1000); // Collect data every second

        await api.put(`/virtual-classroom/recording/${classDetails.id}`, {
          isRecording: true
        });

        setIsRecording(true);

        if (socketRef.current) {
          socketRef.current.emit('recording-state-change', { roomId, isRecording: true });
        }

        toast.success('Recording started');
      } catch (error) {
        console.error('Error starting recording:', error);
        toast.error('Failed to start recording');
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          
          // Create download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `recording-${classDetails?.class_name}-${Date.now()}.webm`;
          a.click();

          // TODO: Upload to server
          toast.success('Recording saved. You can upload it manually.');
        };
      }

      await api.put(`/virtual-classroom/recording/${classDetails?.id}`, {
        isRecording: false
      });

      setIsRecording(false);

      if (socketRef.current) {
        socketRef.current.emit('recording-state-change', { roomId, isRecording: false });
      }
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      roomId,
      message: messageInput,
      userName: user.full_name,
      userRole: 'teacher'
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

  const endClass = async () => {
    if (!classDetails) return;

    if (confirm('Are you sure you want to end this class?')) {
      try {
        await api.put(`/virtual-classroom/end/${classDetails.id}`);
        toast.success('Class ended successfully');
        navigate('/teacher/classes');
      } catch (error) {
        console.error('Error ending class:', error);
        toast.error('Failed to end class');
      }
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
    }

    // Stop recording if active
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  if (!classDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{classDetails.class_name}</h1>
          <p className="text-sm text-gray-400">
            {classDetails.subject_name} - {classDetails.grade_name}
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
          <Button onClick={endClass} variant="destructive">
            <Phone className="h-4 w-4 mr-2" />
            End Class
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local Video (Teacher) */}
              <Card className="relative bg-gray-800 border-gray-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
                  You (Teacher)
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
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

              {/* Screen Share */}
              {isScreenSharing && screenStream && (
                <Card className="relative bg-gray-800 border-gray-700 col-span-2">
                  <video
                    ref={screenShareRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
                    Your Screen
                  </div>
                </Card>
              )}

              {/* Participant Videos */}
              {participants.map((participant) => (
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
                onClick={toggleScreenShare}
                variant={isScreenSharing ? 'secondary' : 'default'}
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <Monitor className="h-6 w-6" />
              </Button>

              {classDetails.recording_enabled && (
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? 'destructive' : 'default'}
                  size="lg"
                  className="rounded-full w-14 h-14"
                >
                  <Circle className={`h-6 w-6 ${isRecording ? 'fill-current' : ''}`} />
                </Button>
              )}

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
                onClick={() => setShowChat(true)}
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
                  showParticipants && !showChat
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
            {showParticipants && !showChat && (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {/* Teacher (You) */}
                  <div className="flex items-center gap-3 p-2 rounded bg-gray-700">
                    <Avatar>
                      <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {user.full_name} (You)
                      </p>
                      <Badge variant="default" className="text-xs">
                        Teacher
                      </Badge>
                    </div>
                  </div>

                  {/* Students */}
                  {participants.map((participant) => (
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
                          {participant.userRole}
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
const ParticipantVideo: React.FC<{ participant: Participant }> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <Card className="relative bg-gray-800 border-gray-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
        {participant.userName}
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

export default TeacherVirtualClassroom;
