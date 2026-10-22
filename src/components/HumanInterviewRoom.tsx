import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { speechService } from '../services/speech';
import { WebRTCManager } from '../services/webrtc';
import { getInterviewSocket, disconnectInterviewSocket } from '../services/socket';
import { Socket } from 'socket.io-client';
import { BrandIcon } from './BrandLogo';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  RefreshCw,
  Award,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Users,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface HumanInterviewRoomProps {
  roomId: string;
  onSelectView: (view: string, params?: any) => void;
}

export const HumanInterviewRoom: React.FC<HumanInterviewRoomProps> = ({ roomId, onSelectView }) => {
  const { user } = useAuth();
  const [interview, setInterview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call timer
  const [callDuration, setCallDuration] = useState(0);

  // Video & Audio streams state
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Permissions & Hardware state
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);

  // Media controls state
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // Remote peer state
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remotePeerSocketId, setRemotePeerSocketId] = useState<string | null>(null);
  const [remotePeerInfo, setRemotePeerInfo] = useState<{
    name: string;
    role: string;
    micEnabled: boolean;
    camEnabled: boolean;
  } | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  // Socket & WebRTC references
  const socketRef = useRef<Socket | null>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  // Transcripts, Notes, & Evaluation
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; timestamp: string }>>([]);
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [manualTranscriptInput, setManualTranscriptInput] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript' | 'questions'>('notes');

  // Stable refs to prevent effect re-trigger loops
  const interviewRef = useRef(interview);
  interviewRef.current = interview;
  const userRef = useRef(user);
  userRef.current = user;
  const onSelectViewRef = useRef(onSelectView);
  onSelectViewRef.current = onSelectView;

  // Determine user role in this room
  const isInterviewer =
    user?.role === 'interviewer' ||
    user?.role === 'admin' ||
    String(interview?.interviewerId) === String(user?.id);

  // Call timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Initialize Local Media Stream (Camera & Microphone)
  const initLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    setIsRequestingMedia(true);
    setPermissionError(null);

    try {
      // Clean up previous stream tracks if any
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Request camera and mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Update WebRTC Manager with local stream
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.setLocalStream(stream);
      }

      setIsMicMuted(false);
      setIsCameraOff(false);
      return stream;
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      let errorMsg = 'Could not access camera or microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera/Microphone permission was denied. Please allow permissions in your browser bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera or microphone was detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera or microphone is currently in use by another application.';
      }

      // Try audio-only fallback if video failed
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = audioOnlyStream;
          localVideoRef.current.play().catch(() => {});
        }
        if (webrtcManagerRef.current) {
          webrtcManagerRef.current.setLocalStream(audioOnlyStream);
        }
        setIsCameraOff(true);
        setPermissionError('Camera is unavailable; joined in Audio-Only mode.');
        return audioOnlyStream;
      } catch {
        setPermissionError(errorMsg);
        return null;
      }
    } finally {
      setIsRequestingMedia(false);
    }
  }, []);

  // Toggle Microphone
  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setIsMicMuted(!nextState);

      // Broadcast media state to peer
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('media:state', {
          roomId,
          micEnabled: nextState,
          camEnabled: !isCameraOff,
        });
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setIsCameraOff(!nextState);

      // Broadcast media state to peer
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('media:state', {
          roomId,
          micEnabled: !isMicMuted,
          camEnabled: nextState,
        });
      }
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera stream
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
      await initLocalMedia();
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          initLocalMedia();
        };

        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            localStream.removeTrack(videoTrack);
          }
          localStream.addTrack(screenTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          if (webrtcManagerRef.current) {
            webrtcManagerRef.current.setLocalStream(localStream);
          }
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or unavailable:', err);
      }
    }
  };

  // Manual ICE / Connection Restart
  const handleReconnect = async () => {
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.restartIce();
    }
    if (socketRef.current && remotePeerSocketId) {
      socketRef.current.emit('signal:reconnect-request', { to: remotePeerSocketId });
    }
  };

  // 2. Fetch Interview Info, Acquire Media, and Connect WebRTC & Socket
  useEffect(() => {
    let isDisposed = false;

    async function initRoom() {
      try {
        setLoading(true);
        setError(null);

        // API checks authorization (assigned candidate, interviewer, or admin)
        // and transitions status: scheduled -> in_progress
        const joinRes = await api.scheduled.join(roomId);
        if (isDisposed) return;

        const interviewData = joinRes.interview;
        setInterview(interviewData);
        interviewRef.current = interviewData;
        setTranscript(interviewData?.transcript || []);
        setInterviewerNotes(interviewData?.notes || '');
        setLoading(false);

        // A. Start local camera and mic and await ready stream
        const stream = await initLocalMedia();
        if (isDisposed) return;

        // B. Instantiate WebRTC Manager
        const manager = new WebRTCManager({
          onRemoteStream: (incomingStream: MediaStream) => {
            if (isDisposed) return;
            setRemoteStream(incomingStream);
            setPeerDisconnected(false);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = incomingStream;
              remoteVideoRef.current.play().catch(() => {});
            }
          },
          onConnectionStateChange: (state: RTCPeerConnectionState) => {
            if (isDisposed) return;
            setConnectionState(state);
            if (state === 'disconnected' || state === 'failed') {
              setPeerDisconnected(true);
            } else if (state === 'connected') {
              setPeerDisconnected(false);
            }
          },
          sendSignal: (event: string, payload: any) => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit(event, payload);
            }
          },
          onError: (err: Error) => {
            console.warn('[WebRTC] Manager error:', err);
          },
        });

        if (stream) {
          manager.setLocalStream(stream);
        }
        webrtcManagerRef.current = manager;

        // C. Connect Socket.IO
        const socket = getInterviewSocket();
        socketRef.current = socket;

        // Helper to join room once socket connects
        const joinRoom = () => {
          socket.emit('join-room', { roomId });
        };

        if (socket.connected) {
          joinRoom();
        } else {
          socket.once('connect', joinRoom);
        }

        // Handlers for room events
        socket.on('room-error', (data: { message: string }) => {
          setError(data.message);
        });

        socket.on('joined-room', async (data: {
          roomId: string;
          existingUsers: string[];
          existingParticipants?: Array<{
            socketId: string;
            userId?: string;
            userName?: string;
            role?: string;
          }>;
          interviewStatus?: string;
        }) => {
          if (isDisposed) return;

          if (data.interviewStatus) {
            setInterview((prev: any) => ({ ...prev, status: data.interviewStatus }));
          }

          const currentInterview = interviewRef.current;
          const currentUser = userRef.current;
          const isInterviewerNow =
            currentUser?.role === 'interviewer' ||
            currentUser?.role === 'admin' ||
            String(currentInterview?.interviewerId) === String(currentUser?.id);

          // If a participant is already in the room, record their information
          if (data.existingParticipants && data.existingParticipants.length > 0) {
            const peer = data.existingParticipants[0];
            setRemotePeerSocketId(peer.socketId);
            setRemotePeerInfo({
              name: peer.userName || (isInterviewerNow ? currentInterview?.candidateName : currentInterview?.interviewerName),
              role: peer.role || (isInterviewerNow ? 'Candidate' : 'Interviewer'),
              micEnabled: true,
              camEnabled: true,
            });
          } else if (data.existingUsers && data.existingUsers.length > 0) {
            const peerId = data.existingUsers[0];
            setRemotePeerSocketId(peerId);
            setRemotePeerInfo({
              name: isInterviewerNow ? currentInterview?.candidateName : currentInterview?.interviewerName,
              role: isInterviewerNow ? 'Candidate' : 'Interviewer',
              micEnabled: true,
              camEnabled: true,
            });
          }
        });

        // When the second participant enters the room
        socket.on('user-joined', async (data: {
          userId: string;
          userName: string;
          role: string;
          socketId: string;
        }) => {
          if (isDisposed) return;

          const currentInterview = interviewRef.current;
          const currentUser = userRef.current;
          const isInterviewerNow =
            currentUser?.role === 'interviewer' ||
            currentUser?.role === 'admin' ||
            String(currentInterview?.interviewerId) === String(currentUser?.id);

          setRemotePeerSocketId(data.socketId);
          setRemotePeerInfo({
            name: data.userName || (isInterviewerNow ? currentInterview?.candidateName : currentInterview?.interviewerName),
            role: data.role || (isInterviewerNow ? 'Candidate' : 'Interviewer'),
            micEnabled: true,
            camEnabled: true,
          });
          setPeerDisconnected(false);

          // Existing participant initiates the WebRTC offer to the newly joined peer
          if (webrtcManagerRef.current) {
            try {
              await webrtcManagerRef.current.initializePeerConnection(data.socketId, true);
            } catch (e) {
              console.warn('Failed to initiate WebRTC offer:', e);
            }
          }
        });

        // WebRTC Signaling: Offer
        socket.on('signal:offer', async (data: { from: string; offer: any; user?: any }) => {
          if (isDisposed) return;

          setRemotePeerSocketId(data.from);
          if (data.user) {
            setRemotePeerInfo({
              name: data.user.name,
              role: data.user.role,
              micEnabled: true,
              camEnabled: true,
            });
          }

          if (webrtcManagerRef.current) {
            await webrtcManagerRef.current.handleOffer(data.offer, data.from);
          }
        });

        // WebRTC Signaling: Answer
        socket.on('signal:answer', async (data: { from: string; answer: any }) => {
          if (isDisposed) return;
          if (webrtcManagerRef.current) {
            await webrtcManagerRef.current.handleAnswer(data.answer);
          }
        });

        // WebRTC Signaling: ICE Candidate
        socket.on('signal:ice-candidate', async (data: { from: string; candidate: any }) => {
          if (isDisposed) return;
          if (webrtcManagerRef.current) {
            await webrtcManagerRef.current.handleIceCandidate(data.candidate);
          }
        });

        // Peer Media State Sync (Mute / Video toggled)
        socket.on('media:state', (data: { from: string; micEnabled: boolean; camEnabled: boolean }) => {
          if (isDisposed) return;
          setRemotePeerInfo((prev) =>
            prev
              ? { ...prev, micEnabled: data.micEnabled, camEnabled: data.camEnabled }
              : null
          );
        });

        // Peer Reconnection Request
        socket.on('signal:reconnect-request', async (data: { from: string }) => {
          if (isDisposed) return;
          if (webrtcManagerRef.current) {
            await webrtcManagerRef.current.initializePeerConnection(data.from, true);
          }
        });

        // Peer Left or Disconnected
        socket.on('user-left', () => {
          if (isDisposed) return;
          setPeerDisconnected(true);
          setRemoteStream(null);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (webrtcManagerRef.current) {
            webrtcManagerRef.current.close();
          }
        });

        // Status changed
        socket.on('interview-status', (data: { status: string }) => {
          if (isDisposed) return;
          setInterview((prev: any) => (prev ? { ...prev, status: data.status } : prev));
        });

        // Interview ended by peer
        socket.on('interview:ended', (data: { reportId?: string }) => {
          if (isDisposed) return;
          alert('This interview has concluded. Generating AI scorecard...');
          const currentInterview = interviewRef.current;
          const currentUser = userRef.current;
          const isInterviewerNow =
            currentUser?.role === 'interviewer' ||
            currentUser?.role === 'admin' ||
            String(currentInterview?.interviewerId) === String(currentUser?.id);

          if (data?.reportId) {
            onSelectViewRef.current('report-view', { reportId: data.reportId });
          } else {
            onSelectViewRef.current(isInterviewerNow ? 'interviewer-dashboard' : 'dashboard');
          }
        });

      } catch (err: any) {
        if (!isDisposed) {
          setError(err?.message || 'Access denied or failed to load scheduled interview room.');
          setLoading(false);
        }
      }
    }

    initRoom();

    // Cleanup on unmount or room change
    return () => {
      isDisposed = true;
      speechService.stopListening();

      // Stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      // Close WebRTC
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.close();
        webrtcManagerRef.current = null;
      }

      // Leave socket room
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
        socketRef.current.off('room-error');
        socketRef.current.off('joined-room');
        socketRef.current.off('user-joined');
        socketRef.current.off('signal:offer');
        socketRef.current.off('signal:answer');
        socketRef.current.off('signal:ice-candidate');
        socketRef.current.off('media:state');
        socketRef.current.off('signal:reconnect-request');
        socketRef.current.off('user-left');
        socketRef.current.off('interview-status');
        socketRef.current.off('interview:ended');
      }
      disconnectInterviewSocket();
    };
  }, [roomId, initLocalMedia]);

  // Keep video elements bound to streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isCameraOff]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, peerDisconnected]);

  // Copy meeting link
  const handleCopyMeetingLink = () => {
    const link = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Open separate tab fallback
  const handleOpenSeparateTab = () => {
    if (interview?.meetingUrl) {
      window.open(interview.meetingUrl, '_blank');
    } else {
      const roomSlug = (interview?.roomId || roomId).replace(/[^a-zA-Z0-9]/g, '_');
      window.open(`https://meet.jit.si/Interview_ai_${roomSlug}`, '_blank');
    }
  };

  // Save Interviewer Live Notes
  const handleSaveNotes = async () => {
    if (!interview) return;
    setIsSavingNotes(true);
    try {
      await api.scheduled.saveNotes(interview.id || interview._id || interview.roomId, interviewerNotes);
    } catch (err) {
      console.warn('Note save warning:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Speech Recognition transcription toggle
  const handleToggleSpeechTranscription = () => {
    if (isListeningSpeech) {
      speechService.stopListening();
      setIsListeningSpeech(false);
      setCurrentSpeech('');
    } else {
      setIsListeningSpeech(true);
      speechService.startListening({
        onResult: (text, isFinal) => {
          setCurrentSpeech(text);
          if (isFinal && text.trim()) {
            const newItem = {
              speaker: user?.fullName || (isInterviewer ? 'Interviewer' : 'Candidate'),
              text: text.trim(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            setTranscript((prev) => [...prev, newItem]);
            setCurrentSpeech('');

            // Save to backend transcript
            api.scheduled.saveTranscriptItem(interview.id || interview._id || interview.roomId, newItem).catch(() => {});
          }
        },
        onError: (err) => {
          console.warn('Speech transcription notice:', err);
          setIsListeningSpeech(false);
        },
      });
    }
  };

  // Submit manual transcript entry (fail-safe for non-Chromium browsers)
  const handleSendManualTranscript = () => {
    if (!manualTranscriptInput.trim() || !interview) return;
    const newItem = {
      speaker: user?.fullName || (isInterviewer ? 'Interviewer' : 'Candidate'),
      text: manualTranscriptInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setTranscript((prev) => [...prev, newItem]);
    setManualTranscriptInput('');
    api.scheduled.saveTranscriptItem(interview.id || interview._id || interview.roomId, newItem).catch(() => {});
  };

  // End Interview & Generate AI Report
  const handleEndInterviewAndEvaluate = async () => {
    if (!window.confirm('Are you sure you want to end this interview and generate the Navneet AI evaluation scorecard?')) {
      return;
    }

    setIsEnding(true);
    speechService.stopListening();
    setIsListeningSpeech(false);

    try {
      // Notify peer via socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interview:end', { roomId });
      }

      // Generate AI scorecard from transcript & notes
      const res = await api.scheduled.end(
        interview.id || interview._id || interview.roomId,
        transcript,
        interviewerNotes
      );

      // Route directly to generated report
      onSelectView('report-view', { reportId: res.reportId });
    } catch (err: any) {
      alert(err?.message || 'Failed to generate AI evaluation report.');
      setIsEnding(false);
    }
  };

  // Leave room without ending
  const handleLeaveRoom = () => {
    speechService.stopListening();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.close();
    }
    if (interview && (interview.id || interview._id || interview.roomId)) {
      api.scheduled.leave(interview.id || interview._id || interview.roomId).catch(() => {});
    }
    onSelectView(user?.role === 'interviewer' ? 'interviewer-dashboard' : 'dashboard');
  };

  // Suggested interview questions based on job role
  const suggestedQuestions = [
    {
      category: 'System Architecture & Scale',
      question: `How would you design a fault-tolerant distributed system for ${interview?.jobRole || 'this position'}?`,
    },
    {
      category: 'Technical Trade-offs',
      question: 'Walk me through a difficult technical tradeoff you made between development velocity and long-term maintainability.',
    },
    {
      category: 'Problem Solving & Debugging',
      question: 'Describe an unexpected production outage or critical bug you investigated and how you resolved it under pressure.',
    },
    {
      category: 'Collaboration & Leadership',
      question: 'How do you handle disagreements on technical design decisions within an engineering team?',
    },
  ];

  // Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-center p-8">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-white">Entering Live Interview Room...</h3>
        <p className="text-xs text-slate-400 mt-1">
          Verifying security authorization and setting up encrypted WebRTC media session
        </p>
      </div>
    );
  }

  // Access Denied / Error Screen
  if (error) {
    const isCancelled = error.toLowerCase().includes('cancel');
    const isCompleted = error.toLowerCase().includes('complet');

    return (
      <div className="max-w-md mx-auto my-14 p-8 bg-[#0f172a] border border-red-900/80 rounded-2xl text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">
          {isCancelled
            ? 'Interview Cancelled'
            : isCompleted
            ? 'Interview Completed'
            : 'Room Access Denied'}
        </h3>
        <p className="text-xs text-red-300 mt-2 leading-relaxed">{error}</p>
        <p className="text-[11px] text-slate-400 mt-3">
          {isCancelled
            ? 'This live interview was cancelled by the host. Please contact your interviewer if you have questions.'
            : isCompleted
            ? 'This live interview has concluded. You can view its evaluation scorecard in your interview history.'
            : 'Only the assigned candidate and interviewer can enter this private room (maximum 2 participants).'}
        </p>
        <button
          onClick={() => onSelectView(user?.role === 'interviewer' ? 'interviewer-dashboard' : 'dashboard')}
          className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const peerDisplayName =
    remotePeerInfo?.name || (isInterviewer ? interview?.candidateName : interview?.interviewerName);
  const peerDisplayRole =
    remotePeerInfo?.role || (isInterviewer ? 'Candidate' : 'Interviewer');

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Top Meeting Control & Info Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white">{interview?.jobRole}</h1>
              <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                Live interview
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>
                Candidate: <strong className="text-slate-200">{interview?.candidateName}</strong>
              </span>
              <span>•</span>
              <span>
                Interviewer: <strong className="text-slate-200">{interview?.interviewerName}</strong>
              </span>
              <span>•</span>
              <span>
                Room ID: <span className="font-mono text-slate-300">{interview?.roomId}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Call Duration */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatTime(callDuration)}</span>
          </div>

          {/* Copy Meeting Link */}
          <button
            id="btn-copy-meeting-link"
            onClick={handleCopyMeetingLink}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>

          {/* Direct Tab / External Fallback */}
          <button
            id="btn-open-fallback-tab"
            onClick={handleOpenSeparateTab}
            title="Open external meeting tab"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">External Backup</span>
          </button>

          {/* End & Generate AI Report or Leave */}
          <button
            id="btn-end-and-evaluate"
            onClick={handleEndInterviewAndEvaluate}
            disabled={isEnding}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/25 flex items-center gap-2 disabled:opacity-50"
          >
            {isEnding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating AI Scorecard...</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5" />
                <span>End & Generate AI Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Permission Warning Banner (if any) */}
      {permissionError && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button
            onClick={initLocalMedia}
            disabled={isRequestingMedia}
            className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors shrink-0"
          >
            {isRequestingMedia ? 'Requesting...' : 'Retry Permissions'}
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Native WebRTC Video Stage (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl h-[540px] sm:h-[620px] flex flex-col">
            {/* Top Video Stage Header */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[11px] font-semibold text-white flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      remoteStream ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {remoteStream
                      ? 'P2P WebRTC Connected'
                      : peerDisconnected
                      ? 'Participant Disconnected'
                      : 'Waiting for Peer to Join...'}
                  </span>
                </span>
                <span className="px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[11px] text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{remoteStream ? '2 / 2 Active' : '1 / 2 Active'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={handleReconnect}
                  title="Refresh WebRTC connection"
                  className="px-2.5 py-1 bg-black/80 hover:bg-black text-slate-300 hover:text-white rounded-lg border border-white/10 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reconnect</span>
                </button>
              </div>
            </div>

            {/* Video Canvas Grid */}
            <div className="relative w-full h-full flex flex-col sm:flex-row items-stretch justify-center bg-[#020617] overflow-hidden">
              {/* Remote Participant Video Tile */}
              <div className="relative flex-1 h-full flex items-center justify-center bg-slate-950 overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-800/80">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${
                    remoteStream && !peerDisconnected ? 'block' : 'hidden'
                  }`}
                />
                {(!remoteStream || peerDisconnected) && (
                  <div className="text-center p-6 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <Users className="w-8 h-8 text-slate-500" />
                    </div>
                    <h4 className="text-sm font-bold text-white">{peerDisplayName}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                      {peerDisplayRole}
                    </span>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      {peerDisconnected
                        ? 'The other participant briefly disconnected. Waiting for them to reconnect...'
                        : 'Waiting for the participant to enter this room using Room ID ' +
                          (interview?.roomId || roomId)}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] text-emerald-400 font-mono">Listening for incoming peer...</span>
                    </div>
                  </div>
                )}

                {/* Remote Participant Overlay Tag */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                  <div className="px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg border border-white/10 text-[11px] font-semibold text-white flex items-center gap-2">
                    <span>{peerDisplayName}</span>
                    <span className="text-[10px] text-slate-400">({peerDisplayRole})</span>
                    {remotePeerInfo?.micEnabled === false && (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Local Participant Video Tile */}
              <div className="relative w-full sm:w-[45%] lg:w-[40%] h-full flex items-center justify-center bg-slate-900/60 overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${
                    localStream && !isCameraOff ? 'block' : 'hidden'
                  }`}
                />
                {(!localStream || isCameraOff) && (
                  <div className="text-center p-6">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-2">
                      <VideoOff className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-xs font-semibold text-white">Camera is Off</p>
                    <p className="text-[11px] text-slate-500 mt-1">Audio feed is still active</p>
                  </div>
                )}

                {/* Local Participant Overlay Tag */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                  <div className="px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg border border-white/10 text-[11px] font-semibold text-white flex items-center gap-2">
                    <span>You ({user?.fullName})</span>
                    <span className="text-[10px] text-slate-400">({isInterviewer ? 'Interviewer' : 'Candidate'})</span>
                    {isMicMuted ? (
                      <MicOff className="w-3 h-3 text-red-400" />
                    ) : (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* In-Video Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 bg-black/85 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
              {/* Mic Toggle */}
              <button
                id="btn-toggle-mic"
                onClick={toggleMic}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isMicMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera Toggle */}
              <button
                id="btn-toggle-cam"
                onClick={toggleCamera}
                title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isCameraOff
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Screen Share Toggle */}
              <button
                id="btn-toggle-screen"
                onClick={toggleScreenShare}
                title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isScreenSharing
                    ? 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-500'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* Speech Transcription Quick Toggle */}
              <button
                id="btn-quick-transcribe"
                onClick={handleToggleSpeechTranscription}
                title={isListeningSpeech ? 'Pause AI transcription' : 'Start AI transcription'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListeningSpeech
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-slate-700 mx-1" />

              {/* Leave Room Button */}
              <button
                id="btn-leave-call"
                onClick={handleLeaveRoom}
                title="Leave room"
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Quick Info & Security Details */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <BrandIcon size={14} variant="dark" withTile={false} />
              <span>
                Engine: <strong>Interview.ai Native WebRTC Peer-to-Peer HD Stream</strong>
              </span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              ICE STUN Active • Max 2 Verified Participants • End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* Right: Live Interviewer Notes, Real-time Speech Captions, & Rubric (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Tab Navigation */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-1.5 flex items-center gap-1">
            <button
              id="tab-notes"
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'notes'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
            <button
              id="tab-transcript"
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'transcript'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Transcript</span>
            </button>
            <button
              id="tab-questions"
              onClick={() => setActiveTab('questions')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'questions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Rubric</span>
            </button>
          </div>

          {/* Tab 1: Live Assessment Notes */}
          {activeTab === 'notes' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col h-[540px] sm:h-[580px] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {isInterviewer ? 'Interviewer Assessment Notes' : 'Candidate Session Notes'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isInterviewer
                      ? 'Notes are analyzed by Navneet to generate the comprehensive scorecard.'
                      : 'Private scratchpad for system design sketches or key thoughts.'}
                  </p>
                </div>
                {isInterviewer && (
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                  >
                    {isSavingNotes ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{isSavingNotes ? 'Saving...' : 'Save'}</span>
                  </button>
                )}
              </div>

              <textarea
                value={interviewerNotes}
                onChange={(e) => setInterviewerNotes(e.target.value)}
                placeholder={
                  isInterviewer
                    ? 'Note candidate strengths, technical depth, system design choices, and cultural alignment...\n\nExample:\n• Strong articulation of database sharding and index trade-offs.\n• Clear explanation of React state caching patterns.\n• Needs slight encouragement when handling edge case concurrency.'
                    : 'Personal scratchpad for jotting down key formulas, algorithms, or questions for the interviewer...'
                }
                className="w-full flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans leading-relaxed"
              />

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{interviewerNotes.length} characters</span>
                <span className="text-purple-400 font-medium">Auto-included in AI Scorecard</span>
              </div>
            </div>
          )}

          {/* Tab 2: Real-Time Speech Captions & Transcript */}
          {activeTab === 'transcript' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col h-[540px] sm:h-[580px] shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Speech Transcription
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Transcribed speech is analyzed for STAR metrics.</p>
                </div>
                <button
                  onClick={handleToggleSpeechTranscription}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all border ${
                    isListeningSpeech
                      ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                      : 'bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30'
                  }`}
                >
                  {isListeningSpeech ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  <span>{isListeningSpeech ? 'Transcribing' : 'Start Mic'}</span>
                </button>
              </div>

              {/* Transcript list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {transcript.length === 0 && !currentSpeech && (
                  <div className="text-center py-12 text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No transcript entries yet.</p>
                    <p className="text-[11px] mt-1 text-slate-600">
                      Click "Start Mic" above to transcribe live dialogue in real time.
                    </p>
                  </div>
                )}

                {transcript.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-300">{item.speaker}</span>
                      <span className="font-mono text-slate-500">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-xs">{item.text}</p>
                  </div>
                ))}

                {currentSpeech && (
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/50 italic text-blue-300 text-xs animate-pulse">
                    <span className="text-[10px] block font-bold text-blue-400 mb-0.5">Speaking:</span>
                    "{currentSpeech}..."
                  </div>
                )}
              </div>

              {/* Manual transcript / remark input for cross-browser fallback */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="Type spoken response or remark..."
                  value={manualTranscriptInput}
                  onChange={(e) => setManualTranscriptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendManualTranscript();
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendManualTranscript}
                  disabled={!manualTranscriptInput.trim()}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Suggested Competency Questions */}
          {activeTab === 'questions' && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col h-[540px] sm:h-[580px] shadow-xl overflow-y-auto">
              <div className="pb-3 border-b border-slate-800 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recommended Interview Prompts
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tailored to {interview?.jobRole} ({interview?.interviewType})
                </p>
              </div>

              <div className="space-y-3">
                {suggestedQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {q.category}
                    </span>
                    <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">{q.question}</p>
                    {isInterviewer && (
                      <button
                        onClick={() =>
                          setInterviewerNotes((prev) => `${prev}\n\n[Topic: ${q.category}]\n${q.question}\nFeedback: `)
                        }
                        className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                      >
                        + Add to notes
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
