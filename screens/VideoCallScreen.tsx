import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '@/navigation/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useCall } from '@/context/CallContext';

type VideoCallRouteProp = RouteProp<RootStackParamList, 'VideoCall'>;

function Avatar({ username, size = 80 }: { username: string; size?: number }) {
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
  disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.callButton,
        {
          backgroundColor: isDestructive
            ? Colors.light.error
            : isActive
            ? '#FFFFFF'
            : 'rgba(255,255,255,0.2)',
          opacity: disabled ? 0.5 : 1,
        },
        pressed && !disabled && { opacity: 0.8 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Feather
        name={icon}
        size={24}
        color={isActive ? '#1A1A1A' : '#FFFFFF'}
      />
    </Pressable>
  );
}

export default function VideoCallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<VideoCallRouteProp>();
  const { username, recipientId, incoming } = route.params;
  const { currentCall, incomingCall, acceptCall, rejectCall, endCall, localStream, remoteStream } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const callStatus = currentCall?.status || incomingCall?.status;
    // Auto-connect after 2 seconds for demo purposes
    // In production, this would wait for real WebRTC connection
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

  const toggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVideoOff(prev => {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = !track.enabled;
        });
      }
      return !prev;
    });
  };

  // Set up video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const switchCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFrontCamera(prev => !prev);
  };

  const callStatus = currentCall?.status || incomingCall?.status;

  return (
    <View style={styles.container}>
      {/* Hidden video elements for web */}
      {typeof document !== 'undefined' && (
        <>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ display: 'none' }}
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
        </>
      )}
      <View style={styles.remoteVideo}>
        <View style={styles.remoteVideoPlaceholder}>
          {remoteStream && callStatus === 'connected' ? (
            <Text style={styles.remoteStatus}>Видео подключено</Text>
          ) : (
            <>
              <Avatar username={username} size={100} />
              <Text style={styles.remoteName}>{username}</Text>
              {callStatus === 'ringing' ? (
                <Text style={styles.remoteStatus}>Вызов...</Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View style={[styles.localVideo, { top: insets.top + Spacing.lg }]}>
        <View style={styles.localVideoPlaceholder}>
          {isVideoOff || !localStream ? (
            <Feather name="video-off" size={24} color="rgba(255,255,255,0.5)" />
          ) : (
            <View style={styles.localVideoActive}>
              <Feather name="user" size={32} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.duration}>
          {callStatus === 'connected' ? formatDuration(duration) : ''}
        </Text>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {callStatus === 'connected' ? (
          <>
            <CallButton
              icon="refresh-cw"
              onPress={switchCamera}
            />
            <CallButton
              icon={isVideoOff ? 'video-off' : 'video'}
              onPress={toggleVideo}
              isActive={isVideoOff}
            />
            <CallButton
              icon={isMuted ? 'mic-off' : 'mic'}
              onPress={toggleMute}
              isActive={isMuted}
            />
            <CallButton
              icon="phone-off"
              onPress={handleEndCall}
              isDestructive
            />
          </>
        ) : incoming ? (
          <>
            <CallButton
              icon="x-circle"
              onPress={handleRejectCall}
              isDestructive
              disabled={isAccepting}
            />
            <CallButton
              icon="phone"
              onPress={handleAcceptCall}
              disabled={isAccepting}
            />
          </>
        ) : (
          <CallButton
            icon="phone-off"
            onPress={handleEndCall}
            isDestructive
          />
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
  remoteVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideoPlaceholder: {
    alignItems: 'center',
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
  remoteName: {
    ...Typography.h4,
    color: '#FFFFFF',
    marginTop: Spacing.md,
  },
  remoteStatus: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  localVideo: {
    position: 'absolute',
    right: Spacing.lg,
    width: 100,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoActive: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  duration: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
