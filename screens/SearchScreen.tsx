import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useChats, DEMO_USERS } from '@/context/ChatContext';
import { RootStackParamList } from '@/navigation/types';
import { User } from '@/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function Avatar({ user, size = 48 }: { user: User; size?: number }) {
  const initial = user.username.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

function OnlineIndicator({ isOnline }: { isOnline?: boolean }) {
  if (!isOnline) return null;
  return <View style={styles.onlineIndicator} />;
}

function UserItem({ user, onMessagePress }: { user: User; onMessagePress: () => void }) {
  return (
    <View style={styles.userItem}>
      <View style={styles.userAvatarContainer}>
        <Avatar user={user} />
        <OnlineIndicator isOnline={user.isOnline} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.userStatus}>
          {user.isOnline ? 'онлайн' : 'был(а) недавно'}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.messageButton, pressed && { opacity: 0.7 }]}
        onPress={onMessagePress}
      >
        <Text style={styles.messageButtonText}>Написать</Text>
      </Pressable>
    </View>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { createPrivateChat } = useChats();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return DEMO_USERS;
    }
    const query = searchQuery.toLowerCase().replace('@', '');
    return DEMO_USERS.filter((user: User) =>
      user.username.toLowerCase().replace('@', '').includes(query)
    );
  }, [searchQuery]);

  const handleMessagePress = async (user: User) => {
    try {
      const chat = await createPrivateChat(user);
      navigation.navigate('Chat', { chatId: chat.id, title: user.username });
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <UserItem user={item} onMessagePress={() => handleMessagePress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="search" size={64} color={Colors.light.border} />
      <Text style={styles.emptyTitle}>Пользователи не найдены</Text>
      <Text style={styles.emptyText}>
        Попробуйте изменить запрос поиска
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Поиск</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={20} color={Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск по username (@nickname)"
            placeholderTextColor={Colors.light.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={20} color={Colors.light.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.lg },
          filteredUsers.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.light.text,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  userAvatarContainer: {
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
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  username: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '500',
  },
  userStatus: {
    ...Typography.small,
    color: Colors.light.textSecondary,
  },
  messageButton: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
  },
  messageButtonText: {
    ...Typography.small,
    color: '#FFFFFF',
    fontWeight: '500',
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
