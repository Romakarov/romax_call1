import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useChats } from '@/context/ChatContext';
import { RootStackParamList } from '@/navigation/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ScreenScrollView } from '@/components/ScreenScrollView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

function Avatar({ username, size = 100 }: { username: string; size?: number }) {
  const initial = username.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initial}</Text>
    </View>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <Feather name={icon} size={22} color={Colors.light.accent} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { user } = route.params;
  const { createPrivateChat } = useChats();

  const handleMessage = async () => {
    const chat = await createPrivateChat(user);
    navigation.replace('Chat', { chatId: chat.id, title: user.username });
  };

  const handleAudioCall = () => {
    navigation.navigate('AudioCall', {
      recipientId: String(user.id),
      username: user.username,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate('VideoCall', {
      recipientId: String(user.id),
      username: user.username,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScreenScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <View style={styles.header}>
        <Avatar username={user.username} />
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.status}>
          {user.isOnline ? 'онлайн' : 'был(а) недавно'}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          icon="message-circle"
          label="Сообщение"
          onPress={handleMessage}
        />
        <ActionButton
          icon="phone"
          label="Звонок"
          onPress={handleAudioCall}
        />
        <ActionButton
          icon="video"
          label="Видео"
          onPress={handleVideoCall}
        />
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Зарегистрирован</Text>
          <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundRoot,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  avatar: {
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: Colors.light.accent,
    fontWeight: '600',
  },
  username: {
    ...Typography.h3,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  status: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['3xl'],
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.small,
    color: Colors.light.text,
  },
  infoSection: {
    paddingTop: Spacing.xl,
  },
  infoItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  infoLabel: {
    ...Typography.small,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.light.text,
  },
});
