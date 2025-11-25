import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { getCommonScreenOptions } from './screenOptions';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ChatScreen from '@/screens/ChatScreen';
import CreateGroupScreen from '@/screens/CreateGroupScreen';
import GroupSettingsScreen from '@/screens/GroupSettingsScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import AudioCallScreen from '@/screens/AudioCallScreen';
import VideoCallScreen from '@/screens/VideoCallScreen';
import RoomScreen from '@/screens/RoomScreen';
import CreateRoomScreen from '@/screens/CreateRoomScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params.title,
              headerTransparent: false,
              headerStyle: { backgroundColor: theme.backgroundRoot },
            })}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{
              title: 'Создать группу',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="GroupSettings"
            component={GroupSettingsScreen}
            options={{
              title: 'Настройки группы',
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{
              title: 'Профиль',
            }}
          />
          <Stack.Screen
            name="AudioCall"
            component={AudioCallScreen}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="Room"
            component={RoomScreen}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="CreateRoom"
            component={CreateRoomScreen}
            options={{
              title: 'Создать комнату',
              presentation: 'modal',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
