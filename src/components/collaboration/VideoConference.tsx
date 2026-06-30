'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Video,
  Monitor,
  Phone,
  VideoOff,
  MicOff,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import type { CollaborationUser } from '../../hooks/useCollaboration';
import { useFraudDetection } from '../../hooks/useFraudDetection';
import { useVirtualBackground } from '../../hooks/useVirtualBackground';
import { fraudDetectionService, FraudDetectionService } from '../../services/fraud-detection';
import type { FraudDetectionResult } from '../../services/fraud-detection';

interface VideoConferenceProps {
  roomId: string;
  user: CollaborationUser;
  websocketUrl?: string;
  fraudService?: FraudDetectionService;
  isHost?: boolean;
  hostUserId?: string;
}

type SignalingOffer = {
  roomId: string;
  offer: RTCSessionDescriptionInit;
  userId: string;
};

type SignalingAnswer = {
  roomId: string;
  answer: RTCSessionDescriptionInit;
  userId: string;
};

type IceCandidatePayload = {
  roomId: string;
  candidate: RTCIceCandidate;
  userId: string;
};

export function VideoConference({
  roomId,
  user,
  websocketUrl,
  fraudService = fraudDetectionService,
  isHost = false,
  hostUserId,
}: VideoConferenceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [fraudWarning, setFraudWarning] = useState<string | null>(null);

  const fraud = useFraudDetection(fraudService, {
    user,
    roomId,
    isHost,
    hostUserId,
  });

  const virtualBackground = useVirtualBackground();

  const signalingUrl =
    websocketUrl || process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const check = fraud.checkJoin();
    if (check.blocked) {
      setStatus('Access blocked by fraud detection');
      setFraudWarning('Multiple active connections detected');
      return undefined;
    }

    const socket = io(signalingUrl, {
      autoConnect: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        userName: user.name,
      });
      setStatus('Connected to signaling');
    });

    socket.on('webrtc-offer', async ({ offer, userId }: SignalingOffer) => {
      if (userId === user.id) return;
      await createPeerConnection();
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc-answer', { roomId, answer, userId: user.id });
      setCallActive(true);
      setStatus('Call established');
    });

    socket.on('webrtc-answer', async ({ answer, userId }: SignalingAnswer) => {
      if (userId === user.id) return;
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallActive(true);
      setStatus('Call established');
    });

    socket.on('webrtc-candidate', async ({ candidate, userId }: IceCandidatePayload) => {
      if (userId === user.id || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add ICE candidate', error);
      }
    });

    return () => {
      fraud.checkLeave();
      socket.disconnect();
      socketRef.current = null;
      virtualBackground.stopProcessing();
    };
  }, [roomId, signalingUrl, user.id, user.name, virtualBackground]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const createPeerConnection = async () => {
    if (pcRef.current) {
      return pcRef.current;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc-candidate', {
          roomId,
          candidate: event.candidate,
          userId: user.id,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed'
      ) {
        setStatus('Remote connection lost');
      }
    };

    pcRef.current = peerConnection;
    return peerConnection;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Apply virtual background if enabled
      const processedStream = await virtualBackground.applyToStream(stream);

      setLocalStream(processedStream);
      processedStream.getAudioTracks().forEach((track) => {
        track.enabled = microphoneEnabled;
      });
      processedStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraEnabled;
      });
      return processedStream;
    } catch (error) {
      setStatus('Unable to access camera or microphone');
      console.error(error);
      return null;
    }
  };

  const startCall = async () => {
    const socket = socketRef.current;
    if (!socket) {
      setStatus('Signaling not available');
      return;
    }

    const check: FraudDetectionResult = fraud.checkStartCall();
    if (check.blocked) {
      setStatus('Call blocked by fraud detection');
      setFraudWarning('Suspicious activity detected. Please try again later.');
      return;
    }
    if (check.isSuspicious) {
      setFraudWarning('Unusual activity detected. Your actions are being monitored.');
    }

    const bombingCheck: FraudDetectionResult = fraud.checkMeetingBombing();
    if (bombingCheck.blocked) {
      setStatus('Meeting bombing attempt detected');
      setFraudWarning('Too many rapid join attempts detected');
      return;
    }

    const stream = await startLocalStream();
    if (!stream) return;

    const peerConnection = await createPeerConnection();
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('webrtc-offer', { roomId, offer, userId: user.id });
    setCallActive(true);
    setStatus('Calling...');
  };

  const toggleCamera = () => {
    if (!localStream) {
      setCameraEnabled((enabled) => !enabled);
      return;
    }
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCameraEnabled((enabled) => !enabled);
  };

  const toggleMicrophone = () => {
    if (!localStream) {
      setMicrophoneEnabled((enabled) => !enabled);
      return;
    }
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicrophoneEnabled((enabled) => !enabled);
  };

  const toggleScreenShare = async () => {
    if (sharingScreen) {
      localStream?.getVideoTracks().forEach((track) => track.stop());
      const stream = await startLocalStream();
      if (!stream) return;
      const peerConnection = await createPeerConnection();
      peerConnection.getSenders().forEach((sender) => {
        const newTrack = stream.getVideoTracks()[0];
        if (newTrack && sender.track?.kind === 'video') {
          sender.replaceTrack(newTrack);
        }
      });
      setLocalStream(stream);
      setSharingScreen(false);
      fraud.checkScreenShare(false);
      socketRef.current?.emit('screen-share', {
        roomId,
        userId: user.id,
        sharing: false,
      });
      return;
    }

    const check = fraud.checkScreenShare(true);
    if (check.isSuspicious) {
      setFraudWarning('Screen share abuse detected. Rate limited.');
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = displayStream.getVideoTracks()[0];
      const peerConnection = await createPeerConnection();
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          sender.replaceTrack(screenTrack);
        }
      });
      setSharingScreen(true);
      socketRef.current?.emit('screen-share', {
        roomId,
        userId: user.id,
        sharing: true,
      });
      screenTrack.onended = () => {
        setSharingScreen(false);
        if (localStream) {
          toggleScreenShare();
        }
      };
    } catch (error) {
      setStatus('Screen sharing canceled or unavailable');
      console.error(error);
    }
  };

  const endCall = () => {
    virtualBackground.stopProcessing();
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);
    setSharingScreen(false);
    setStatus('Call ended');
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Video conference
            </h2>
            {fraud.fraudScore > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  fraud.fraudScore >= 50
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : fraud.fraudScore >= 20
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                }`}
                title={`Fraud score: ${fraud.fraudScore}`}
              >
                <ShieldAlert size={12} aria-hidden="true" />
                {fraud.fraudScore}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Peer-to-peer WebRTC audio/video with screen sharing and signaling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fraudWarning && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              role="alert"
            >
              <AlertTriangle size={12} aria-hidden="true" />
              {fraudWarning}
            </div>
          )}
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {status}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-3xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-72 w-full object-cover"
              />
              <div className="p-3 text-sm text-slate-200">Your camera</div>
            </div>
            <div className="overflow-hidden rounded-3xl bg-slate-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-72 w-full object-cover"
              />
              <div className="p-3 text-sm text-slate-200">Remote participant</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startCall}
              disabled={fraud.isBlocked}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Phone size={16} /> Start call
            </button>
            <button
              type="button"
              onClick={endCall}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <VideoOff size={16} /> End call
            </button>
          </div>

          {fraud.accessCheck && !fraud.accessCheck.allowed && (
            <div
              className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400"
              role="alert"
            >
              <div className="flex items-center gap-2 font-medium">
                <ShieldAlert size={14} aria-hidden="true" />
                Access restricted
              </div>
              <p className="mt-1 text-xs">
                {fraud.accessCheck.reason || 'Access to this conference is restricted.'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Controls</div>
          <button
            type="button"
            onClick={toggleCamera}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Video size={16} /> {cameraEnabled ? 'Disable camera' : 'Enable camera'}
          </button>
          <button
            type="button"
            onClick={toggleMicrophone}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Mic size={16} /> {microphoneEnabled ? 'Mute mic' : 'Unmute mic'}
          </button>
          <button
            type="button"
            onClick={toggleScreenShare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Monitor size={16} /> {sharingScreen ? 'Stop screen share' : 'Share screen'}
          </button>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <Mic size={14} />
              <span>{microphoneEnabled ? 'Microphone active' : 'Microphone muted'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Video size={14} />
              <span>{cameraEnabled ? 'Camera active' : 'Camera off'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <ShieldAlert size={14} />
              <span>
                {fraud.fraudScore === 0
                  ? 'No suspicious activity'
                  : `Fraud score: ${fraud.fraudScore}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}