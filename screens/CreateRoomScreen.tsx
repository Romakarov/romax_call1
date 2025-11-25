import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { RootStackParamList } from '@/navigation/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreateRoomScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    
    const roomId = `room_${Date.now()}`;
    navigation.replace('Room', { roomId, title: title.trim() });
  };

  const isValid = title.trim().length > 0;

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
  }, [navigation, isValid, title]);

  const ScrollComponent = Platform.OS === 'web' ? ScrollView : KeyboardAwareScrollView;

  return (
    <ScrollComponent
      style={{ flex: 1, backgroundColor: Colors.light.backgroundRoot }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.iconContainer}>
        <View style={styles.icon}>
          <Feather name="video" size={40} color={Colors.light.accent} />
        </View>
      </View>

      <Text style={styles.description}>
        Создайте комнату для группового видеозвонка до 10 участников
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Название комнаты</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Введите название"
          placeholderTextColor={Colors.light.textSecondary}
          maxLength={50}
          autoFocus
        />
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Feather name="users" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>До 10 участников</Text>
        </View>
        <View style={styles.infoItem}>
          <Feather name="video" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>Видео и аудио</Text>
        </View>
        <View style={styles.infoItem}>
          <Feather name="lock" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>Только для зарегистрированных</Text>
        </View>
      </View>
    </ScrollComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.light.backgroundRoot,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  inputGroup: {
    marginBottom: Spacing.xl,
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
  infoSection: {
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
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
