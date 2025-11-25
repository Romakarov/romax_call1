import { useCallback, useRef, useEffect } from 'react';
import { useSocket } from './useSocket';
import { WebRTCSignal } from '@/types/call';

interface RTCConfig {
  iceServers: RTCIceServer[];
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export function useWebRTC() {
  const socket = useSocket();
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection | null> => {
    try {
      const config: RTCConfiguration = {
        iceServers: DEFAULT_ICE_SERVERS,
      };

      const pc = new RTCPeerConnection(config);

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('Sending ICE candidate');
          socket.emit('call:signal', {
            type: 'ice-candidate',
            data: event.candidate,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (remoteStream.current) {
          remoteStream.current.addTrack(event.track);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
      };

      peerConnection.current = pc;
      return pc;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      return null;
    }
  }, [socket]);

  const getLocalStream = useCallback(
    async (audio: boolean = true, video: boolean = false): Promise<MediaStream | null> => {
      try {
        // Web RTCPeerConnection requires getUserMedia
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio,
            video: video ? { width: { max: 640 }, height: { max: 480 } } : false,
          });
          localStream.current = stream;
          return stream;
        }
        return null;
      } catch (error) {
        console.error('Error getting local stream:', error);
        return null;
      }
    },
    []
  );

  const addTracksToConnection = useCallback(
    async (pc: RTCPeerConnection, stream: MediaStream) => {
      try {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } catch (error) {
        console.error('Error adding tracks:', error);
      }
    },
    []
  );

  const createOffer = useCallback(async (pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  }, []);

  const createAnswer = useCallback(async (pc: RTCPeerConnection, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      return null;
    }
  }, []);

  const handleAnswer = useCallback(async (pc: RTCPeerConnection, answer: RTCSessionDescriptionInit) => {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleICECandidate = useCallback(async (pc: RTCPeerConnection, candidate: any) => {
    try {
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  const closeConnection = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    remoteStream.current = null;
  }, []);

  return {
    peerConnection: peerConnection.current,
    localStream: localStream.current,
    remoteStream: remoteStream.current,
    createPeerConnection,
    getLocalStream,
    addTracksToConnection,
    createOffer,
    createAnswer,
    handleAnswer,
    handleICECandidate,
    closeConnection,
  };
}
