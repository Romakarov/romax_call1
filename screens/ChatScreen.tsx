import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useChats } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import { Message } from '@/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  onLongPress: () => void;
}

function MessageBubble({ message, isOwn, senderName, onLongPress }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const isDeleted = message.isDeleted;
  const isEdited = !!message.editedAt && !isDeleted;
  const isImage = message.type === 'image' && message.imageUri && !isDeleted;

  return (
    <Pressable
      onLongPress={() => {
        if (!isDeleted && isOwn) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress();
        }
      }}
      delayLongPress={300}
    >
      <View style={[styles.messageContainer, isOwn ? styles.messageContainerOwn : styles.messageContainerOther]}>
        {!isOwn && senderName ? (
          <Text style={styles.senderName}>{senderName}</Text>
        ) : null}
        <View style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          isDeleted && styles.messageBubbleDeleted,
        ]}>
          {isImage ? (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.messageImage}
              contentFit="cover"
            />
          ) : (
            <Text style={[
              styles.messageText,
              isOwn ? styles.messageTextOwn : styles.messageTextOther,
              isDeleted && styles.messageTextDeleted,
            ]}>
              {message.text}
            </Text>
          )}
        </View>
        <View style={[styles.messageFooter, isOwn && styles.messageFooterOwn]}>
          {isEdited ? (
            <Text style={styles.editedLabel}>ред.</Text>
          ) : null}
          <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
          {isOwn && !isDeleted ? (
            <Feather
              name={message.isRead ? 'check-circle' : 'check'}
              size={12}
              color={Colors.light.textSecondary}
              style={styles.readIcon}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function MessageActionModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  message,
}: {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  message: Message | null;
}) {
  if (!message) return null;

  const isImage = message.type === 'image';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Действия</Text>
          {!isImage ? (
            <Pressable style={styles.modalButton} onPress={onEdit}>
              <Feather name="edit-2" size={20} color={Colors.light.text} />
              <Text style={styles.modalButtonText}>Редактировать</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.modalButton, styles.modalButtonDestructive]} onPress={onDelete}>
            <Feather name="trash-2" size={20} color={Colors.light.error} />
            <Text style={[styles.modalButtonText, styles.modalButtonTextDestructive]}>Удалить</Text>
          </Pressable>
          <Pressable style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Отмена</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function EditMessageModal({
  visible,
  onClose,
  onSave,
  initialText,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText: string;
}) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContent}>
          <Text style={styles.editModalTitle}>Редактирование</Text>
          <TextInput
            style={styles.editModalInput}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            maxLength={1000}
          />
          <View style={styles.editModalButtons}>
            <Pressable style={styles.editModalCancelBtn} onPress={onClose}>
              <Text style={styles.editModalCancelText}>Отмена</Text>
            </Pressable>
            <Pressable
              style={[styles.editModalSaveBtn, !text.trim() && styles.editModalSaveBtnDisabled]}
              onPress={() => {
                if (text.trim()) {
                  onSave(text.trim());
                }
              }}
              disabled={!text.trim()}
            >
              <Text style={styles.editModalSaveText}>Сохранить</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { chatId } = route.params;
  
  const { user } = useAuth();
  const { getChat, getChatMessages, sendMessage, sendImageMessage, editMessage, deleteMessage, markAsRead, searchMessages } = useChats();
  const flatListRef = useRef<FlatList>(null);

  const [inputText, setInputText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chat = getChat(chatId);
  const allMessages = getChatMessages(chatId);
  const searchResults = isSearching && searchQuery ? searchMessages(chatId, searchQuery) : [];
  const messages = isSearching && searchQuery ? searchResults : allMessages;
  const isGroup = chat?.type === 'group';

  useEffect(() => {
    markAsRead(chatId);
  }, [chatId, allMessages.length]);

  useEffect(() => {
    if (chat) {
      const otherUser = !isGroup ? chat.participants[0] : null;
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRight}>
            <Pressable
              style={styles.headerButton}
              onPress={() => setIsSearching(prev => !prev)}
            >
              <Feather name="search" size={22} color={isSearching ? Colors.light.accent : Colors.light.textSecondary} />
            </Pressable>
            {!isGroup ? (
              <>
                <Pressable
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('AudioCall', {
                    recipientId: String(otherUser?.id || ''),
                    username: otherUser?.username || '',
                  })}
                >
                  <Feather name="phone" size={22} color={Colors.light.accent} />
                </Pressable>
                <Pressable
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('VideoCall', {
                    recipientId: String(otherUser?.id || ''),
                    username: otherUser?.username || '',
                  })}
                >
                  <Feather name="video" size={22} color={Colors.light.accent} />
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.headerButton}
                onPress={() => navigation.navigate('GroupSettings', { chatId })}
              >
                <Feather name="info" size={22} color={Colors.light.accent} />
              </Pressable>
            )}
          </View>
        ),
      });
    }
  }, [chat, isGroup, navigation, isSearching]);

  const handleSend = useCallback(() => {
    if (inputText.trim()) {
      sendMessage(chatId, inputText);
      setInputText('');
    }
  }, [chatId, inputText, sendMessage]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Ошибка', 'Нужен доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      sendImageMessage(chatId, result.assets[0].uri);
    }
  };

  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowActionModal(true);
  };

  const handleEdit = () => {
    setShowActionModal(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowActionModal(false);
    if (selectedMessage) {
      Alert.alert(
        'Удалить сообщение?',
        'Это действие нельзя отменить',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: () => {
              deleteMessage(chatId, selectedMessage.id);
              setSelectedMessage(null);
            },
          },
        ]
      );
    }
  };

  const handleSaveEdit = (newText: string) => {
    if (selectedMessage) {
      editMessage(chatId, selectedMessage.id, newText);
    }
    setShowEditModal(false);
    setSelectedMessage(null);
  };

  const getSenderName = (senderId: string): string | undefined => {
    if (!isGroup) return undefined;
    if (senderId === user?.id) return undefined;
    const sender = chat?.participants.find(p => p.id === senderId);
    return sender?.username;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id || item.senderId === 'current_user';
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        senderName={getSenderName(item.senderId)}
        onLongPress={() => handleMessageLongPress(item)}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isSearching ? (
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.light.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск сообщений..."
            placeholderTextColor={Colors.light.textSecondary}
            autoFocus
          />
          {searchQuery ? (
            <Text style={styles.searchResultCount}>
              {searchResults.length} найдено
            </Text>
          ) : null}
          <Pressable onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
            <Feather name="x" size={20} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isSearching && searchQuery ? (
            <View style={styles.emptySearch}>
              <Feather name="search" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptySearchText}>Ничего не найдено</Text>
            </View>
          ) : null
        }
      />

      {!isSearching ? (
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.inputWrapper}>
            <Pressable style={styles.attachButton} onPress={handlePickImage}>
              <Feather name="image" size={22} color={Colors.light.textSecondary} />
            </Pressable>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Сообщение..."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              maxLength={1000}
            />
            <Pressable
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Feather name="send" size={20} color={inputText.trim() ? Colors.light.accent : Colors.light.textSecondary} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <MessageActionModal
        visible={showActionModal}
        onClose={() => { setShowActionModal(false); setSelectedMessage(null); }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        message={selectedMessage}
      />

      <EditMessageModal
        visible={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedMessage(null); }}
        onSave={handleSaveEdit}
        initialText={selectedMessage?.text || ''}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundDefault,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  searchResultCount: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  messageContainer: {
    marginVertical: Spacing.xs,
    maxWidth: '75%',
  },
  messageContainerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    ...Typography.caption,
    color: Colors.light.accent,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.message,
    overflow: 'hidden',
  },
  messageBubbleOwn: {
    backgroundColor: Colors.light.messageSent,
    borderBottomRightRadius: Spacing.xs,
  },
  messageBubbleOther: {
    backgroundColor: Colors.light.messageReceived,
    borderBottomLeftRadius: Spacing.xs,
  },
  messageBubbleDeleted: {
    backgroundColor: Colors.light.backgroundDefault,
  },
  messageText: {
    ...Typography.body,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: Colors.light.text,
  },
  messageTextDeleted: {
    fontStyle: 'italic',
    color: Colors.light.textSecondary,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.sm,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.xs,
    gap: Spacing.xs,
  },
  messageFooterOwn: {
    justifyContent: 'flex-end',
  },
  editedLabel: {
    ...Typography.timestamp,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  messageTime: {
    ...Typography.timestamp,
    color: Colors.light.textSecondary,
  },
  readIcon: {
    marginLeft: Spacing.xs,
  },
  inputContainer: {
    backgroundColor: Colors.light.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    transform: [{ scaleY: -1 }],
  },
  emptySearchText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.backgroundRoot,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  modalButtonDestructive: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  modalButtonText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  modalButtonTextDestructive: {
    color: Colors.light.error,
  },
  modalCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  modalCancelText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: Colors.light.backgroundRoot,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  editModalTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  editModalInput: {
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.light.text,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  editModalCancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  editModalCancelText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  editModalSaveBtn: {
    backgroundColor: Colors.light.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  editModalSaveBtnDisabled: {
    opacity: 0.5,
  },
  editModalSaveText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
