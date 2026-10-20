import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Ensure IPv4 first and resolve Atlas SRV records via reliable public DNS
try {
  dns.setDefaultResultOrder?.('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}
import {
  UserModel,
  InterviewModel,
  ScheduledInterviewModel,
  AvatarInterviewModel,
  ReportModel,
  ResumeModel,
  RoadmapModel,
  AnalyticsModel,
} from './models.js';

let isMongooseConnected = false;

// In-Memory store for preview / fallback resiliency
export interface MemoryStore {
  users: any[];
  interviews: any[];
  scheduledInterviews: any[];
  avatarInterviews: any[];
  reports: any[];
  resumes: any[];
  roadmaps: any[];
  analytics: any[];
}

export const memoryStore: MemoryStore = {
  users: [],
  interviews: [],
  scheduledInterviews: [],
  avatarInterviews: [],
  reports: [],
  resumes: [],
  roadmaps: [],
  analytics: [],
};

export async function initDatabase() {
  const uri = process.env.MONGODB_URI;
  if (uri && !uri.includes('username:password')) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        family: 4,
      });
      isMongooseConnected = true;
      console.log('MongoDB connected successfully.');
    } catch (err: any) {
      console.warn('MongoDB connection failed, falling back to resilient local memory store:', err.message);
      isMongooseConnected = false;
    }
  } else {
    console.log('No valid MONGODB_URI provided in environment. Utilizing resilient in-memory database store.');
  }

  // Seed default demo users if they do not exist
  await seedInitialData();
}

async function seedInitialData() {
  const defaultPassword = await bcrypt.hash('Admin@123', 10);
  const adminPassword = defaultPassword;
  const interviewerPassword = defaultPassword;
  const candidatePassword = defaultPassword;

  const defaultUsers = [
    {
      id: 'user_admin_001',
      _id: 'user_admin_001',
      fullName: 'System Administrator',
      email: 'admin@interview.ai',
      password: adminPassword,
      preferredRole: 'Platform Administrator',
      role: 'admin',
      isBlocked: false,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user_interviewer_001',
      _id: 'user_interviewer_001',
      fullName: 'Marcus Vance',
      email: 'interviewer@interview.ai',
      password: interviewerPassword,
      preferredRole: 'Lead Technical Interviewer',
      role: 'interviewer',
      isBlocked: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user_candidate_001',
      _id: 'user_candidate_001',
      fullName: 'Navneet Kumar',
      email: 'candidate@interview.ai',
      password: candidatePassword,
      preferredRole: 'Full Stack Engineer',
      role: 'candidate',
      isBlocked: false,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user_candidate_002',
      _id: 'user_candidate_002',
      fullName: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      password: candidatePassword,
      preferredRole: 'Frontend Architect (React / Next.js)',
      role: 'candidate',
      isBlocked: false,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user_candidate_003',
      _id: 'user_candidate_003',
      fullName: 'Alex Miller',
      email: 'alex.miller@example.com',
      password: candidatePassword,
      preferredRole: 'Backend Cloud Specialist (Go / Node)',
      role: 'candidate',
      isBlocked: false,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Seed into memory store
  for (const u of defaultUsers) {
    if (!memoryStore.users.some((existing) => existing.email === u.email)) {
      memoryStore.users.push({ ...u });
    }
  }

  // Seed sample scheduled interview for testing
  if (memoryStore.scheduledInterviews.length === 0) {
    memoryStore.scheduledInterviews.push({
      id: 'sched_int_001',
      _id: 'sched_int_001',
      roomId: 'room-tech-9921',
      interviewerId: 'user_interviewer_001',
      interviewerName: 'Marcus Vance',
      candidateId: 'user_candidate_001',
      candidateName: 'Navneet Kumar',
      candidateEmail: 'candidate@interview.ai',
      jobRole: 'Full Stack Engineer',
      interviewType: 'Technical',
      mode: 'human',
      scheduledAt: new Date(Date.now() + 3600 * 1000 * 4), // 4 hours later today
      duration: 45,
      status: 'scheduled',
      meetingProvider: 'jitsi',
      meetingRoomName: 'Interview_ai_tech_9921_preview',
      meetingUrl: 'https://meet.jit.si/Interview_ai_tech_9921_preview',
      notes: '',
      transcript: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Seed sample initial interview report for candidate analytics
  if (memoryStore.reports.length === 0) {
    const sampleReportId = 'rep_sample_001';
    memoryStore.reports.push({
      id: sampleReportId,
      _id: sampleReportId,
      candidateId: 'user_candidate_001',
      candidateName: 'Navneet Kumar',
      jobRole: 'Full Stack Engineer',
      overallScore: 84,
      technicalKnowledge: 88,
      communication: 82,
      problemSolving: 85,
      confidence: 80,
      clarity: 85,
      eyeContact: 88,
      strengths: [
        'Clear articulation of React rendering lifecycle and virtual DOM reconciliation',
        'Strong grasp of RESTful conventions and database indexing strategies',
        'Structured approach to problem solving and edge case identification',
      ],
      weaknesses: [
        'Could elaborate further on distributed caching invalidation patterns',
        'Minor hesitation when discussing complex microservice distributed tracing',
      ],
      suggestions: [
        'Review Redis cluster failover mechanisms',
        'Practice concise 2-minute elevator answers for behavioral conflict questions',
      ],
      recommendedTopics: [
        'Distributed Consensus (Raft/Paxos)',
        'PostgreSQL Query Optimization & Index tuning',
        'WebRTC ICE and TURN relay signaling',
      ],
      questionAnalysis: [
        {
          question: 'How do you optimize state management in a high-traffic React dashboard?',
          answer: 'By isolating localized state with React context or Zustand, memoizing expensive derived calculations with useMemo, and preventing unnecessary re-renders via normalized structures.',
          score: 90,
          feedback: 'Comprehensive, accurate and covers modern React patterns.',
          suggestion: 'Mention virtualization libraries like react-window for large tabular views.',
        },
        {
          question: 'Explain how you handle database indexing for frequently filtered collections.',
          answer: 'I identify read queries in slow logs, create compound indexes matching the equality-sort-range rule, and monitor query execution plans using explain analyzers.',
          score: 85,
          feedback: 'Solid explanation adhering to database engineering standards.',
          suggestion: 'Discuss index overhead on heavy write workloads.',
        },
        {
          question: 'Describe a time you resolved a major production bug under high pressure.',
          answer: 'In our checkout microservice, a race condition caused duplicated order receipts. I initiated a rollback to the previous stable release, reproduced the issue with unit tests, introduced Redis distributed locks, and deployed safely within two hours.',
          score: 82,
          feedback: 'Excellent STAR method structure showing leadership and poise.',
          suggestion: 'Quantify the business impact or uptime preserved.',
        },
      ],
      createdAt: new Date(Date.now() - 86400 * 1000 * 2),
    });

    memoryStore.interviews.push({
      id: 'mock_int_sample_001',
      _id: 'mock_int_sample_001',
      candidateId: 'user_candidate_001',
      candidateName: 'Navneet Kumar',
      candidateEmail: 'candidate@interview.ai',
      mode: 'classic',
      jobRole: 'Full Stack Engineer',
      interviewerPersona: 'Senior Engineering Manager',
      difficulty: 'Senior',
      status: 'completed',
      questions: [
        'How do you optimize state management in a high-traffic React dashboard?',
        'Explain how you handle database indexing for frequently filtered collections?',
        'Describe a time you resolved a major production bug under high pressure.',
      ],
      answers: [
        {
          question: 'How do you optimize state management in a high-traffic React dashboard?',
          answer: 'By isolating localized state with React context or Zustand, memoizing expensive derived calculations with useMemo, and preventing unnecessary re-renders via normalized structures.',
          score: 90,
          feedback: 'Comprehensive and covers modern React patterns.',
        },
      ],
      metrics: {
        communication: 82,
        technicalKnowledge: 88,
        problemSolving: 85,
        confidence: 80,
        clarity: 85,
        eyeContact: 88,
      },
      reportId: sampleReportId,
      createdAt: new Date(Date.now() - 86400 * 1000 * 2),
    });
  }

  // Seed Mongoose collections if connected
  if (isMongooseConnected) {
    try {
      for (const u of defaultUsers) {
        const exists = await (UserModel as any).findOne({ email: u.email });
        if (!exists) {
          await (UserModel as any).create(u);
        }
      }
    } catch (e) {
      console.warn('Mongoose initial seed warning:', e);
    }
  }
}

function buildFlexibleIdQuery(id: string, extraFields: Record<string, string> = {}) {
  const isObjId = mongoose.Types.ObjectId.isValid(id);
  const conditions: any[] = [];
  if (isObjId) {
    try {
      conditions.push({ _id: new mongoose.Types.ObjectId(id) });
    } catch {}
  }
  conditions.push({ _id: id });
  conditions.push({ id });
  for (const [key, val] of Object.entries(extraFields)) {
    conditions.push({ [key]: val });
  }
  return { $or: conditions };
}

// Resilient DB Adapter methods
export const db = {
  get isConnected() {
    return isMongooseConnected;
  },

  // Users
  async findUserByEmail(email: string) {
    if (isMongooseConnected) {
      try {
        const u = await (UserModel as any).findOne({ email: email.toLowerCase().trim() }).lean();
        if (u) {
          return {
            ...u,
            id: u.id || (u._id ? u._id.toString() : ''),
          };
        }
      } catch (e) {
        console.warn('Mongoose query fallback:', e);
      }
    }
    return memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async findUserById(id: string) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const u = await (UserModel as any).findOne(query).lean();
        if (u) {
          return {
            ...u,
            id: u.id || (u._id ? u._id.toString() : ''),
          };
        }
      } catch (e) {
        console.warn('Mongoose query fallback:', e);
      }
    }
    return (
      memoryStore.users.find(
        (u) =>
          u.id === id ||
          u._id === id ||
          String(u._id) === String(id) ||
          String(u.id) === String(id)
      ) || null
    );
  },

  async createUser(userData: any) {
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...userData,
      id,
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongooseConnected) {
      try {
        const created = await (UserModel as any).create(doc);
        const obj = created.toObject ? created.toObject() : created;
        const normalized = {
          ...obj,
          id: obj._id ? obj._id.toString() : obj.id,
        };
        memoryStore.users.push(normalized);
        return normalized;
      } catch (e) {
        console.warn('Mongoose create fallback:', e);
      }
    }
    memoryStore.users.push(doc);
    return doc;
  },

  async updateUser(id: string, updates: any) {
    let user = memoryStore.users.find(
      (u) =>
        u.id === id ||
        u._id === id ||
        String(u._id) === String(id) ||
        String(u.id) === String(id)
    );
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date() });
    }
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const updated = await (UserModel as any).findOneAndUpdate(query, updates, { new: true });
        if (updated) {
          const obj = updated.toObject ? updated.toObject() : updated;
          return {
            ...obj,
            id: obj._id ? obj._id.toString() : obj.id,
          };
        }
      } catch (e) {
        console.warn('Mongoose update fallback:', e);
      }
    }
    return user;
  },

  async getAllUsers() {
    if (isMongooseConnected) {
      try {
        const list = await (UserModel as any).find().sort({ createdAt: -1 });
        if (list.length > 0) return list.map((doc: any) => (doc.toObject ? doc.toObject() : doc));
      } catch (e) {
        console.warn('Mongoose getAllUsers fallback:', e);
      }
    }
    return [...memoryStore.users];
  },

  async getCandidates() {
    const all = await this.getAllUsers();
    return all.filter((u) => u.role === 'candidate' || (u.role as any) === 'user');
  },

  async getInterviewers() {
    const all = await this.getAllUsers();
    return all.filter((u) => u.role === 'interviewer');
  },

  // Interviews
  async createInterview(interviewData: any) {
    const id = 'int_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...interviewData,
      id,
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.interviews.unshift(doc);

    if (isMongooseConnected) {
      try {
        const created = await (InterviewModel as any).create(doc);
        return created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Mongoose createInterview fallback:', e);
      }
    }
    return doc;
  },

  async findInterviewById(id: string) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const found = await (InterviewModel as any).findOne(query);
        if (found) return found.toObject ? found.toObject() : found;
      } catch (e) {
        console.warn('Mongoose findInterviewById fallback:', e);
      }
    }
    return memoryStore.interviews.find((i) => i.id === id || i._id === id) || null;
  },

  async updateInterview(id: string, updates: any) {
    const found = memoryStore.interviews.find((i) => i.id === id || i._id === id);
    if (found) {
      Object.assign(found, updates, { updatedAt: new Date() });
    }
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        await (InterviewModel as any).findOneAndUpdate(query, updates, { new: true });
      } catch (e) {
        console.warn('Mongoose updateInterview fallback:', e);
      }
    }
    return found;
  },

  async getInterviewsByCandidate(candidateId: string) {
    if (isMongooseConnected) {
      try {
        const query = {
          $or: [{ candidateId }, { candidateId: String(candidateId) }],
        };
        const list = await (InterviewModel as any).find(query).sort({ createdAt: -1 });
        if (list.length > 0) return list.map((i: any) => (i.toObject ? i.toObject() : i));
      } catch (e) {
        console.warn('Mongoose getInterviewsByCandidate fallback:', e);
      }
    }
    return memoryStore.interviews.filter((i) => String(i.candidateId) === String(candidateId));
  },

  async getAllInterviews() {
    if (isMongooseConnected) {
      try {
        const list = await (InterviewModel as any).find().sort({ createdAt: -1 });
        if (list.length > 0) return list.map((i: any) => (i.toObject ? i.toObject() : i));
      } catch (e) {
        console.warn('Mongoose getAllInterviews fallback:', e);
      }
    }
    return [...memoryStore.interviews];
  },

  // Scheduled Interviews
  async createScheduledInterview(data: any) {
    const id = 'sched_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...data,
      id,
      _id: id,
      status: data.status || 'scheduled',
      transcript: data.transcript || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.scheduledInterviews.unshift(doc);

    if (isMongooseConnected) {
      try {
        const created = await (ScheduledInterviewModel as any).create(doc);
        return created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Mongoose createScheduledInterview fallback:', e);
      }
    }
    return doc;
  },

  async findScheduledInterviewById(id: string) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id, { roomId: id });
        const found = await (ScheduledInterviewModel as any).findOne(query);
        if (found) return found.toObject ? found.toObject() : found;
      } catch (e) {
        console.warn('Mongoose findScheduledInterviewById fallback:', e);
      }
    }
    return memoryStore.scheduledInterviews.find((s) => s.id === id || s._id === id || s.roomId === id) || null;
  },

  async findScheduledInterviewByRoomId(roomId: string) {
    if (isMongooseConnected) {
      try {
        const found = await (ScheduledInterviewModel as any).findOne({ roomId });
        if (found) return found.toObject ? found.toObject() : found;
      } catch (e) {
        console.warn('Mongoose findScheduledInterviewByRoomId fallback:', e);
      }
    }
    return memoryStore.scheduledInterviews.find((s) => s.roomId === roomId) || null;
  },

  async updateScheduledInterview(idOrRoomId: string, updates: any) {
    const found = memoryStore.scheduledInterviews.find(
      (s) => s.id === idOrRoomId || s._id === idOrRoomId || s.roomId === idOrRoomId
    );
    if (found) {
      Object.assign(found, updates, { updatedAt: new Date() });
    }
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(idOrRoomId, { roomId: idOrRoomId });
        await (ScheduledInterviewModel as any).findOneAndUpdate(
          query,
          updates
        );
      } catch (e) {
        console.warn('Mongoose updateScheduledInterview fallback:', e);
      }
    }
    return found;
  },

  async getScheduledInterviewsForUser(userId: string, role: string, userEmail?: string) {
    const normalizedEmail = (userEmail || '').trim().toLowerCase();
    if (isMongooseConnected) {
      try {
        const query =
          role === 'admin'
            ? {}
            : role === 'interviewer'
            ? { $or: [{ interviewerId: userId }, { interviewerId: String(userId) }] }
            : {
                $or: [
                  { candidateId: userId },
                  { candidateId: String(userId) },
                  ...(normalizedEmail
                    ? [{ candidateEmail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }]
                    : []),
                ],
              };
        const list = await (ScheduledInterviewModel as any).find(query).sort({ scheduledAt: -1 });
        if (list && list.length > 0) return list.map((s: any) => (s.toObject ? s.toObject() : s));
      } catch (e) {
        console.warn('Mongoose getScheduledInterviewsForUser fallback:', e);
      }
    }
    const all = await this.getAllScheduledInterviews();
    if (role === 'admin') return all;
    if (role === 'interviewer') {
      return all.filter((s) => String(s.interviewerId) === String(userId));
    }
    return all.filter(
      (s) =>
        String(s.candidateId) === String(userId) ||
        (normalizedEmail && s.candidateEmail && s.candidateEmail.trim().toLowerCase() === normalizedEmail)
    );
  },

  async linkPendingInterviewsForCandidate(userId: string, email: string, fullName?: string) {
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Update memoryStore
    for (const s of memoryStore.scheduledInterviews) {
      if (s.candidateEmail && s.candidateEmail.trim().toLowerCase() === normalizedEmail) {
        s.candidateId = userId;
        if (fullName && (!s.candidateName || s.candidateName === s.candidateEmail)) {
          s.candidateName = fullName;
        }
      }
    }

    // 2. Update MongoDB if connected
    if (isMongooseConnected) {
      try {
        const query = {
          candidateEmail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        };
        const updates: any = { candidateId: userId };
        if (fullName) {
          updates.candidateName = fullName;
        }
        await (ScheduledInterviewModel as any).updateMany(query, { $set: updates });
      } catch (e) {
        console.warn('Mongoose linkPendingInterviewsForCandidate fallback error:', e);
      }
    }
  },

  async getAllScheduledInterviews() {
    if (isMongooseConnected) {
      try {
        const list = await (ScheduledInterviewModel as any).find().sort({ scheduledAt: -1 });
        if (list.length > 0) return list.map((s: any) => (s.toObject ? s.toObject() : s));
      } catch (e) {
        console.warn('Mongoose getAllScheduledInterviews fallback:', e);
      }
    }
    return [...memoryStore.scheduledInterviews];
  },

  // Avatar Interviews
  async createAvatarInterview(data: any) {
    const id = 'avatar_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...data,
      id,
      _id: id,
      questions: data.questions || [],
      answers: data.answers || [],
      transcript: data.transcript || [],
      status: data.status || 'in_progress',
      startedAt: data.startedAt || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.avatarInterviews.unshift(doc);

    if (isMongooseConnected) {
      try {
        const created = await (AvatarInterviewModel as any).create(doc);
        return created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Mongoose createAvatarInterview fallback:', e);
      }
    }
    return doc;
  },

  async findAvatarInterviewById(id: string) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const found = await (AvatarInterviewModel as any).findOne(query);
        if (found) return found.toObject ? found.toObject() : found;
      } catch (e) {
        console.warn('Mongoose findAvatarInterviewById fallback:', e);
      }
    }
    return memoryStore.avatarInterviews.find((a) => String(a.id) === String(id) || String(a._id) === String(id)) || null;
  },

  async updateAvatarInterview(id: string, updates: any) {
    const updatedFields = { ...updates, updatedAt: new Date() };
    const idx = memoryStore.avatarInterviews.findIndex(
      (a) => String(a.id) === String(id) || String(a._id) === String(id)
    );
    if (idx !== -1) {
      memoryStore.avatarInterviews[idx] = {
        ...memoryStore.avatarInterviews[idx],
        ...updatedFields,
      };
    }

    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const updated = await (AvatarInterviewModel as any).findOneAndUpdate(
          query,
          { $set: updatedFields },
          { new: true }
        );
        if (updated) return updated.toObject ? updated.toObject() : updated;
      } catch (e) {
        console.warn('Mongoose updateAvatarInterview fallback:', e);
      }
    }

    return idx !== -1 ? memoryStore.avatarInterviews[idx] : null;
  },

  async getAvatarInterviewsByCandidate(candidateId: string) {
    if (isMongooseConnected) {
      try {
        const list = await (AvatarInterviewModel as any)
          .find({
            $or: [{ candidateId }, { candidateId: String(candidateId) }],
          })
          .sort({ startedAt: -1 });
        if (list.length > 0) return list.map((a: any) => (a.toObject ? a.toObject() : a));
      } catch (e) {
        console.warn('Mongoose getAvatarInterviewsByCandidate fallback:', e);
      }
    }
    return memoryStore.avatarInterviews.filter((a) => String(a.candidateId) === String(candidateId));
  },

  async getAllAvatarInterviews() {
    if (isMongooseConnected) {
      try {
        const list = await (AvatarInterviewModel as any).find().sort({ startedAt: -1 });
        if (list.length > 0) return list.map((a: any) => (a.toObject ? a.toObject() : a));
      } catch (e) {
        console.warn('Mongoose getAllAvatarInterviews fallback:', e);
      }
    }
    return [...memoryStore.avatarInterviews];
  },

  // Reports
  async createReport(reportData: any) {
    const id = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...reportData,
      id,
      _id: id,
      createdAt: new Date(),
    };
    memoryStore.reports.unshift(doc);

    if (isMongooseConnected) {
      try {
        const created = await (ReportModel as any).create(doc);
        return created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Mongoose createReport fallback:', e);
      }
    }
    return doc;
  },

  async findReportById(id: string) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id, {
          interviewId: id,
          scheduledInterviewId: id,
          avatarInterviewId: id,
        });
        const found = await (ReportModel as any).findOne(query);
        if (found) return found.toObject ? found.toObject() : found;
      } catch (e) {
        console.warn('Mongoose findReportById fallback:', e);
      }
    }
    return (
      memoryStore.reports.find(
        (r) =>
          String(r.id) === String(id) ||
          String(r._id) === String(id) ||
          String(r.interviewId) === String(id) ||
          String(r.scheduledInterviewId) === String(id) ||
          String(r.avatarInterviewId) === String(id)
      ) || null
    );
  },

  async getReportsForCandidate(candidateId: string) {
    if (isMongooseConnected) {
      try {
        const list = await (ReportModel as any).find({
          $or: [{ candidateId }, { candidateId: String(candidateId) }]
        }).sort({ createdAt: -1 });
        if (list.length > 0) return list.map((r: any) => (r.toObject ? r.toObject() : r));
      } catch (e) {
        console.warn('Mongoose getReportsForCandidate fallback:', e);
      }
    }
    return memoryStore.reports.filter((r) => String(r.candidateId) === String(candidateId));
  },

  async getAllReports() {
    if (isMongooseConnected) {
      try {
        const list = await (ReportModel as any).find().sort({ createdAt: -1 });
        if (list.length > 0) return list.map((r: any) => (r.toObject ? r.toObject() : r));
      } catch (e) {
        console.warn('Mongoose getAllReports fallback:', e);
      }
    }
    return [...memoryStore.reports];
  },

  // Resumes
  async createResume(resumeData: any) {
    const id = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...resumeData,
      id,
      _id: id,
      createdAt: new Date(),
    };
    memoryStore.resumes.unshift(doc);

    if (isMongooseConnected) {
      try {
        const created = await (ResumeModel as any).create(doc);
        return created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Mongoose createResume fallback:', e);
      }
    }
    return doc;
  },

  async getResumesByCandidate(candidateId: string) {
    if (isMongooseConnected) {
      try {
        const list = await (ResumeModel as any).find({ candidateId }).sort({ createdAt: -1 });
        if (list.length > 0) return list.map((r: any) => (r.toObject ? r.toObject() : r));
      } catch (e) {
        console.warn('Mongoose getResumesByCandidate fallback:', e);
      }
    }
    return memoryStore.resumes.filter((r) => r.candidateId === candidateId);
  },

  // Roadmaps
  async createRoadmap(roadmapData: any) {
    const id = 'road_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const doc = {
      ...roadmapData,
      id,
      _id: id,
      createdAt: new Date(),
    };
    memoryStore.roadmaps.unshift(doc);

    if (isMongooseConnected) {
      try {
        const created = await (RoadmapModel as any).create(doc);
        return created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Mongoose createRoadmap fallback:', e);
      }
    }
    return doc;
  },

  async findRoadmapById(id: string) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const doc = await (RoadmapModel as any).findOne(query);
        if (doc) return doc.toObject ? doc.toObject() : doc;
      } catch (e) {
        console.warn('Mongoose findRoadmapById fallback:', e);
      }
    }
    return memoryStore.roadmaps.find((r) => r.id === id || (r as any)._id === id) || null;
  },

  async updateRoadmap(id: string, updates: any) {
    if (isMongooseConnected) {
      try {
        const query = buildFlexibleIdQuery(id);
        const updated = await (RoadmapModel as any).findOneAndUpdate(
          query,
          { $set: updates },
          { new: true }
        );
        if (updated) return updated.toObject ? updated.toObject() : updated;
      } catch (e) {
        console.warn('Mongoose updateRoadmap fallback:', e);
      }
    }

    const idx = memoryStore.roadmaps.findIndex((r) => r.id === id || (r as any)._id === id);
    if (idx !== -1) {
      memoryStore.roadmaps[idx] = {
        ...memoryStore.roadmaps[idx],
        ...updates,
      };
      return memoryStore.roadmaps[idx];
    }
    return null;
  },

  async getRoadmapsByCandidate(candidateId: string) {
    if (isMongooseConnected) {
      try {
        const list = await (RoadmapModel as any).find({ candidateId }).sort({ createdAt: -1 });
        if (list.length > 0) return list.map((r: any) => (r.toObject ? r.toObject() : r));
      } catch (e) {
        console.warn('Mongoose getRoadmapsByCandidate fallback:', e);
      }
    }
    return memoryStore.roadmaps.filter((r) => r.candidateId === candidateId);
  },

  // Platform Analytics
  async getPlatformStats() {
    const [allUsers, allInterviews, allScheduled, allReports] = await Promise.all([
      this.getAllUsers(),
      this.getAllInterviews(),
      this.getAllScheduledInterviews(),
      this.getAllReports(),
    ]);

    const candidates = allUsers.filter((u) => u.role === 'candidate' || (u.role as any) === 'user');
    const interviewers = allUsers.filter((u) => u.role === 'interviewer');

    const completed =
      allInterviews.filter((i) => i.status === 'completed').length +
      allScheduled.filter((s) => s.status === 'completed').length;

    let totalScore = 0;
    allReports.forEach((r) => {
      totalScore += r.overallScore || 0;
    });
    const avgScore = allReports.length > 0 ? Math.round(totalScore / allReports.length) : 80;

    return {
      totalUsers: allUsers.length,
      totalCandidates: candidates.length,
      totalInterviewers: interviewers.length,
      totalInterviews: allInterviews.length + allScheduled.length,
      completedInterviews: completed,
      averageScores: avgScore,
    };
  },
};
