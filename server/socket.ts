import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewai-default-jwt-secret-key-change-in-prod';

interface SocketUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for socket connections
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token as string, JWT_SECRET) as SocketUser;
      const user = await db.findUserById(decoded.id);
      if (!user || user.isBlocked) {
        return next(new Error('Unauthorized or blocked user'));
      }
      (socket as any).user = {
        id: user.id || (user._id ? user._id.toString() : decoded.id),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as SocketUser;
    console.log(`Socket connected: ${user.fullName} (${user.role}) - ID: ${socket.id}`);

    // Join Interview Room
    socket.on('join-room', async ({ roomId }: { roomId: string }) => {
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID required' });
      }

      // Check room in database
      const interview = await db.findScheduledInterviewByRoomId(roomId);
      if (!interview) {
        return socket.emit('room-error', { message: 'Interview room not found' });
      }

      // Authorization check: Only assigned candidate and interviewer can enter the room (and admin)
      const userEmail = (user.email || '').trim().toLowerCase();
      const candEmail = (interview.candidateEmail || '').trim().toLowerCase();
      const isCandidate =
        Boolean(interview.candidateId && String(interview.candidateId) === String(user.id)) ||
        Boolean(candEmail && userEmail && candEmail === userEmail);
      const isInterviewer = String(interview.interviewerId) === String(user.id);
      const isAdmin = user.role === 'admin';

      if (!isCandidate && !isInterviewer && !isAdmin) {
        return socket.emit('room-error', {
          message: 'Unauthorized: Only the assigned candidate and interviewer can enter this private interview room.',
        });
      }

      if (interview.status === 'cancelled') {
        return socket.emit('room-error', {
          message: 'This interview has been cancelled by the host.',
        });
      }

      // Auto-link candidate ID if needed
      if (isCandidate && (!interview.candidateId || interview.candidateId !== user.id)) {
        await db.updateScheduledInterview(roomId, {
          candidateId: user.id,
          candidateName: user.fullName,
        });
        interview.candidateId = user.id;
      }

      const room = io.sockets.adapter.rooms.get(roomId);
      const isAlreadyInRoom = room && room.has(socket.id);
      const numClients = room ? room.size : 0;

      // Strictly enforce maximum 2 participants per room
      if (!isAlreadyInRoom && numClients >= 2) {
        return socket.emit('room-error', {
          message: 'Interview room is full: Maximum 2 participants allowed.',
        });
      }

      socket.join(roomId);
      (socket as any).currentRoomId = roomId;

      // Notify others in room of new participant
      socket.to(roomId).emit('user-joined', {
        userId: user.id,
        userName: user.fullName,
        role: user.role,
        socketId: socket.id,
      });

      // Collect existing participants in the room
      const existingParticipants: Array<{
        socketId: string;
        userId?: string;
        userName?: string;
        role?: string;
      }> = [];
      const existingUsers: string[] = [];

      if (room) {
        for (const clientId of room) {
          if (clientId !== socket.id) {
            existingUsers.push(clientId);
            const clientSocket = io.sockets.sockets.get(clientId);
            const clientUser = (clientSocket as any)?.user;
            existingParticipants.push({
              socketId: clientId,
              userId: clientUser?.id,
              userName: clientUser?.fullName,
              role: clientUser?.role,
            });
          }
        }
      }

      // Transition interview status to 'in_progress'
      if (interview.status === 'scheduled' || interview.status === 'waiting') {
        await db.updateScheduledInterview(roomId, { status: 'in_progress' });
        interview.status = 'in_progress';
        io.to(roomId).emit('interview-status', { status: 'in_progress' });
      }

      socket.emit('joined-room', {
        roomId,
        existingUsers,
        existingParticipants,
        interviewStatus: interview.status,
        participantCount: numClients + (isAlreadyInRoom ? 0 : 1),
      });
    });

    // WebRTC Signaling: Offer
    socket.on('signal:offer', ({ to, offer }: { to: string; offer: any }) => {
      socket.to(to).emit('signal:offer', {
        from: socket.id,
        offer,
        user: {
          id: user.id,
          name: user.fullName,
          role: user.role,
        },
      });
    });

    // WebRTC Signaling: Answer
    socket.on('signal:answer', ({ to, answer }: { to: string; answer: any }) => {
      socket.to(to).emit('signal:answer', {
        from: socket.id,
        answer,
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('signal:ice-candidate', ({ to, candidate }: { to: string; candidate: any }) => {
      socket.to(to).emit('signal:ice-candidate', {
        from: socket.id,
        candidate,
      });
    });

    // WebRTC Media State Broadcast (Mic/Camera muted)
    socket.on('media:state', ({ roomId, micEnabled, camEnabled }: { roomId: string; micEnabled: boolean; camEnabled: boolean }) => {
      if (!roomId) return;
      socket.to(roomId).emit('media:state', {
        from: socket.id,
        micEnabled,
        camEnabled,
      });
    });

    // WebRTC Renegotiation Request (for reconnects)
    socket.on('signal:reconnect-request', ({ to }: { to: string }) => {
      socket.to(to).emit('signal:reconnect-request', {
        from: socket.id,
      });
    });

    // Live Transcript update broadcast
    socket.on(
      'transcript:update',
      async ({
        roomId,
        item,
      }: {
        roomId: string;
        item: { speaker: string; text: string; timestamp: string };
      }) => {
        if (!roomId || !item) return;

        // Broadcast to everyone else in room
        socket.to(roomId).emit('transcript:update', item);

        // Append to interview record in database
        try {
          const interview = await db.findScheduledInterviewByRoomId(roomId);
          if (interview) {
            const transcript = interview.transcript || [];
            transcript.push(item);
            await db.updateScheduledInterview(roomId, { transcript });
          }
        } catch (err) {
          console.warn('Transcript save error:', err);
        }
      }
    );

    // End interview signal
    socket.on('interview:end', async ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      const interview = await db.findScheduledInterviewByRoomId(roomId);
      if (interview) {
        await db.updateScheduledInterview(roomId, { status: 'completed' });
        io.to(roomId).emit('interview:ended', { roomId });
      }
    });

    // Leave room
    socket.on('leave-room', () => {
      const roomId = (socket as any).currentRoomId;
      if (roomId) {
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userId: user.id,
          userName: user.fullName,
        });
        (socket as any).currentRoomId = null;
      }
    });

    socket.on('disconnect', () => {
      const roomId = (socket as any).currentRoomId;
      if (roomId) {
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userId: user.id,
          userName: user.fullName,
        });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
