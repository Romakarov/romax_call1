import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '@/navigation/types';
import { RoomParticipant } from '@/types';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

type RoomRouteProp = RouteProp<RootStackParamList, 'Room'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEMO_PARTICIPANTS: RoomParticipant[] = [
  { userId: 'me', username: '@me', isMuted: false, isVideoOn: true, joinedAt: new Date().toISOString() },
  { userId: 'p1', username: '@anna', isMuted: false, isVideoOn: true, joinedAt: new Date().toISOString() },
  { userId: 'p2', username: '@ivan', isMuted: true, isVideoOn: false, joinedAt: new Date().toISOString() },
  { userId: 'p3', username: '@maria', isMuted: false, isVideoOn: true, joinedAt: new Date().toISOString() },
];

function ParticipantTile({ participant, size }: { participant: RoomParticipant; size: number }) {
  const initial = participant.username.replace('@', '')[0]?.toUpperCase() || '?';

  return (
    <View style={[styles.tile, { width: size, height: size }]}>
      {participant.isVideoOn ? (
        <View style={styles.videoPlaceholder}>
          <Feather name="user" size={size * 0.25} color="rgba(255,255,255,0.5)" />
        </View>
      ) : (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.15 }]}>{initial}</Text>
          </View>
        </View>
      )}
      <View style={styles.tileOverlay}>
        <View style={styles.tileInfo}>
          <Text style={styles.tileName} numberOfLines={1}>{participant.username}</Text>
          {participant.isMuted ? (
            <Feather name="mic-off" size={14} color="#FF4B4B" />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CallButton({
  icon,
  onPress,
  isActive,
  isDestructive,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  isActive?: boolean;
  isDestructive?: boolean;
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
        },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      <Feather
        name={icon}
        size={22}
        color={isActive ? '#1A1A1A' : '#FFFFFF'}
      />
    </Pressable>
  );
}

export default function RoomScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RoomRouteProp>();
  const { title } = route.params;

  const [participants, setParticipants] = useState<RoomParticipant[]>(DEMO_PARTICIPANTS);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    navigation.goBack();
  };

  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(prev => !prev);
    setParticipants(prev =>
      prev.map(p =>
        p.userId === 'me' ? { ...p, isMuted: !p.isMuted } : p
      )
    );
  };

  const toggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVideoOn(prev => !prev);
    setParticipants(prev =>
      prev.map(p =>
        p.userId === 'me' ? { ...p, isVideoOn: !p.isVideoOn } : p
      )
    );
  };

  const getGridConfig = (count: number) => {
    if (count === 1) return { columns: 1, size: SCREEN_WIDTH - Spacing.lg * 2 };
    if (count === 2) return { columns: 1, size: (SCREEN_WIDTH - Spacing.lg * 2) };
    if (count <= 4) return { columns: 2, size: (SCREEN_WIDTH - Spacing.lg * 3) / 2 };
    return { columns: 2, size: (SCREEN_WIDTH - Spacing.lg * 3) / 2 };
  };

  const { columns, size } = getGridConfig(participants.length);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
        <Text style={styles.participantCount}>
          {participants.length} участник(ов)
        </Text>
      </View>

      <View style={styles.grid}>
        <FlatList
          data={participants}
          renderItem={({ item }) => <ParticipantTile participant={item} size={size} />}
          keyExtractor={(item) => item.userId}
          numColumns={columns}
          key={columns}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <CallButton
          icon={isVideoOn ? 'video' : 'video-off'}
          onPress={toggleVideo}
          isActive={!isVideoOn}
        />
        <CallButton
          icon={isMuted ? 'mic-off' : 'mic'}
          onPress={toggleMute}
          isActive={isMuted}
        />
        <CallButton
          icon="log-out"
          onPress={handleLeaveRoom}
          isDestructive
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h4,
    color: '#FFFFFF',
  },
  duration: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },
  participantCount: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.xs,
  },
  grid: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  gridContent: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  tile: {
    backgroundColor: '#2A2A2A',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.light.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.light.accent,
    fontWeight: '600',
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.sm,
  },
  tileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileName: {
    ...Typography.small,
    color: '#FFFFFF',
    flex: 1,
    marginRight: Spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  callButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
