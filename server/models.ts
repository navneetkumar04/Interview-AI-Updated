import mongoose, { Schema, Document, Model } from 'mongoose';

// User Schema
export interface IUser extends Document {
  id?: string;
  fullName: string;
  name?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  preferredRole: string;
  role: 'candidate' | 'interviewer' | 'admin' | string;
  isBlocked: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    fullName: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String },
    passwordHash: { type: String },
    preferredRole: { type: String, default: 'Full Stack Engineer' },
    role: { type: String, default: 'candidate', index: true },
    isBlocked: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
  },
  { timestamps: true, strict: false }
);

// Interview Session Schema
export interface IInterview extends Document {
  id?: string;
  candidateId?: Schema.Types.ObjectId | string | null;
  candidateName: string;
  candidateEmail: string;
  mode: 'classic' | 'avatar' | 'video';
  jobRole: string;
  interviewerPersona: string;
  difficulty: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: string[];
  answers: Array<{
    question: string;
    answer: string;
    score?: number;
    feedback?: string;
  }>;
  metrics?: {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    confidence: number;
    clarity: number;
    eyeContact?: number;
  };
  reportId?: Schema.Types.ObjectId | string;
  videoReplayUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    candidateId: { type: Schema.Types.Mixed, required: false, index: true, default: null },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    mode: { type: String, enum: ['classic', 'avatar', 'video'], default: 'classic' },
    jobRole: { type: String, required: true },
    interviewerPersona: { type: String, default: 'Professional Tech Lead' },
    difficulty: { type: String, default: 'Mid-Level' },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    questions: [{ type: String }],
    answers: [
      {
        question: { type: String },
        answer: { type: String },
        score: { type: Number },
        feedback: { type: String },
      },
    ],
    metrics: {
      communication: Number,
      technicalKnowledge: Number,
      problemSolving: Number,
      confidence: Number,
      clarity: Number,
      eyeContact: Number,
    },
    reportId: { type: Schema.Types.Mixed },
    videoReplayUrl: { type: String },
  },
  { timestamps: true }
);

// Scheduled Interview Schema
export interface IScheduledInterview extends Document {
  id?: string;
  roomId: string;
  interviewerId: Schema.Types.ObjectId | string;
  interviewerName: string;
  candidateId?: Schema.Types.ObjectId | string | null;
  candidateName: string;
  candidateEmail: string;
  jobRole: string;
  interviewType: 'HR' | 'Technical' | 'System Design' | 'Mixed';
  mode: 'human' | 'ai';
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'waiting' | 'live' | 'completed' | 'cancelled' | 'no_show';
  meetingProvider?: string;
  meetingRoomName?: string;
  meetingUrl?: string;
  notes?: string;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  reportId?: Schema.Types.ObjectId | string;
  interviewId?: Schema.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledInterviewSchema = new Schema<IScheduledInterview>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    roomId: { type: String, required: true, unique: true, index: true },
    interviewerId: { type: Schema.Types.Mixed, required: true, index: true },
    interviewerName: { type: String, required: true },
    candidateId: { type: Schema.Types.Mixed, required: false, index: true, default: null },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    jobRole: { type: String, required: true },
    interviewType: { type: String, default: 'Technical' },
    mode: { type: String, enum: ['human', 'ai'], default: 'human' },
    scheduledAt: { type: Date, required: true, index: true },
    duration: { type: Number, default: 30 },
    meetingProvider: { type: String, default: 'jitsi' },
    meetingRoomName: { type: String },
    meetingUrl: { type: String },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'waiting', 'live', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true,
    },
    transcript: [
      {
        speaker: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: String, required: true },
      },
    ],
    reportId: { type: Schema.Types.Mixed },
    interviewId: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Avatar Interview Schema
export interface IAvatarAnswer {
  question: string;
  answer: string;
  questionType: string;
  topic: string;
  difficulty: string;
  timestamp: Date | string;
  answerEvaluation?: {
    score: number;
    feedback: string;
    strengths?: string[];
    improvement?: string;
  };
}

export interface IAvatarInterview extends Document {
  id?: string;
  candidateId?: Schema.Types.ObjectId | string | null;
  candidateName?: string;
  candidateEmail?: string;
  jobRole: string;
  difficulty: string;
  duration: number;
  persona: string;
  questions: string[];
  answers: IAvatarAnswer[];
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  status: 'in_progress' | 'completed' | 'abandoned';
  reportId?: Schema.Types.ObjectId | string;
  startedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AvatarInterviewSchema = new Schema<IAvatarInterview>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    candidateId: { type: Schema.Types.Mixed, required: false, index: true, default: null },
    candidateName: { type: String },
    candidateEmail: { type: String },
    jobRole: { type: String, required: true },
    difficulty: { type: String, default: 'Mid-Level' },
    duration: { type: Number, default: 15 },
    persona: { type: String, default: 'Elena Rostova' },
    questions: [{ type: String }],
    answers: [
      {
        question: { type: String, required: true },
        answer: { type: String, default: '' },
        questionType: { type: String, default: 'technical' },
        topic: { type: String, default: 'General' },
        difficulty: { type: String, default: 'Mid-Level' },
        timestamp: { type: Schema.Types.Mixed, default: Date.now },
        answerEvaluation: {
          score: Number,
          feedback: String,
          strengths: [String],
          improvement: String,
        },
      },
    ],
    transcript: [
      {
        speaker: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    reportId: { type: Schema.Types.Mixed },
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Report Schema
export interface IReportScoring {
  answerRelevance: number;
  answerCompleteness: number;
  communicationClarity: number;
  structureOrganization: number;
  technicalAccuracy: number;
  overallScore: number;
  rationale: string;
  subscores?: {
    relevance: number;
    structure: number;
    depth: number;
    clarity: number;
    delivery: number;
    professionalism: number;
  };
  justifications?: {
    relevance?: string;
    structure?: string;
    depth?: string;
    clarity?: string;
    delivery?: string;
    professionalism?: string;
  };
  verdict?: string;
}

export interface IReport extends Document {
  id?: string;
  interviewId?: Schema.Types.ObjectId | string;
  scheduledInterviewId?: Schema.Types.ObjectId | string;
  avatarInterviewId?: Schema.Types.ObjectId | string;
  candidateId?: Schema.Types.ObjectId | string | null;
  candidateName: string;
  interviewerId?: Schema.Types.ObjectId | string;
  interviewerName?: string;
  jobRole: string;
  mode?: string;
  question?: string;
  overallScore: number;
  technicalKnowledge: number;
  communication: number;
  problemSolving: number;
  confidence: number;
  roleFit?: number;
  clarity: number;
  eyeContact?: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recommendedTopics: string[];
  finalSummary?: string;
  summary?: {
    answerSummary: string;
    mainPointsCovered: string[];
    importantMissingPoints: string[];
  };
  communicationAnalysis?: {
    clarity: string;
    organization: string;
    relevance: string;
    conciseness: string;
    useOfExamples: string;
    repeatedPhrases: string[];
  };
  answerQuality?: {
    technicalCorrectness: string;
    completeness: string;
    strengthOfReasoning: string;
    practicalExamples: string;
    missingConcepts: string[];
    improvementSuggestions: string[];
  };
  languageDelivery?: {
    grammarObservations: string[];
    unclearSentences: string[];
    phrasingImprovements: string[];
  };
  fillerWords?: {
    totalCount: number;
    words: Array<{ word: string; count: number }>;
  };
  scoring?: IReportScoring;
  improvedAnswer?: string;
  recommendations?: string[];
  followUpQuestions?: string[];
  videoMetrics?: any;
  processingStatus?: string;
  questionAnalysis: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    suggestion: string;
    questionType?: string;
    topic?: string;
  }>;
  transcript?: Array<{ speaker: string; text: string; timestamp: string }>;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    interviewId: { type: Schema.Types.Mixed, index: true },
    scheduledInterviewId: { type: Schema.Types.Mixed },
    avatarInterviewId: { type: Schema.Types.Mixed },
    candidateId: { type: Schema.Types.Mixed, required: false, index: true, default: null },
    candidateName: { type: String, required: true },
    interviewerId: { type: Schema.Types.Mixed, index: true },
    interviewerName: { type: String },
    jobRole: { type: String, required: true },
    mode: { type: String, default: 'avatar' },
    question: { type: String },
    overallScore: { type: Number, required: true },
    technicalKnowledge: { type: Number, required: true },
    communication: { type: Number, required: true },
    problemSolving: { type: Number, required: true },
    confidence: { type: Number, required: true },
    roleFit: { type: Number, default: 85 },
    clarity: { type: Number, required: true },
    eyeContact: { type: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    recommendedTopics: [{ type: String }],
    finalSummary: { type: String },
    summary: {
      answerSummary: String,
      mainPointsCovered: [String],
      importantMissingPoints: [String],
    },
    communicationAnalysis: {
      clarity: String,
      organization: String,
      relevance: String,
      conciseness: String,
      useOfExamples: String,
      repeatedPhrases: [String],
    },
    answerQuality: {
      technicalCorrectness: String,
      completeness: String,
      strengthOfReasoning: String,
      practicalExamples: String,
      missingConcepts: [String],
      improvementSuggestions: [String],
    },
    languageDelivery: {
      grammarObservations: [String],
      unclearSentences: [String],
      phrasingImprovements: [String],
    },
    fillerWords: {
      totalCount: { type: Number, default: 0 },
      words: [{ word: String, count: Number }],
    },
    scoring: {
      answerRelevance: Number,
      answerCompleteness: Number,
      communicationClarity: Number,
      structureOrganization: Number,
      technicalAccuracy: Number,
      overallScore: Number,
      rationale: String,
      subscores: {
        relevance: Number,
        structure: Number,
        depth: Number,
        clarity: Number,
        delivery: Number,
        professionalism: Number,
      },
      justifications: {
        relevance: String,
        structure: String,
        depth: String,
        clarity: String,
        delivery: String,
        professionalism: String,
      },
      verdict: String,
    },
    improvedAnswer: { type: String },
    recommendations: [{ type: String }],
    followUpQuestions: [{ type: String }],
    videoMetrics: { type: Schema.Types.Mixed },
    processingStatus: { type: String, default: 'completed' },
    questionAnalysis: [
      {
        question: String,
        answer: String,
        score: Number,
        feedback: String,
        suggestion: String,
      },
    ],
    transcript: [
      {
        speaker: String,
        text: String,
        timestamp: String,
      },
    ],
  },
  { timestamps: true }
);

// Resume Schema
export interface IResume extends Document {
  id?: string;
  candidateId?: Schema.Types.ObjectId | string | null;
  fileName: string;
  fileText: string;
  targetRole?: string;
  jobDescription?: string;
  overallScore?: number;
  score?: number;
  scoreLabel?: string;
  scoreDisclaimer?: string;
  subscores?: {
    roleMatch: number;
    skillsMatch: number;
    projectRelevance: number;
    resumeStructure: number;
    readability: number;
    keywordCoverage: number;
    impact: number;
  };
  foundKeywords?: string[];
  missingKeywords?: string[];
  categoryRubric?: Array<{
    category: string;
    weight: number;
    score: number;
    explanation: string;
    evidence: string;
    improvementAction: string;
  }>;
  executiveSummary?: string;
  extractedInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    skills: string[];
    experienceYears: number;
    topTechnologies: string[];
    education: string[];
  };
  strengths: any[];
  weaknesses: any[];
  skillGaps?: any[];
  sectionFeedback?: any[];
  projectAnalysis?: any[];
  bulletImprovements?: any[];
  formattingGrammarObservations?: string[];
  keyRecommendations?: string[];
  suggestions: string[];
  interviewPrepTips: string[];
  improvedResumeDraft?: string;
  createdAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    candidateId: { type: Schema.Types.Mixed, required: false, index: true, default: null },
    fileName: { type: String, required: true },
    fileText: { type: String, required: true },
    targetRole: { type: String },
    jobDescription: { type: String },
    overallScore: { type: Number },
    score: { type: Number },
    scoreLabel: { type: String },
    scoreDisclaimer: { type: String },
    subscores: { type: Schema.Types.Mixed },
    foundKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    categoryRubric: [Schema.Types.Mixed],
    executiveSummary: { type: String },
    extractedInfo: {
      name: String,
      email: String,
      phone: String,
      location: String,
      github: String,
      linkedin: String,
      portfolio: String,
      skills: [String],
      experienceYears: Number,
      topTechnologies: [String],
      education: [String],
    },
    strengths: [Schema.Types.Mixed],
    weaknesses: [Schema.Types.Mixed],
    skillGaps: [Schema.Types.Mixed],
    sectionFeedback: [Schema.Types.Mixed],
    projectAnalysis: [Schema.Types.Mixed],
    bulletImprovements: [Schema.Types.Mixed],
    formattingGrammarObservations: [String],
    keyRecommendations: [String],
    suggestions: [String],
    interviewPrepTips: [String],
    improvedResumeDraft: { type: String },
  },
  { timestamps: true, strict: false }
);

// Roadmap Schema
export interface IRoadmapResource {
  title: string;
  description: string;
  type: string;
  url: string;
}

export interface IRoadmapWeek {
  weekNumber: number;
  title: string;
  learningObjectives: string[];
  topics: string[];
  detailedExplanation: string;
  estimatedHours: number | string;
  resources: IRoadmapResource[];
  practicalExercises: string[];
  weeklyAssignments: string[];
  projectMilestone?: string;
  expectedOutcomes: string[];
}

export interface IRoadmap extends Document {
  id?: string;
  candidateId?: Schema.Types.ObjectId | string | null;
  jobRole: string;
  targetLevel?: string;
  durationMonths?: number;
  totalWeeks?: number;
  weeks?: IRoadmapWeek[];
  requiredSkills: string[];
  learningTopics?: Array<{
    stage: string;
    title: string;
    description: string;
    duration: string;
    resources: string[];
  }>;
  progression: string[];
  interviewPreparation: string[];
  areasToImprove: string[];
  completedTasks?: string[];
  createdAt: Date;
}

const RoadmapSchema = new Schema<IRoadmap>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    candidateId: { type: Schema.Types.Mixed, required: false, index: true, default: null },
    jobRole: { type: String, required: true },
    targetLevel: { type: String, default: 'Senior' },
    durationMonths: { type: Number, default: 3 },
    totalWeeks: { type: Number, default: 12 },
    weeks: [
      {
        weekNumber: { type: Number, required: true },
        title: { type: String, required: true },
        learningObjectives: [{ type: String }],
        topics: [{ type: String }],
        detailedExplanation: { type: String, default: '' },
        estimatedHours: { type: Schema.Types.Mixed, default: '10-12 hours' },
        resources: [
          {
            title: { type: String, required: true },
            description: { type: String, default: '' },
            type: { type: String, default: 'Documentation' },
            url: { type: String, required: true },
          },
        ],
        practicalExercises: [{ type: String }],
        weeklyAssignments: [{ type: String }],
        projectMilestone: { type: String, default: '' },
        expectedOutcomes: [{ type: String }],
      },
    ],
    requiredSkills: [String],
    learningTopics: [
      {
        stage: String,
        title: String,
        description: String,
        duration: String,
        resources: [String],
      },
    ],
    progression: [String],
    interviewPreparation: [String],
    areasToImprove: [String],
    completedTasks: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Analytics Schema
export interface IAnalytics extends Document {
  id?: string;
  candidateId?: Schema.Types.ObjectId | string | null;
  totalInterviews: number;
  averageScore: number;
  historyPoints: Array<{ date: string; score: number; role: string; type: string }>;
  skillsPerformance: {
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    id: { type: String },
    candidateId: { type: Schema.Types.Mixed, required: true, unique: true, index: true },
    totalInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    historyPoints: [
      {
        date: String,
        score: Number,
        role: String,
        type: String,
      },
    ],
    skillsPerformance: {
      technical: { type: Number, default: 75 },
      communication: { type: Number, default: 75 },
      problemSolving: { type: Number, default: 75 },
      confidence: { type: Number, default: 75 },
    },
  },
  { timestamps: true }
);

// Performance compound indexes for query acceleration
UserSchema.index({ role: 1, createdAt: -1 });
InterviewSchema.index({ candidateId: 1, createdAt: -1 });
InterviewSchema.index({ status: 1, createdAt: -1 });
ScheduledInterviewSchema.index({ candidateId: 1, scheduledAt: -1 });
ScheduledInterviewSchema.index({ interviewerId: 1, scheduledAt: -1 });
ScheduledInterviewSchema.index({ status: 1, scheduledAt: -1 });
AvatarInterviewSchema.index({ candidateId: 1, startedAt: -1 });
AvatarInterviewSchema.index({ status: 1, startedAt: -1 });
ReportSchema.index({ candidateId: 1, createdAt: -1 });
ReportSchema.index({ scheduledInterviewId: 1 });
ReportSchema.index({ avatarInterviewId: 1 });

export const UserModel: Model<IUser> = (mongoose.models.User as any) || mongoose.model<IUser>('User', UserSchema);
export const InterviewModel: Model<IInterview> =
  (mongoose.models.Interview as any) || mongoose.model<IInterview>('Interview', InterviewSchema);
export const ScheduledInterviewModel: Model<IScheduledInterview> =
  (mongoose.models.ScheduledInterview as any) ||
  mongoose.model<IScheduledInterview>('ScheduledInterview', ScheduledInterviewSchema);
export const AvatarInterviewModel: Model<IAvatarInterview> =
  (mongoose.models.AvatarInterview as any) ||
  mongoose.model<IAvatarInterview>('AvatarInterview', AvatarInterviewSchema);
export const ReportModel: Model<IReport> = (mongoose.models.Report as any) || mongoose.model<IReport>('Report', ReportSchema);
export const ResumeModel: Model<IResume> = (mongoose.models.Resume as any) || mongoose.model<IResume>('Resume', ResumeSchema);
export const RoadmapModel: Model<IRoadmap> = (mongoose.models.Roadmap as any) || mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);
export const AnalyticsModel: Model<IAnalytics> =
  (mongoose.models.Analytics as any) || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
