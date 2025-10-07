export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'file' | 'poll';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    pollQuestion?: string;
    pollOptions?: string[];
    pollResults?: { [key: string]: number };
  };
}

export interface ChatUser {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isOnline: boolean;
  joinedAt: Date;
}

export class ChatService {
  private ws: WebSocket | null = null;
  private roomId: string = '';
  private userId: string = '';
  private userName: string = '';
  private userRole: 'teacher' | 'student' = 'student';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  // Event callbacks
  private onMessageCallback?: (message: ChatMessage) => void;
  private onUserJoinedCallback?: (user: ChatUser) => void;
  private onUserLeftCallback?: (userId: string) => void;
  private onConnectionStateCallback?: (connected: boolean) => void;
  private onTypingCallback?: (userId: string, isTyping: boolean) => void;

  constructor(
    roomId: string,
    userId: string,
    userName: string,
    userRole: 'teacher' | 'student'
  ) {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.userRole = userRole;
  }

  // Connect to WebSocket server
  connect(wsUrl: string = 'ws://localhost:8080'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${wsUrl}/chat/${this.roomId}`);

        this.ws.onopen = () => {
          console.log('Chat WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Send join message
          this.sendMessage({
            type: 'join',
            userId: this.userId,
            userName: this.userName,
            userRole: this.userRole,
            roomId: this.roomId,
          });

          if (this.onConnectionStateCallback) {
            this.onConnectionStateCallback(true);
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Chat WebSocket disconnected');
          if (this.onConnectionStateCallback) {
            this.onConnectionStateCallback(false);
          }
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Chat WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Handle incoming messages
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'message':
        if (this.onMessageCallback) {
          const message: ChatMessage = {
            id: data.id || this.generateId(),
            userId: data.userId,
            userName: data.userName,
            userRole: data.userRole,
            message: data.message,
            timestamp: new Date(data.timestamp),
            type: data.messageType || 'text',
            metadata: data.metadata,
          };
          this.onMessageCallback(message);
        }
        break;

      case 'user_joined':
        if (this.onUserJoinedCallback) {
          const user: ChatUser = {
            id: data.userId,
            name: data.userName,
            role: data.userRole,
            isOnline: true,
            joinedAt: new Date(data.timestamp),
          };
          this.onUserJoinedCallback(user);
        }
        break;

      case 'user_left':
        if (this.onUserLeftCallback) {
          this.onUserLeftCallback(data.userId);
        }
        break;

      case 'typing':
        if (this.onTypingCallback) {
          this.onTypingCallback(data.userId, data.isTyping);
        }
        break;

      case 'system':
        if (this.onMessageCallback) {
          const systemMessage: ChatMessage = {
            id: this.generateId(),
            userId: 'system',
            userName: 'System',
            userRole: 'teacher',
            message: data.message,
            timestamp: new Date(),
            type: 'system',
          };
          this.onMessageCallback(systemMessage);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Send text message
  sendTextMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const messageData = {
      type: 'message',
      messageType: 'text',
      userId: this.userId,
      userName: this.userName,
      userRole: this.userRole,
      roomId: this.roomId,
      message: message,
      timestamp: new Date().toISOString(),
    };

    this.sendMessage(messageData);
  }

  // Send file message
  sendFileMessage(file: File): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Convert file to base64 for transmission
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      
      const messageData = {
        type: 'message',
        messageType: 'file',
        userId: this.userId,
        userName: this.userName,
        userRole: this.userRole,
        roomId: this.roomId,
        message: `Shared a file: ${file.name}`,
        timestamp: new Date().toISOString(),
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileData: base64Data,
        },
      };

      this.sendMessage(messageData);
    };
    
    reader.readAsDataURL(file);
  }

  // Send poll
  sendPoll(question: string, options: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const messageData = {
      type: 'message',
      messageType: 'poll',
      userId: this.userId,
      userName: this.userName,
      userRole: this.userRole,
      roomId: this.roomId,
      message: `Created a poll: ${question}`,
      timestamp: new Date().toISOString(),
      metadata: {
        pollQuestion: question,
        pollOptions: options,
        pollResults: options.reduce((acc, option) => {
          acc[option] = 0;
          return acc;
        }, {} as { [key: string]: number }),
      },
    };

    this.sendMessage(messageData);
  }

  // Vote on poll
  votePoll(messageId: string, option: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const voteData = {
      type: 'poll_vote',
      messageId: messageId,
      userId: this.userId,
      option: option,
      roomId: this.roomId,
    };

    this.sendMessage(voteData);
  }

  // Send typing indicator
  sendTyping(isTyping: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const typingData = {
      type: 'typing',
      userId: this.userId,
      userName: this.userName,
      roomId: this.roomId,
      isTyping: isTyping,
    };

    this.sendMessage(typingData);
  }

  // Private message send
  private sendMessage(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Reconnection failed, will try again
      });
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
  }

  // Event listeners
  onMessage(callback: (message: ChatMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onUserJoined(callback: (user: ChatUser) => void): void {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback: (userId: string) => void): void {
    this.onUserLeftCallback = callback;
  }

  onConnectionState(callback: (connected: boolean) => void): void {
    this.onConnectionStateCallback = callback;
  }

  onTyping(callback: (userId: string, isTyping: boolean) => void): void {
    this.onTypingCallback = callback;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get connection state
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      // Send leave message
      this.sendMessage({
        type: 'leave',
        userId: this.userId,
        roomId: this.roomId,
      });

      this.ws.close();
      this.ws = null;
    }
  }

  // Clear chat (teacher only)
  clearChat(): void {
    if (this.userRole !== 'teacher') {
      console.error('Only teachers can clear chat');
      return;
    }

    const clearData = {
      type: 'clear_chat',
      userId: this.userId,
      roomId: this.roomId,
    };

    this.sendMessage(clearData);
  }

  // Mute user (teacher only)
  muteUser(targetUserId: string, mute: boolean): void {
    if (this.userRole !== 'teacher') {
      console.error('Only teachers can mute users');
      return;
    }

    const muteData = {
      type: 'mute_user',
      userId: this.userId,
      targetUserId: targetUserId,
      mute: mute,
      roomId: this.roomId,
    };

    this.sendMessage(muteData);
  }
}