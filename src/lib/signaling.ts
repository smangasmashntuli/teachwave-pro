// WebSocket Server Simulation for Development
// In production, you would replace this with a real WebSocket server

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'chat';
  roomId: string;
  peerId: string;
  peerName?: string;
  peerRole?: 'teacher' | 'student';
  data?: any;
}

export class SignalingService {
  private static instance: SignalingService;
  private rooms: Map<string, Set<string>> = new Map();
  private peers: Map<string, { name: string; role: 'teacher' | 'student' }> = new Map();
  private messageHandlers: Map<string, (message: SignalingMessage) => void> = new Map();

  static getInstance(): SignalingService {
    if (!SignalingService.instance) {
      SignalingService.instance = new SignalingService();
    }
    return SignalingService.instance;
  }

  // Join a room
  joinRoom(roomId: string, peerId: string, peerName: string, peerRole: 'teacher' | 'student'): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    const room = this.rooms.get(roomId)!;
    room.add(peerId);
    
    this.peers.set(peerId, { name: peerName, role: peerRole });
    
    // Notify other peers in the room
    const joinMessage: SignalingMessage = {
      type: 'join',
      roomId,
      peerId,
      peerName,
      peerRole,
      data: { timestamp: new Date().toISOString() }
    };
    
    this.broadcastToRoom(roomId, joinMessage, peerId);
    
    console.log(`${peerName} (${peerRole}) joined room ${roomId}`);
  }

  // Leave a room
  leaveRoom(roomId: string, peerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(peerId);
      
      const peer = this.peers.get(peerId);
      if (peer) {
        const leaveMessage: SignalingMessage = {
          type: 'leave',
          roomId,
          peerId,
          peerName: peer.name,
          peerRole: peer.role,
          data: { timestamp: new Date().toISOString() }
        };
        
        this.broadcastToRoom(roomId, leaveMessage, peerId);
        console.log(`${peer.name} left room ${roomId}`);
      }
      
      this.peers.delete(peerId);
      
      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  // Send signaling message
  sendMessage(message: SignalingMessage): void {
    // In demo mode, simulate message delivery with a small delay
    setTimeout(() => {
      this.deliverMessage(message);
    }, 50);
  }

  // Register message handler for a peer
  setMessageHandler(peerId: string, handler: (message: SignalingMessage) => void): void {
    this.messageHandlers.set(peerId, handler);
  }

  // Remove message handler
  removeMessageHandler(peerId: string): void {
    this.messageHandlers.delete(peerId);
  }

  // Private method to deliver message
  private deliverMessage(message: SignalingMessage): void {
    const room = this.rooms.get(message.roomId);
    if (!room) return;

    // Deliver to specific peer or broadcast to room
    if (message.type === 'offer' || message.type === 'answer' || message.type === 'ice-candidate') {
      // These are typically peer-to-peer messages
      // In a real implementation, you'd have target peer ID
      this.broadcastToRoom(message.roomId, message, message.peerId);
    } else {
      // Broadcast to all peers in room except sender
      this.broadcastToRoom(message.roomId, message, message.peerId);
    }
  }

  // Broadcast message to all peers in room except sender
  private broadcastToRoom(roomId: string, message: SignalingMessage, excludePeerId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(peerId => {
      if (peerId !== excludePeerId) {
        const handler = this.messageHandlers.get(peerId);
        if (handler) {
          handler(message);
        }
      }
    });
  }

  // Get room participants
  getRoomParticipants(roomId: string): Array<{ id: string; name: string; role: 'teacher' | 'student' }> {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room).map(peerId => {
      const peer = this.peers.get(peerId);
      return {
        id: peerId,
        name: peer?.name || 'Unknown',
        role: peer?.role || 'student'
      };
    });
  }

  // Simulate student joining (for demo purposes)
  simulateStudentJoin(roomId: string): void {
    const studentNames = [
      'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 
      'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Taylor'
    ];
    
    const randomName = studentNames[Math.floor(Math.random() * studentNames.length)];
    const studentId = 'student_' + Math.random().toString(36).substr(2, 9);
    
    // Simulate join with delay
    setTimeout(() => {
      this.joinRoom(roomId, studentId, randomName, 'student');
      
      // Simulate some chat messages
      setTimeout(() => {
        this.sendMessage({
          type: 'chat',
          roomId,
          peerId: studentId,
          peerName: randomName,
          peerRole: 'student',
          data: {
            message: `Hello! I'm ${randomName}. Looking forward to today's lesson!`,
            timestamp: new Date().toISOString()
          }
        });
      }, 2000);
    }, Math.random() * 5000); // Random delay between 0-5 seconds
  }

  // Start demo simulation
  startDemoSimulation(roomId: string): void {
    console.log('Starting demo simulation for room:', roomId);
    
    // Simulate 2-3 students joining over time
    const numStudents = Math.floor(Math.random() * 2) + 2; // 2-3 students
    
    for (let i = 0; i < numStudents; i++) {
      setTimeout(() => {
        this.simulateStudentJoin(roomId);
      }, i * 3000); // Stagger joins by 3 seconds
    }
  }
}

// Export singleton instance
export const signalingService = SignalingService.getInstance();