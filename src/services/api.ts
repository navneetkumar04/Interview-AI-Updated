const TOKEN_KEY = 'interviewai_auth_token';
const USER_KEY = 'interviewai_user_cache';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
  getUser(): any | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user: any): void {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {}
  },
};

// Inflight promise cache to eliminate duplicate simultaneous GET requests
const inflightGetRequests = new Map<string, Promise<any>>();

// Short-lived memory cache for read-heavy operations (e.g. reports, roadmaps)
const memoryCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute safe client cache for immutable reports & roadmaps

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(prefix)) {
        memoryCache.delete(key);
      }
    }
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // For cacheable read requests: check memory cache first
  const isReportOrRoadmap =
    method === 'GET' &&
    (endpoint.includes('/report') || endpoint.includes('/roadmap') || endpoint.includes('/my-roadmaps'));

  if (isReportOrRoadmap && memoryCache.has(endpoint)) {
    const entry = memoryCache.get(endpoint)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data as T;
    }
    memoryCache.delete(endpoint);
  }

  // Deduplicate inflight GET requests to prevent duplicate parallel fetches
  if (method === 'GET' && inflightGetRequests.has(endpoint)) {
    return inflightGetRequests.get(endpoint) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const token = authStorage.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      if (isReportOrRoadmap) {
        memoryCache.set(endpoint, { timestamp: Date.now(), data });
      }

      return data as T;
    } finally {
      if (method === 'GET') {
        inflightGetRequests.delete(endpoint);
      }
    }
  })();

  if (method === 'GET') {
    inflightGetRequests.set(endpoint, fetchPromise);
  }

  return fetchPromise;
}

export const api = {
  // Auth
  auth: {
    register: (body: { fullName: string; email: string; password: string; role?: string; preferredRole?: string }) =>
      apiRequest<{ success?: boolean; message?: string; token?: string; user?: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: () => apiRequest<{ user: any }>('/api/auth/me'),
    logout: () => apiRequest<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  },

  // AI Mock Interviews
  interviews: {
    generateQuestions: (body: { jobRole: string; interviewerPersona?: string; difficulty?: string; mode?: string; count?: number }) =>
      apiRequest<{ interviewId: string; questions: string[] }>('/api/interviews/generate-questions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    analyzeAnswer: (body: { question: string; answer: string; jobRole?: string; difficulty?: string }) =>
      apiRequest<any>('/api/interviews/analyze-answer', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    nextQuestion: (body: {
      interviewId?: string;
      role: string;
      difficulty: string;
      persona: string;
      history: Array<{ question: string; answer: string }>;
      currentQuestionIndex: number;
      totalQuestions: number;
    }) =>
      apiRequest<{ followUpQuestion: string; isFinal: boolean; contextComment: string }>('/api/interviews/next-question', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    completeSession: (body: any) =>
      apiRequest<{ reportId: string; report: any }>('/api/interviews/complete-session', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    history: () => apiRequest<{ interviews: any[] }>('/api/interviews/history'),
    evaluations: () => apiRequest<{ evaluations: any[] }>('/api/interviews/evaluations'),
    getReport: (id: string) => apiRequest<{ report: any }>(`/api/interviews/${id}/report`),
  },

  // AI Avatar Interviews
  avatarInterviews: {
    start: (body: { jobRole: string; difficulty?: string; duration?: number; persona?: string }) =>
      apiRequest<{
        interviewId: string;
        greeting: string;
        initialQuestion: string;
        questionType: string;
        topic: string;
        difficulty: string;
        persona: string;
        duration: number;
      }>('/api/avatar-interviews/start', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    nextQuestion: (body: { interviewId: string; answer: string }) =>
      apiRequest<{
        isCompleted: boolean;
        contextComment?: string;
        nextQuestion?: string;
        questionType?: string;
        topic?: string;
        difficulty?: string;
        evaluation?: {
          score: number;
          feedback: string;
          strengths: string[];
          improvement: string;
        };
        questionNumber?: number;
        totalQuestions?: number;
        reportId?: string;
        message?: string;
      }>('/api/avatar-interviews/next-question', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    complete: (body: { interviewId: string; finalAnswer?: string }) =>
      apiRequest<{
        message: string;
        reportId: string;
        report: any;
      }>('/api/avatar-interviews/complete', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getById: (id: string) =>
      apiRequest<{ avatarInterview: any }>(`/api/avatar-interviews/${id}`),
    history: () =>
      apiRequest<{ avatarInterviews: any[] }>('/api/avatar-interviews/user/history'),
  },

  // Scheduled Human-to-Human Interviews
  scheduled: {
    list: () => apiRequest<{ scheduledInterviews: any[] }>('/api/scheduled-interviews'),
    getById: (id: string) => apiRequest<{ interview: any }>(`/api/scheduled-interviews/${id}`),
    create: (body: {
      candidateId?: string;
      candidateEmail?: string;
      candidateName?: string;
      jobRole: string;
      interviewType: string;
      scheduledAt: string;
      duration: number;
    }) =>
      apiRequest<{ message: string; interview: any }>('/api/scheduled-interviews', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    join: (id: string) =>
      apiRequest<{ canJoin: boolean; roleInInterview: string; interview: any }>(`/api/scheduled-interviews/${id}/join`, {
        method: 'POST',
      }),
    start: (id: string) =>
      apiRequest<{ status: string }>(`/api/scheduled-interviews/${id}/start`, { method: 'POST' }),
    end: (id: string, transcript: any[], notes?: string) =>
      apiRequest<{ message: string; reportId: string; report: any }>(`/api/scheduled-interviews/${id}/end`, {
        method: 'POST',
        body: JSON.stringify({ transcript, notes }),
      }),
    saveNotes: (id: string, notes: string) =>
      apiRequest<{ success: boolean; notes: string }>(`/api/scheduled-interviews/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    cancel: (id: string) =>
      apiRequest<{ status: string }>(`/api/scheduled-interviews/${id}/cancel`, { method: 'POST' }),
    leave: (id: string) =>
      apiRequest<{ success: boolean; status: string }>(`/api/scheduled-interviews/${id}/leave`, {
        method: 'POST',
      }),
    saveTranscriptItem: (id: string, item: any) =>
      apiRequest<{ success: boolean }>(`/api/scheduled-interviews/${id}/transcript`, {
        method: 'POST',
        body: JSON.stringify({ item }),
      }),
    getReport: (id: string) => apiRequest<{ report: any }>(`/api/scheduled-interviews/${id}/report`),
  },

  // Resumes
  resume: {
    analyze: (body: {
      fileName?: string;
      resumeText?: string;
      fileBase64?: string;
      fileType?: string;
      targetRole?: string;
      jobDescription?: string;
    }) =>
      apiRequest<{ success: boolean; resume: any; analysis: any }>('/api/resume/analyze', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    myResumes: () => apiRequest<{ resumes: any[] }>('/api/resume/my-resumes'),
  },

  // Roadmaps
  roadmap: {
    generate: (body: { jobRole: string; durationMonths?: number; targetLevel?: string }) =>
      apiRequest<{ roadmap: any }>('/api/roadmap/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    myRoadmaps: () => apiRequest<{ roadmaps: any[] }>('/api/roadmap/my-roadmaps'),
    getById: (id: string) => apiRequest<{ roadmap: any }>(`/api/roadmap/${id}`),
    toggleTask: (id: string, taskId: string) =>
      apiRequest<{ message: string; completedTasks: string[]; roadmap: any }>(
        `/api/roadmap/${id}/toggle-task`,
        {
          method: 'POST',
          body: JSON.stringify({ taskId }),
        }
      ),
  },

  // Video
  video: {
    getQuestions: (search?: string) =>
      apiRequest<{ success: boolean; totalCount: number; categories: string[]; questions: any[] }>(
        search ? `/api/video/questions?search=${encodeURIComponent(search)}` : '/api/video/questions'
      ),
    transcribe: (body: {
      videoBase64?: string;
      audioBase64?: string;
      mimeType?: string;
      clientTranscript?: string;
      filename?: string;
      fileSize?: number;
    }) =>
      apiRequest<{ success: boolean; transcript: string; wordCount: number; provider: string }>('/api/video/transcribe', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    processAndReport: (body: {
      question: string;
      questionId?: string;
      videoBase64?: string;
      audioBase64?: string;
      mimeType?: string;
      transcript?: string;
      clientTranscript?: string;
      videoMetrics?: any;
      role?: string;
    }) =>
      apiRequest<{ success: boolean; reportId: string; report: any; transcript: string }>('/api/video/process-and-report', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    analyzeQA: (body: { question: string; answerTranscript: string; videoMetrics?: any; role?: string }) =>
      apiRequest<any>('/api/video/analyze-qa', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    analyzeInterview: (body: { transcript: string; videoMetrics?: any; role?: string }) =>
      apiRequest<any>('/api/video/analyze-interview', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // Users
  users: {
    candidates: () => apiRequest<{ candidates: any[] }>('/api/users/candidates'),
    interviewers: () => apiRequest<{ interviewers: any[] }>('/api/users/interviewers'),
  },

  // Admin
  admin: {
    users: (query?: string) =>
      apiRequest<{ users: any[] }>(`/api/admin/users${query ? `?query=${encodeURIComponent(query)}` : ''}`),
    updateRole: (id: string, role: string) =>
      apiRequest<{ message: string; user: any }>(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    updateBlockStatus: (id: string, isBlocked: boolean) =>
      apiRequest<{ message: string; isBlocked: boolean }>(`/api/admin/users/${id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ isBlocked }),
      }),
    interviews: () => apiRequest<{ aiInterviews: any[]; scheduledInterviews: any[] }>('/api/admin/interviews'),
    reports: () => apiRequest<{ reports: any[] }>('/api/admin/reports'),
    stats: () => apiRequest<{ stats: any }>('/api/admin/stats'),
  },
};
