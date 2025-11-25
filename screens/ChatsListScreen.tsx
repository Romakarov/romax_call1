import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useChats } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import { Chat, User } from '@/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function Avatar({ user, size = 48 }: { user?: User; size?: number }) {
  const initial = user?.username?.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

function GroupAvatar({ participants, size = 48 }: { participants: User[]; size?: number }) {
  return (
    <View style={[styles.groupAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Feather name="users" size={size * 0.5} color={Colors.light.accent} />
    </View>
  );
}

function OnlineIndicator({ isOnline }: { isOnline?: boolean }) {
  if (!isOnline) return null;
  return <View style={styles.onlineIndicator} />;
}

function ChatItem({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  const isGroup = chat.type === 'group';
  const otherUser = !isGroup ? chat.participants[0] : null;
  const title = isGroup ? chat.title : otherUser?.username;
  const lastMessageText = chat.lastMessage?.text || 'Нет сообщений';
  const hasUnread = chat.unreadCount > 0;

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.chatItem, pressed && styles.chatItemPressed]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        {isGroup ? (
          <GroupAvatar participants={chat.participants} />
        ) : (
          <>
            <Avatar user={otherUser || undefined} />
            <OnlineIndicator isOnline={otherUser?.isOnline} />
          </>
        )}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, hasUnread && styles.chatTitleUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.chatTime}>{formatTime(chat.lastMessage?.createdAt)}</Text>
        </View>
        <View style={styles.chatPreview}>
          <Text style={[styles.chatMessage, hasUnread && styles.chatMessageUnread]} numberOfLines={1}>
            {lastMessageText}
          </Text>
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function ChatsListScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { chats, isLoading } = useChats();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleChatPress = (chat: Chat) => {
    const title = chat.type === 'group' ? chat.title || 'Группа' : chat.participants[0]?.username || 'Чат';
    navigation.navigate('Chat', { chatId: chat.id, title });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const renderItem = ({ item }: { item: Chat }) => (
    <ChatItem chat={item} onPress={() => handleChatPress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={64} color={Colors.light.border} />
      <Text style={styles.emptyTitle}>Нет чатов</Text>
      <Text style={styles.emptyText}>
        Найдите пользователей во вкладке "Поиск" чтобы начать общение
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чаты</Text>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
          onPress={handleCreateGroup}
        >
          <Feather name="users" size={24} color={Colors.light.accent} />
        </Pressable>
      </View>

      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.lg },
          chats.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.light.text,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  chatItemPressed: {
    opacity: 0.7,
  },
  avatarContainer: {
    position: 'relative',
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
  groupAvatar: {
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.online,
    borderWidth: 2,
    borderColor: Colors.light.backgroundRoot,
  },
  chatContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  chatTitle: {
    ...Typography.body,
    color: Colors.light.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatTitleUnread: {
    fontWeight: '600',
  },
  chatTime: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    ...Typography.small,
    color: Colors.light.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatMessageUnread: {
    color: Colors.light.text,
  },
  unreadBadge: {
    backgroundColor: Colors.light.accent,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.light.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
