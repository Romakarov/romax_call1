import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { CallProvider } from '@/context/CallContext';
import { requestNotificationPermissions } from '@/hooks/useNotifications';

function NotificationInitializer() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <AuthProvider>
              <ChatProvider>
                <CallProvider>
                  <NotificationInitializer />
                  <NavigationContainer>
                    <RootNavigator />
                  </NavigationContainer>
                </CallProvider>
              </ChatProvider>
            </AuthProvider>
            <StatusBar style="auto" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
