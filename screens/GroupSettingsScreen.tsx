import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useChats } from '@/context/ChatContext';
import { RootStackParamList } from '@/navigation/types';
import { User } from '@/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ScreenScrollView } from '@/components/ScreenScrollView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type GroupSettingsRouteProp = RouteProp<RootStackParamList, 'GroupSettings'>;

function Avatar({ user, size = 48 }: { user: User; size?: number }) {
  const initial = user.username.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

function GroupAvatar({ size = 80 }: { size?: number }) {
  return (
    <View style={[styles.groupAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Feather name="users" size={size * 0.4} color={Colors.light.accent} />
    </View>
  );
}

function ParticipantItem({ user, onPress }: { user: User; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.participantItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Avatar user={user} size={44} />
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{user.username}</Text>
        <Text style={styles.participantStatus}>
          {user.isOnline ? 'онлайн' : 'был(а) недавно'}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
    </Pressable>
  );
}

export default function GroupSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroupSettingsRouteProp>();
  const { chatId } = route.params;
  const { getChat, leaveGroup } = useChats();

  const chat = getChat(chatId);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleLeaveGroup = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveGroup = () => {
    setShowLeaveConfirm(false);
    leaveGroup(chatId);
    navigation.popToTop();
  };

  const handleParticipantPress = (user: User) => {
    navigation.navigate('UserProfile', { user });
  };

  const handleStartRoom = () => {
    navigation.navigate('Room', { roomId: `room_${chatId}`, title: chat?.title || 'Комната' });
  };

  if (!chat) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Группа не найдена</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <GroupAvatar />
          <Text style={styles.groupTitle}>{chat.title}</Text>
          {chat.description ? (
            <Text style={styles.groupDescription}>{chat.description}</Text>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
          onPress={handleStartRoom}
        >
          <View style={styles.actionIcon}>
            <Feather name="video" size={20} color={Colors.light.accent} />
          </View>
          <Text style={styles.actionText}>Начать групповой звонок</Text>
          <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Участники ({chat.participants.length})
          </Text>
          {chat.participants.map((participant) => (
            <ParticipantItem
              key={participant.id}
              user={participant}
              onPress={() => handleParticipantPress(participant)}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.leaveButton, pressed && { opacity: 0.7 }]}
          onPress={handleLeaveGroup}
        >
          <Feather name="log-out" size={20} color={Colors.light.error} />
          <Text style={styles.leaveButtonText}>Покинуть группу</Text>
        </Pressable>
      </ScreenScrollView>

      <Modal
        visible={showLeaveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Покинуть группу?</Text>
            <Text style={styles.modalMessage}>
              Вы уверены, что хотите покинуть группу "{chat.title}"?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLeaveConfirm(false)}
              >
                <Text style={styles.modalButtonCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLeaveGroup}
              >
                <Text style={styles.modalButtonConfirmText}>Покинуть</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  groupAvatar: {
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  groupTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  groupDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionText: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  avatar: {
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  participantName: {
    ...Typography.body,
    color: Colors.light.text,
  },
  participantStatus: {
    ...Typography.small,
    color: Colors.light.textSecondary,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing['2xl'],
    gap: Spacing.sm,
  },
  leaveButtonText: {
    ...Typography.body,
    color: Colors.light.error,
    fontWeight: '500',
  },
  errorText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.light.backgroundRoot,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.light.backgroundDefault,
  },
  modalButtonCancelText: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '500',
  },
  modalButtonConfirm: {
    backgroundColor: Colors.light.error,
  },
  modalButtonConfirmText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
