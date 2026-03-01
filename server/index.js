import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import teacherRoutes from './routes/teacher.js';
import adminRoutes from './routes/admin.js';
import virtualClassroomRoutes from './routes/virtual-classroom.js';

config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/virtual-classroom', virtualClassroomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TeachWave API is running' });
});

// WebSocket for real-time communication
const rooms = new Map(); // roomId -> Set of socket IDs
const userSockets = new Map(); // socketId -> user info

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a virtual classroom
  socket.on('join-room', ({ roomId, userId, userName, userRole }) => {
    socket.join(roomId);
    
    // Store user info
    userSockets.set(socket.id, { roomId, userId, userName, userRole });
    
    // Track room participants
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId,
      userName,
      userRole
    });

    // Send current participants to the new user
    const participants = Array.from(rooms.get(roomId))
      .filter(sid => sid !== socket.id)
      .map(sid => {
        const user = userSockets.get(sid);
        return { socketId: sid, ...user };
      });

    socket.emit('room-participants', participants);

    console.log(`${userName} (${userRole}) joined room ${roomId}`);
  });

  // WebRTC signaling
  socket.on('offer', ({ roomId, targetSocketId, offer }) => {
    socket.to(targetSocketId).emit('offer', {
      socketId: socket.id,
      offer
    });
  });

  socket.on('answer', ({ targetSocketId, answer }) => {
    socket.to(targetSocketId).emit('answer', {
      socketId: socket.id,
      answer
    });
  });

  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    socket.to(targetSocketId).emit('ice-candidate', {
      socketId: socket.id,
      candidate
    });
  });

  // Chat messages
  socket.on('chat-message', ({ roomId, message, userName, userRole }) => {
    io.to(roomId).emit('chat-message', {
      id: Date.now().toString(),
      userId: userSockets.get(socket.id)?.userId,
      userName,
      userRole,
      message,
      timestamp: new Date(),
      type: 'text'
    });
  });

  // Typing indicator
  socket.on('typing', ({ roomId, isTyping }) => {
    const user = userSockets.get(socket.id);
    if (user) {
      socket.to(roomId).emit('user-typing', {
        userId: user.userId,
        userName: user.userName,
        isTyping
      });
    }
  });

  // Media state changes (mute/unmute, video on/off)
  socket.on('media-state-change', ({ roomId, isVideoEnabled, isAudioEnabled }) => {
    socket.to(roomId).emit('peer-media-state-change', {
      socketId: socket.id,
      isVideoEnabled,
      isAudioEnabled
    });
  });

  // Screen sharing
  socket.on('screen-share-start', ({ roomId }) => {
    socket.to(roomId).emit('peer-screen-share-start', {
      socketId: socket.id
    });
  });

  socket.on('screen-share-stop', ({ roomId }) => {
    socket.to(roomId).emit('peer-screen-share-stop', {
      socketId: socket.id
    });
  });

  // Recording notifications
  socket.on('recording-state-change', ({ roomId, isRecording }) => {
    io.to(roomId).emit('recording-state-changed', { isRecording });
  });

  // Leave room
  socket.on('leave-room', () => {
    handleDisconnect(socket);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    handleDisconnect(socket);
  });

  function handleDisconnect(socket) {
    const user = userSockets.get(socket.id);
    if (user) {
      const { roomId } = user;
      
      // Remove from room
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        }
      }

      // Notify others
      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        userId: user.userId,
        userName: user.userName
      });

      userSockets.delete(socket.id);
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for virtual classrooms`);
});
