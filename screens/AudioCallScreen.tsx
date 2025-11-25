import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '@/navigation/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useCall } from '@/context/CallContext';

type AudioCallRouteProp = RouteProp<RootStackParamList, 'AudioCall'>;

function Avatar({ username, size = 120 }: { username: string; size?: number }) {
  const initial = username.replace('@', '')[0]?.toUpperCase() || '?';
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initial}</Text>
    </View>
  );
}

function CallButton({
  icon,
  onPress,
  isActive,
  isDestructive,
  size = 64,
  disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.callButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDestructive
            ? Colors.light.error
            : isActive
            ? Colors.light.accent
            : 'rgba(255,255,255,0.2)',
          opacity: disabled ? 0.5 : 1,
        },
        pressed && !disabled && { opacity: 0.8 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Feather name={icon} size={size * 0.4} color="#FFFFFF" />
    </Pressable>
  );
}

export default function AudioCallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<AudioCallRouteProp>();
  const { username, recipientId, incoming } = route.params;
  const { currentCall, incomingCall, acceptCall, rejectCall, endCall, localStream, remoteStream } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const callStatus = currentCall?.status || incomingCall?.status;
    if (callStatus === 'ringing') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [currentCall?.status, incomingCall?.status]);

  useEffect(() => {
    const callStatus = currentCall?.status || incomingCall?.status;
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentCall?.status, incomingCall?.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    endCall();
    navigation.goBack();
  };

  const handleAcceptCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAccepting(true);
    try {
      await acceptCall();
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsAccepting(false);
    }
  };

  const handleRejectCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    rejectCall();
    navigation.goBack();
  };

  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(prev => {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !track.enabled;
        });
      }
      return !prev;
    });
  };

  const toggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeaker(prev => !prev);
  };

  // Set up audio elements
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getStatusText = () => {
    const callStatus = currentCall?.status || incomingCall?.status;
    switch (callStatus) {
      case 'ringing':
        return incoming ? 'Входящий звонок...' : 'Вызов...';
      case 'connected':
        return formatDuration(duration);
      case 'rejected':
      case 'ended':
        return 'Звонок завершён';
      default:
        return 'Звонок...';
    }
  };

  const callStatus = currentCall?.status || incomingCall?.status;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Hidden audio elements for web */}
      {typeof document !== 'undefined' && (
        <>
          <audio
            ref={localAudioRef}
            autoPlay
            muted
            playsInline
          />
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
          />
        </>
      )}
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: callStatus === 'ringing' ? pulseAnim : 1 }] }}>
          <Avatar username={username} />
        </Animated.View>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.status}>{getStatusText()}</Text>
      </View>

      <View style={styles.controls}>
        {callStatus === 'connected' ? (
          <View style={styles.controlsRow}>
            <CallButton
              icon={isMuted ? 'mic-off' : 'mic'}
              onPress={toggleMute}
              isActive={isMuted}
            />
            <CallButton
              icon="phone-off"
              onPress={handleEndCall}
              isDestructive
              size={72}
            />
            <CallButton
              icon="volume-2"
              onPress={toggleSpeaker}
              isActive={isSpeaker}
            />
          </View>
        ) : incoming ? (
          <View style={styles.controlsRow}>
            <CallButton
              icon="x-circle"
              onPress={handleRejectCall}
              isDestructive
              size={72}
              disabled={isAccepting}
            />
            <CallButton
              icon="phone"
              onPress={handleAcceptCall}
              size={72}
              disabled={isAccepting}
            />
          </View>
        ) : (
          <View style={styles.controlsRow}>
            <CallButton
              icon="phone-off"
              onPress={handleEndCall}
              isDestructive
              size={72}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarText: {
    color: Colors.light.accent,
    fontWeight: '600',
  },
  username: {
    ...Typography.h3,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  status: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  controls: {
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing['3xl'],
  },
  callButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
