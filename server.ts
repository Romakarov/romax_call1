import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkConnection } from './server/db';

import authRoutes from './server/routes/auth';
import chatsRoutes from './server/routes/chats';
import messagesRoutes from './server/routes/messages';
import usersRoutes from './server/routes/users';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io - хранилище активных пользователей и вызовов
const activeUsers: Map<number, string> = new Map(); // userId -> socketId
const activeCalls: Map<string, { callerId: number; recipientId: number; type: 'audio' | 'video' }> = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('user:online', (userId: number) => {
    activeUsers.set(userId, socket.id);
    console.log(`User ${userId} online`);
    io.emit('users:active', Array.from(activeUsers.keys()));
  });

  socket.on('message:send', (data: { chatId: string; text: string; senderId: number; senderName: string }) => {
    io.to(`chat:${data.chatId}`).emit('message:received', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('chat:join', (chatId: string) => {
    socket.join(`chat:${chatId}`);
    console.log(`User joined chat:${chatId}`);
  });

  socket.on('chat:leave', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  // Call events
  socket.on('call:initiate', (data: { callId: string; callerId: number; callerName: string; recipientId: number | string; type: 'audio' | 'video' }) => {
    const recipientSocketId = activeUsers.get(Number(data.recipientId));
    if (recipientSocketId) {
      activeCalls.set(data.callId, { callerId: data.callerId, recipientId: Number(data.recipientId), type: data.type });
      io.to(recipientSocketId).emit('call:incoming', {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        type: data.type,
      });
      console.log(`Call initiated from ${data.callerId} to ${data.recipientId}`);
    } else {
      io.to(socket.id).emit('call:user-offline', { callId: data.callId });
    }
  });

  socket.on('call:accept', (data: { callId: string; recipientId: number }) => {
    const callerSocketId = activeUsers.get(data.recipientId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:accepted', { callId: data.callId });
      io.to(socket.id).emit('call:accepted', { callId: data.callId });
    }
  });

  socket.on('call:reject', (data: { callId: string; recipientId: number }) => {
    const callerSocketId = activeUsers.get(data.recipientId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call:rejected', { callId: data.callId });
    }
    activeCalls.delete(data.callId);
  });

  socket.on('call:end', (data: { callId: string; recipientId: number }) => {
    const recipientSocketId = activeUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('call:ended', { callId: data.callId });
    }
    activeCalls.delete(data.callId);
  });

  socket.on('call:signal', (data: { type: string; callId: string; from: number; to: number; data: any }) => {
    const toSocketId = activeUsers.get(data.to);
    if (toSocketId) {
      io.to(toSocketId).emit(`call:${data.type}`, {
        callId: data.callId,
        from: data.from,
        data: data.data,
      });
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
    io.emit('users:active', Array.from(activeUsers.keys()));
    console.log('User disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Запуск сервера
async function start() {
  try {
    const connected = await checkConnection();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on 0.0.0.0:${PORT}`);
      console.log(`✓ API: http://0.0.0.0:${PORT}/api`);
      console.log(`✓ WebSocket: ws://0.0.0.0:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { io };
