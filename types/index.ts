export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
  type: 'text' | 'system' | 'image';
  editedAt?: string;
  isDeleted?: boolean;
  imageUri?: string;
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
  description?: string;
}

export interface Group {
  id: string;
  title: string;
  description?: string;
  participants: User[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallSession {
  id: string;
  type: 'audio' | 'video';
  callerId: string;
  callerName: string;
  recipientId: string;
  recipientName: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  startedAt?: string;
  endedAt?: string;
}

export interface Room {
  id: string;
  title: string;
  participants: RoomParticipant[];
  createdBy: string;
  createdAt: string;
  maxParticipants: number;
}

export interface RoomParticipant {
  userId: string;
  username: string;
  isMuted: boolean;
  isVideoOn: boolean;
  joinedAt: string;
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy?: string;
  isUsed: boolean;
  isSingleUse: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  inviteCode: string;
}
