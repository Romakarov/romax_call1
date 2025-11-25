import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CallSession, WebRTCSignal } from '@/types/call';
import { Socket } from 'socket.io-client';
import { useSocket } from '@/hooks/useSocket';

interface CallContextType {
  currentCall: CallSession | null;
  incomingCall: CallSession | null;
  isCallActive: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  initiateCall: (recipientId: string, recipientName: string, type: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  sendSignal: (signal: WebRTCSignal) => void;
  handleIncomingOffer: (offer: any, callId: string, fromId: string, fromName: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);

  // Get local media stream
  const getLocalStream = useCallback(
    async (audio: boolean = true, video: boolean = false): Promise<MediaStream | null> => {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio,
            video: video ? { width: { max: 640 }, height: { max: 480 } } : false,
          });
          setLocalStream(stream);
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

  // Create peer connection
  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection | null> => {
    try {
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const pc = new RTCPeerConnection(config);

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && callIdRef.current) {
          socket.emit('call:signal', {
            type: 'ice-candidate',
            callId: callIdRef.current,
            data: event.candidate,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const remoteMediaStream = new MediaStream();
        remoteMediaStream.addTrack(event.track);
        setRemoteStream(remoteMediaStream);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
      };

      peerConnectionRef.current = pc;
      return pc;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      return null;
    }
  }, [socket]);

  // Listen for incoming calls via Socket.io
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('call:incoming', (data: any) => {
      const callSession: CallSession = {
        id: data.callId,
        callerId: String(data.callerId),
        callerName: data.callerName,
        recipientId: String(user.id),
        recipientName: user.username,
        type: data.type,
        status: 'ringing',
      };
      setIncomingCall(callSession);
      callIdRef.current = data.callId;
    });

    socket.on('call:offer', async (data: any) => {
      console.log('Received offer');
      if (!peerConnectionRef.current) return;
      
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.data)
        );
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket.on('call:answer', async (data: any) => {
      console.log('Received answer');
      if (!peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.data)
        );
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socket.on('call:ice-candidate', async (data: any) => {
      console.log('Received ICE candidate');
      if (!peerConnectionRef.current || !data.data) return;

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.data)
        );
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('call:accepted', () => {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
      setIsCallActive(true);
    });

    socket.on('call:rejected', () => {
      cleanupCall();
    });

    socket.on('call:ended', () => {
      cleanupCall();
    });

    socket.on('call:missed', () => {
      setIncomingCall(null);
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:missed');
    };
  }, [socket, user]);

  const cleanupCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setCurrentCall(null);
    setIncomingCall(null);
    setIsCallActive(false);
    callIdRef.current = null;
  }, [localStream]);

  const initiateCall = useCallback(
    async (recipientId: string, recipientName: string, type: 'audio' | 'video') => {
      if (!user || !socket) return;

      const callId = `call_${Date.now()}`;
      callIdRef.current = callId;

      const newCall: CallSession = {
        id: callId,
        callerId: String(user.id),
        callerName: user.username,
        recipientId,
        recipientName,
        type,
        status: 'calling',
        startedAt: new Date().toISOString(),
      };

      setCurrentCall(newCall);

      // Get local stream
      const stream = await getLocalStream(true, type === 'video');
      if (!stream) {
        console.error('Failed to get local stream');
        setCurrentCall(null);
        return;
      }

      // Create peer connection and add tracks
      const pc = await createPeerConnection();
      if (!pc) {
        console.error('Failed to create peer connection');
        stream.getTracks().forEach((track) => track.stop());
        setCurrentCall(null);
        return;
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call:initiate', {
          callId,
          callerId: user.id,
          callerName: user.username,
          recipientId,
          type,
        });

        socket.emit('call:signal', {
          type: 'offer',
          callId,
          data: offer,
        });
      } catch (error) {
        console.error('Error initiating call:', error);
        pc.close();
        stream.getTracks().forEach((track) => track.stop());
        setCurrentCall(null);
      }
    },
    [user, socket, getLocalStream, createPeerConnection]
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket || !peerConnectionRef.current) return;

    try {
      // Get local stream
      const stream = await getLocalStream(true, incomingCall.type === 'video');
      if (!stream) {
        console.error('Failed to get local stream');
        rejectCall();
        return;
      }

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      const acceptedCall: CallSession = {
        ...incomingCall,
        status: 'connected',
        startedAt: new Date().toISOString(),
      };

      setCurrentCall(acceptedCall);
      setIncomingCall(null);
      setIsCallActive(true);

      socket.emit('call:accept', {
        callId: incomingCall.id,
        recipientId: incomingCall.callerId,
      });

      socket.emit('call:signal', {
        type: 'answer',
        callId: incomingCall.id,
        data: answer,
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      rejectCall();
    }
  }, [incomingCall, socket, getLocalStream]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;

    socket.emit('call:reject', {
      callId: incomingCall.id,
      recipientId: incomingCall.callerId,
    });

    setIncomingCall(null);
  }, [incomingCall, socket]);

  const endCall = useCallback(() => {
    if (!currentCall || !socket) return;

    socket.emit('call:end', {
      callId: currentCall.id,
      recipientId: currentCall.recipientId,
    });

    cleanupCall();
  }, [currentCall, socket, cleanupCall]);

  const sendSignal = useCallback(
    (signal: WebRTCSignal) => {
      if (!socket) return;
      socket.emit('call:signal', signal);
    },
    [socket]
  );

  const handleIncomingOffer = useCallback((offer: any, callId: string, fromId: string, fromName: string) => {
    console.log('Handling incoming offer:', { callId, fromId, fromName });
    // This will be called when we receive an offer
  }, []);

  return (
    <CallContext.Provider
      value={{
        currentCall,
        incomingCall,
        isCallActive,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        sendSignal,
        handleIncomingOffer,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
