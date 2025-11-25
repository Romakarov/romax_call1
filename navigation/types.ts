import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chat, User } from '@/types';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Chat: { chatId: string; title: string };
  CreateGroup: undefined;
  GroupSettings: { chatId: string };
  UserProfile: { user: User };
  AudioCall: { recipientId: string; username: string; incoming?: boolean };
  VideoCall: { recipientId: string; username: string; incoming?: boolean };
  Room: { roomId: string; title: string };
  CreateRoom: undefined;
};

export type MainTabParamList = {
  ChatsTab: undefined;
  SearchTab: undefined;
  SettingsTab: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;
