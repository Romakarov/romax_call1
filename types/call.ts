export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  recipientId: string;
  recipientName: string;
  type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
  startedAt?: string;
  endedAt?: string;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  callId: string;
  from: string;
  to: string;
  data: any;
}

export interface ICECandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}
