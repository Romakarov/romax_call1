import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Подключаемся к Socket.io серверу
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Уведомляем сервер, что пользователь онлайн
    socketRef.current.emit('user:online', user.id);

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current?.emit('user:online', user.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  return socketRef.current;
}

export function useChatSocket(chatId: string) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit('chat:join', chatId);

    return () => {
      socket.emit('chat:leave', chatId);
    };
  }, [socket, chatId]);

  return socket;
}
