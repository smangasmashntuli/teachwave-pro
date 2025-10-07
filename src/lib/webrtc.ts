export interface MediaDevices {
  video: boolean;
  audio: boolean;
}

export interface PeerConnection {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  connection: RTCPeerConnection;
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private isTeacher: boolean = false;
  private roomId: string = '';
  
  // Configuration for STUN servers (you can add TURN servers for production)
  private rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(isTeacher: boolean = false) {
    this.isTeacher = isTeacher;
  }

  // Initialize media devices
  async initializeMedia(constraints: MediaDevices = { video: true, audio: true }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media initialized successfully');
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  // Get available media devices
  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  // Toggle video on/off
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  // Toggle audio on/off
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      this.peerConnections.forEach((peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share ending
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  // Stop screen sharing and return to camera
  async stopScreenShare(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      this.peerConnections.forEach((peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
  }

  // Create peer connection for a new participant
  createPeerConnection(
    peerId: string, 
    peerName: string, 
    peerRole: 'teacher' | 'student',
    onRemoteStream?: (stream: MediaStream) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Remote stream received from:', peerName);
      if (onRemoteStream && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (onConnectionStateChange) {
        onConnectionStateChange(peerConnection.connectionState);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Store peer connection
    const peer: PeerConnection = {
      id: peerId,
      name: peerName,
      role: peerRole,
      connection: peerConnection,
      isVideoEnabled: true,
      isAudioEnabled: true,
    };

    this.peerConnections.set(peerId, peer);
    return peerConnection;
  }

  // Create offer for initiating connection
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peer = this.peerConnections.get(peerId);
    if (!peer) throw new Error('Peer not found');

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);
    return offer;
  }

  // Create answer for responding to connection
  async createAnswer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peer = this.peerConnections.get(peerId);
    if (!peer) throw new Error('Peer not found');

    await peer.connection.setRemoteDescription(offer);
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);
    return answer;
  }

  // Handle received answer
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peerConnections.get(peerId);
    if (!peer) throw new Error('Peer not found');

    await peer.connection.setRemoteDescription(answer);
  }

  // Add ICE candidate
  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peerConnections.get(peerId);
    if (!peer) throw new Error('Peer not found');

    await peer.connection.addIceCandidate(candidate);
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get peer connections
  getPeerConnections(): Map<string, PeerConnection> {
    return this.peerConnections;
  }

  // Remove peer connection
  removePeer(peerId: string): void {
    const peer = this.peerConnections.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peerConnections.delete(peerId);
    }
  }

  // Cleanup
  cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((peer) => {
      peer.connection.close();
    });
    this.peerConnections.clear();
  }

  // Start recording (basic implementation)
  startRecording(): MediaRecorder | null {
    if (!this.localStream) return null;

    try {
      const mediaRecorder = new MediaRecorder(this.localStream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `class-recording-${new Date().toISOString()}.webm`;
        a.click();
        
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();
      return mediaRecorder;
    } catch (error) {
      console.error('Error starting recording:', error);
      return null;
    }
  }
}