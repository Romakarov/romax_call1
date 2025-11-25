import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useChats, DEMO_USERS } from '@/context/ChatContext';
import { RootStackParamList } from '@/navigation/types';
import { User } from '@/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const initial = user.username.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

function SelectedUserBadge({ user, onRemove }: { user: User; onRemove: () => void }) {
  return (
    <View style={styles.selectedBadge}>
      <Text style={styles.selectedBadgeText}>{user.username}</Text>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Feather name="x" size={16} color={Colors.light.accent} />
      </Pressable>
    </View>
  );
}

function UserSelectItem({ user, isSelected, onToggle }: { user: User; isSelected: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.userItem, pressed && { opacity: 0.7 }]}
      onPress={onToggle}
    >
      <Avatar user={user} />
      <Text style={styles.username}>{user.username}</Text>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected ? (
          <Feather name="check" size={14} color="#FFFFFF" />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function CreateGroupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { createGroupChat } = useChats();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return DEMO_USERS;
    }
    const query = searchQuery.toLowerCase().replace('@', '');
    return DEMO_USERS.filter(user =>
      user.username.toLowerCase().replace('@', '').includes(query)
    );
  }, [searchQuery]);

  const toggleUser = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      }
      if (prev.length >= 30) {
        return prev;
      }
      return [...prev, user];
    });
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleCreate = () => {
    if (!title.trim() || selectedUsers.length === 0) return;
    
    const chat = createGroupChat(title.trim(), description.trim(), selectedUsers);
    navigation.replace('Chat', { chatId: chat.id, title: title.trim() });
  };

  const isValid = title.trim().length > 0 && selectedUsers.length > 0;

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleCreate}
          disabled={!isValid}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.createButtonText, !isValid && styles.createButtonTextDisabled]}>
            Создать
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, isValid, title, selectedUsers]);

  const renderUser = ({ item }: { item: User }) => (
    <UserSelectItem
      user={item}
      isSelected={selectedUsers.some(u => u.id === item.id)}
      onToggle={() => toggleUser(item)}
    />
  );

  const ScrollComponent = Platform.OS === 'web' ? ScrollView : KeyboardAwareScrollView;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollComponent contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Название группы</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Введите название"
            placeholderTextColor={Colors.light.textSecondary}
            maxLength={50}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Описание (необязательно)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Описание группы"
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={200}
          />
        </View>

        {selectedUsers.length > 0 ? (
          <View style={styles.selectedSection}>
            <Text style={styles.label}>Участники ({selectedUsers.length}/30)</Text>
            <View style={styles.selectedList}>
              {selectedUsers.map(user => (
                <SelectedUserBadge
                  key={user.id}
                  user={user}
                  onRemove={() => removeUser(user.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.searchSection}>
          <Text style={styles.label}>Добавить участников</Text>
          <View style={styles.searchInputWrapper}>
            <Feather name="search" size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Поиск по username"
              placeholderTextColor={Colors.light.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollComponent>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
        style={styles.usersListContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.small,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    ...Typography.body,
    color: Colors.light.text,
  },
  inputMultiline: {
    height: 80,
    paddingVertical: Spacing.md,
    textAlignVertical: 'top',
  },
  selectedSection: {
    marginBottom: Spacing.lg,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accentLight,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  selectedBadgeText: {
    ...Typography.small,
    color: Colors.light.accent,
  },
  searchSection: {
    marginBottom: Spacing.md,
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
  usersListContainer: {
    flex: 1,
  },
  usersList: {
    paddingHorizontal: Spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
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
  username: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    marginLeft: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  createButtonText: {
    ...Typography.body,
    color: Colors.light.accent,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    opacity: 0.5,
  },
});
