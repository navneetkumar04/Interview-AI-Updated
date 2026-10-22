/**
 * Client-side WebRTC Service & ICE Server Configuration
 * 
 * Directives:
 * - TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL are optional.
 * - If their values are none, empty, or missing, completely disable TURN configuration
 *   and use normal WebRTC/STUN only.
 * - Never attempt to connect to a TURN server using placeholder values.
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_STUN_SERVERS: IceServerConfig[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302',
      'stun:stun.services.mozilla.com',
      'stun:stun.cloudflare.com:3478',
    ],
  },
];

/**
 * Checks if a string value is considered empty, 'none', or a placeholder.
 */
export function isPlaceholderOrEmpty(val?: string | null): boolean {
  if (val === undefined || val === null) return true;
  const str = String(val).trim();
  if (str === '') return true;

  const lower = str.toLowerCase();
  if (
    lower === 'none' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'false' ||
    lower === 'disabled' ||
    lower === 'no' ||
    lower === 'n/a'
  ) {
    return true;
  }

  if (
    lower === 'turn_url' ||
    lower === 'my_turn_url' ||
    lower === 'your_turn_url' ||
    lower === 'turn_username' ||
    lower === 'turn_credential' ||
    lower === 'username' ||
    lower === 'password' ||
    lower === 'secret' ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    lower.includes('your-turn-server')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates whether a URL starts with a legitimate turn: or turns: scheme.
 */
export function isValidTurnUrl(url?: string | null): boolean {
  if (isPlaceholderOrEmpty(url)) return false;
  const lower = String(url).trim().toLowerCase();
  return lower.startsWith('turn:') || lower.startsWith('turns:');
}

/**
 * Resolves the client-side ICE servers configuration.
 * Adheres strictly to the mandate: if TURN_URL, TURN_USERNAME, or TURN_CREDENTIAL
 * are none, empty, missing, or placeholders, TURN is completely omitted.
 */
export function getIceServers(options?: {
  turnUrl?: string | null;
  turnUsername?: string | null;
  turnCredential?: string | null;
}): {
  iceServers: IceServerConfig[];
  turnEnabled: boolean;
  reason?: string;
} {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : ({} as any);

  const turnUrl = options?.turnUrl !== undefined
    ? options.turnUrl
    : (env.VITE_TURN_URL || env.TURN_URL);

  const turnUsername = options?.turnUsername !== undefined
    ? options.turnUsername
    : (env.VITE_TURN_USERNAME || env.TURN_USERNAME);

  const turnCredential = options?.turnCredential !== undefined
    ? options.turnCredential
    : (env.VITE_TURN_CREDENTIAL || env.TURN_CREDENTIAL);

  // If TURN_URL is missing, empty, "none", or placeholder -> STUN only
  if (isPlaceholderOrEmpty(turnUrl)) {
    return {
      iceServers: DEFAULT_STUN_SERVERS,
      turnEnabled: false,
      reason: 'TURN_URL is empty, none, missing, or placeholder. Using normal WebRTC/STUN only.',
    };
  }

  // If TURN_URL lacks valid turn: or turns: scheme -> STUN only
  if (!isValidTurnUrl(turnUrl)) {
    return {
      iceServers: DEFAULT_STUN_SERVERS,
      turnEnabled: false,
      reason: 'TURN_URL is invalid. Using normal WebRTC/STUN only.',
    };
  }

  // If credentials are missing, empty, "none", or placeholder -> STUN only
  if (isPlaceholderOrEmpty(turnUsername) || isPlaceholderOrEmpty(turnCredential)) {
    return {
      iceServers: DEFAULT_STUN_SERVERS,
      turnEnabled: false,
      reason: 'TURN credentials are missing, empty, none, or placeholder. Using normal WebRTC/STUN only.',
    };
  }

  // All values are validated and non-placeholder -> safely include TURN
  return {
    iceServers: [
      ...DEFAULT_STUN_SERVERS,
      {
        urls: String(turnUrl).trim(),
        username: String(turnUsername).trim(),
        credential: String(turnCredential).trim(),
      },
    ],
    turnEnabled: true,
  };
}

let cachedIceServers: IceServerConfig[] | null = null;

export async function fetchServerIceServers(): Promise<IceServerConfig[]> {
  if (cachedIceServers && cachedIceServers.length > 0) {
    return cachedIceServers;
  }
  try {
    const res = await fetch('/api/webrtc/config');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        cachedIceServers = data.iceServers;
        return cachedIceServers;
      }
    }
  } catch {
    // Fallback to local STUN-only configuration
  }
  const fallback = getIceServers().iceServers;
  cachedIceServers = fallback;
  return fallback;
}

export interface WebRTCManagerCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (err: Error) => void;
  sendSignal: (event: string, payload: any) => void;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteMediaStream: MediaStream = new MediaStream();
  private callbacks: WebRTCManagerCallbacks;
  private targetSocketId: string | null = null;
  private isInitiator: boolean = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  constructor(callbacks: WebRTCManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public async initializePeerConnection(targetSocketId: string, isInitiator: boolean): Promise<RTCPeerConnection> {
    this.targetSocketId = targetSocketId;
    this.isInitiator = isInitiator;
    this.remoteMediaStream = new MediaStream();

    // Use synchronously available ICE servers to prevent delaying signaling
    const iceServers = cachedIceServers || getIceServers().iceServers;
    fetchServerIceServers().catch(() => {});

    const config: RTCConfiguration = {
      iceServers: iceServers as RTCIceServer[],
      iceCandidatePoolSize: 2,
    };

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }

    this.peerConnection = new RTCPeerConnection(config);

    // Attach local media tracks if stream exists
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          try {
            this.peerConnection.addTrack(track, this.localStream);
          } catch (e) {
            console.warn('Track add warning:', e);
          }
        }
      });
    }

    // Handle remote media tracks - aggregate audio & video into persistent remote stream
    this.peerConnection.ontrack = (event) => {
      // 1. If individual track supplied
      if (event.track) {
        const existingTracks = this.remoteMediaStream.getTracks();
        const sameKindTracks = existingTracks.filter((t) => t.kind === event.track.kind);
        // Replace outdated track of same kind if id differs
        sameKindTracks.forEach((t) => {
          if (t.id !== event.track.id) {
            this.remoteMediaStream.removeTrack(t);
          }
        });
        if (!this.remoteMediaStream.getTrackById(event.track.id)) {
          this.remoteMediaStream.addTrack(event.track);
        }
      }

      // 2. If streams array supplied
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteMediaStream.getTrackById(track.id)) {
            this.remoteMediaStream.addTrack(track);
          }
        });
      }

      // 3. Emit a newly cloned MediaStream reference so React state hooks trigger clean re-renders
      const combinedStream = new MediaStream(this.remoteMediaStream.getTracks());
      this.callbacks.onRemoteStream?.(combinedStream);
    };

    // Forward ICE candidates through signaling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.targetSocketId) {
        this.callbacks.sendSignal('signal:ice-candidate', {
          to: this.targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection states
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        this.callbacks.onConnectionStateChange?.(this.peerConnection.connectionState);
      }
    };

    // Monitor ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        const iceState = this.peerConnection.iceConnectionState;
        if (iceState === 'failed' || iceState === 'disconnected') {
          console.warn('ICE connection state:', iceState);
        }
      }
    };

    // If initiator, generate offer
    if (isInitiator) {
      try {
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await this.peerConnection.setLocalDescription(offer);
        this.callbacks.sendSignal('signal:offer', {
          to: targetSocketId,
          offer,
        });
      } catch (err: any) {
        this.callbacks.onError?.(err);
      }
    }

    return this.peerConnection;
  }

  public async handleOffer(offer: RTCSessionDescriptionInit, fromSocketId: string): Promise<void> {
    this.targetSocketId = fromSocketId;
    if (!this.peerConnection) {
      await this.initializePeerConnection(fromSocketId, false);
    }
    if (this.peerConnection) {
      // Ensure local tracks are attached before generating answer
      if (this.localStream) {
        const senders = this.peerConnection.getSenders();
        for (const track of this.localStream.getTracks()) {
          if (!senders.some((s) => s.track === track || s.track?.kind === track.kind)) {
            try {
              this.peerConnection.addTrack(track, this.localStream);
            } catch (e) {
              console.warn('Track attach error before answer:', e);
            }
          }
        }
      }

      // Glare handling: If signalingState is not stable, rollback local offer to resolve collision cleanly
      if (this.peerConnection.signalingState !== 'stable') {
        try {
          await Promise.all([
            this.peerConnection.setLocalDescription({ type: 'rollback' }),
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer)),
          ]);
        } catch {
          // If browser doesn't support rollback, re-initialize as receiver
          await this.initializePeerConnection(fromSocketId, false);
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        }
      } else {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      }

      await this.drainPendingCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.callbacks.sendSignal('signal:answer', {
        to: fromSocketId,
        answer,
      });
    }
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection && this.peerConnection.signalingState === 'have-local-offer') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainPendingCandidates();
    }
  }

  public async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!candidate) return;

    if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (err: any) {
        console.warn('ICE candidate addition error:', err);
      }
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  private async drainPendingCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    const candidates = [...this.pendingCandidates];
    this.pendingCandidates = [];
    for (const cand of candidates) {
      try {
        await this.peerConnection.addIceCandidate(cand);
      } catch (e) {
        console.warn('Deferred candidate addition warning:', e);
      }
    }
  }

  public async restartIce(): Promise<void> {
    if (this.peerConnection && this.targetSocketId) {
      try {
        const offer = await this.peerConnection.createOffer({ iceRestart: true });
        await this.peerConnection.setLocalDescription(offer);
        this.callbacks.sendSignal('signal:offer', {
          to: this.targetSocketId,
          offer,
        });
      } catch (err) {
        console.warn('ICE restart error:', err);
      }
    }
  }

  public setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream;
    if (stream && this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      let newTrackAdded = false;
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((e) => console.warn('replaceTrack warning:', e));
        } else {
          try {
            this.peerConnection?.addTrack(track, stream);
            newTrackAdded = true;
          } catch (e) {
            console.warn('addTrack warning:', e);
          }
        }
      });

      // If tracks were added to an existing connection, initiate renegotiation so the peer receives them
      if (newTrackAdded && this.targetSocketId && this.peerConnection.signalingState === 'stable') {
        this.peerConnection
          .createOffer()
          .then((offer) => this.peerConnection!.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            this.callbacks.sendSignal('signal:offer', {
              to: this.targetSocketId,
              offer,
            });
          })
          .catch((err) => console.warn('Renegotiation error:', err));
      }
    }
  }

  public close(): void {
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
    this.remoteMediaStream = new MediaStream();
    this.targetSocketId = null;
    this.pendingCandidates = [];
  }
}
