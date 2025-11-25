import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, Message, User } from '@/types';
import { useAuth } from './AuthContext';
import { apiClient } from '@/api/client';
import { sendLocalNotification } from '@/hooks/useNotifications';
import { Socket } from 'socket.io-client';
import { useSocket, useChatSocket } from '@/hooks/useSocket';

interface ChatContextType {
  chats: Chat[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  getChat: (chatId: string) => Chat | undefined;
  getChatMessages: (chatId: string) => Message[];
  sendMessage: (chatId: string, text: string) => void;
  sendImageMessage: (chatId: string, imageUri: string) => void;
  editMessage: (chatId: string, messageId: string, newText: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  createPrivateChat: (otherUser: User) => Promise<Chat>;
  createGroupChat: (title: string, description: string, participants: User[]) => Promise<Chat>;
  markAsRead: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  leaveGroup: (chatId: string) => void;
  searchMessages: (chatId: string, query: string) => Message[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHATS_STORAGE_KEY = '@securechat_chats';
const MESSAGES_STORAGE_KEY = '@securechat_messages';

export const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'alice@example.com',
    username: '@alice',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
  },
  {
    id: '2',
    email: 'bob@example.com',
    username: '@bob',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: false,
  },
  {
    id: '3',
    email: 'charlie@example.com',
    username: '@charlie',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
  },
  {
    id: '4',
    email: 'diana@example.com',
    username: '@diana',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: false,
  },
  {
    id: '5',
    email: 'eve@example.com',
    username: '@eve',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
  },
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load chats from API on mount and when user changes
  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setMessages({});
      setIsLoading(false);
    }
  }, [user?.id]);

  // Listen for incoming messages via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('message:received', (data: any) => {
      setMessages(prev => {
        const chatMessages = prev[data.chatId] || [];
        const newMessage: Message = {
          id: String(data.id || Date.now()),
          chatId: String(data.chatId),
          senderId: String(data.senderId),
          text: data.text,
          imageUri: data.imageUri,
          type: data.type || 'text',
          createdAt: data.timestamp || new Date().toISOString(),
          isRead: false,
        };
        return {
          ...prev,
          [data.chatId]: [...chatMessages, newMessage],
        };
      });

      // Show notification
      sendLocalNotification(
        data.senderName,
        data.text || 'Отправил изображение',
        { chatId: data.chatId }
      );
    });

    return () => {
      socket.off('message:received');
    };
  }, [socket]);

  const loadChats = async () => {
    try {
      const chatsData = await apiClient.getChats();
      const normalizedChats = chatsData.map((chat: any) => ({
        ...chat,
        id: String(chat.id),
        participants: (chat.participants || []).map((p: any) => ({
          id: String(p.id),
          email: p.email,
          username: p.username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOnline: false,
        })),
      }));
      setChats(normalizedChats);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const messagesData = await apiClient.getMessages(chatId);
      const normalizedMessages = messagesData.map((msg: any) => ({
        ...msg,
        id: String(msg.id),
        chatId: String(msg.chat_id || chatId),
        senderId: String(msg.sender_id),
        createdAt: msg.created_at,
      }));
      setMessages(prev => ({
        ...prev,
        [chatId]: normalizedMessages,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const getChat = useCallback((chatId: string): Chat | undefined => {
    return chats.find(c => String(c.id) === String(chatId));
  }, [chats]);

  const getChatMessages = useCallback((chatId: string): Message[] => {
    if (!messages[chatId]) {
      loadChatMessages(chatId);
      return [];
    }
    return messages[chatId];
  }, [messages]);

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (!text.trim() || !user) return;

    try {
      const message = await apiClient.sendMessage(chatId, text);
      const normalizedMessage: Message = {
        ...message,
        id: String(message.id),
        chatId: String(message.chat_id || chatId),
        senderId: String(message.sender_id),
        createdAt: message.created_at,
      };

      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), normalizedMessage],
      }));

      // Emit via socket for real-time delivery
      socket?.emit('message:send', {
        chatId,
        text,
        senderId: user.id,
        senderName: user.username,
      });

      setChats(prev =>
        prev.map(chat => {
          if (String(chat.id) === String(chatId)) {
            return {
              ...chat,
              lastMessage: normalizedMessage,
              updatedAt: new Date().toISOString(),
            };
          }
          return chat;
        })
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [user, socket]);

  const sendImageMessage = useCallback(async (chatId: string, imageUri: string) => {
    if (!imageUri || !user) return;

    try {
      const message = await apiClient.sendMessage(chatId, undefined, imageUri);
      const normalizedMessage: Message = {
        ...message,
        id: String(message.id),
        chatId: String(message.chat_id || chatId),
        senderId: String(message.sender_id),
        type: 'image',
        createdAt: message.created_at,
      };

      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), normalizedMessage],
      }));

      socket?.emit('message:send', {
        chatId,
        text: 'Отправил изображение',
        imageUri,
        senderId: user.id,
        senderName: user.username,
      });
    } catch (error) {
      console.error('Failed to send image:', error);
    }
  }, [user, socket]);

  const editMessage = useCallback(async (chatId: string, messageId: string, newText: string) => {
    if (!newText.trim()) return;

    try {
      await apiClient.editMessage(Number(messageId), newText);

      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(msg => {
          if (String(msg.id) === String(messageId)) {
            return {
              ...msg,
              text: newText,
              editedAt: new Date().toISOString(),
            };
          }
          return msg;
        }),
      }));
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  }, []);

  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    try {
      await apiClient.deleteMessage(Number(messageId));

      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(msg => {
          if (String(msg.id) === String(messageId)) {
            return {
              ...msg,
              text: 'Сообщение удалено',
              isDeleted: true,
              imageUri: undefined,
            };
          }
          return msg;
        }),
      }));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, []);

  const searchMessages = useCallback((chatId: string, query: string): Message[] => {
    if (!query.trim()) return [];
    const chatMessages = messages[chatId] || [];
    const lowerQuery = query.toLowerCase();
    return chatMessages.filter(
      msg => !msg.isDeleted && msg.text?.toLowerCase().includes(lowerQuery)
    );
  }, [messages]);

  const createPrivateChat = useCallback(async (otherUser: User): Promise<Chat> => {
    try {
      const result = await apiClient.createPrivateChat(Number(otherUser.id));
      const newChat: Chat = {
        id: String(result.id),
        type: 'private',
        participants: [
          {
            id: String(otherUser.id),
            email: otherUser.email,
            username: otherUser.username,
            createdAt: otherUser.createdAt,
            updatedAt: otherUser.updatedAt,
            isOnline: false,
          },
        ],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (error) {
      console.error('Failed to create private chat:', error);
      throw error;
    }
  }, []);

  const createGroupChat = useCallback(
    async (title: string, description: string, participants: User[]): Promise<Chat> => {
      try {
        const result = await apiClient.createGroupChat(
          title,
          description,
          participants.map(p => Number(p.id))
        );

        const newChat: Chat = {
          id: String(result.id),
          type: 'group',
          title,
          description,
          participants: participants.map(p => ({
            ...p,
            id: String(p.id),
          })),
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setChats(prev => [newChat, ...prev]);
        return newChat;
      } catch (error) {
        console.error('Failed to create group chat:', error);
        throw error;
      }
    },
    []
  );

  const markAsRead = useCallback((chatId: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg => ({ ...msg, isRead: true })),
    }));
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => String(c.id) !== String(chatId)));
    setMessages(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
  }, []);

  const leaveGroup = useCallback((chatId: string) => {
    deleteChat(chatId);
  }, [deleteChat]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        messages,
        isLoading,
        getChat,
        getChatMessages,
        sendMessage,
        sendImageMessage,
        editMessage,
        deleteMessage,
        createPrivateChat,
        createGroupChat,
        markAsRead,
        deleteChat,
        leaveGroup,
        searchMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatProvider');
  }
  return context;
}
