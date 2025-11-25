import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ScreenScrollView } from '@/components/ScreenScrollView';

function Avatar({ username, size = 80 }: { username: string; size?: number }) {
  const initial = username.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, destructive, showChevron = true }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && styles.settingsItemPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingsIcon, destructive && styles.settingsIconDestructive]}>
        <Feather name={icon} size={20} color={destructive ? Colors.light.error : Colors.light.accent} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, destructive && styles.settingsTitleDestructive]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {showChevron && onPress ? (
        <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      <ScreenScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <View style={styles.profileSection}>
          <Avatar username={user?.username || '@user'} />
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="user"
              title="Профиль"
              subtitle="Редактировать профиль"
              onPress={() => {}}
            />
            <SettingsItem
              icon="bell"
              title="Уведомления"
              subtitle="Настройки уведомлений"
              onPress={() => {}}
            />
            <SettingsItem
              icon="lock"
              title="Конфиденциальность"
              subtitle="Настройки приватности"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Приложение</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="moon"
              title="Тема"
              subtitle="Светлая"
              onPress={() => {}}
            />
            <SettingsItem
              icon="globe"
              title="Язык"
              subtitle="Русский"
              onPress={() => {}}
            />
            <SettingsItem
              icon="info"
              title="О приложении"
              subtitle="Версия 1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="log-out"
              title="Выйти"
              onPress={handleLogout}
              destructive
              showChevron={false}
            />
          </View>
        </View>
      </ScreenScrollView>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выход</Text>
            <Text style={styles.modalMessage}>
              Вы уверены, что хотите выйти из аккаунта?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalButtonCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonConfirmText}>Выйти</Text>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.light.text,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  avatar: {
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: Colors.light.accent,
    fontWeight: '600',
  },
  username: {
    ...Typography.h4,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.backgroundDefault,
  },
  settingsItemPressed: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsIconDestructive: {
    backgroundColor: '#FFEBEB',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    ...Typography.body,
    color: Colors.light.text,
  },
  settingsTitleDestructive: {
    color: Colors.light.error,
  },
  settingsSubtitle: {
    ...Typography.small,
    color: Colors.light.textSecondary,
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
