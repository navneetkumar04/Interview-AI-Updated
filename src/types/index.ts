export type UserRole = 'candidate' | 'interviewer' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  preferredRole: string;
  role: UserRole;
  isBlocked: boolean;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface InterviewMetric {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  confidence: number;
  clarity: number;
  eyeContact?: number;
}

export interface QuestionAnalysis {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  suggestion: string;
}

export interface TranscriptItem {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface ReportScoring {
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

export interface InterviewReport {
  id: string;
  _id?: string;
  interviewId?: string;
  scheduledInterviewId?: string;
  candidateId: string;
  candidateName?: string;
  jobRole: string;
  mode?: string;
  question?: string;
  overallScore: number;
  technicalKnowledge: number;
  communication: number;
  problemSolving: number;
  confidence: number;
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
  scoring?: ReportScoring;
  improvedAnswer?: string;
  recommendations?: string[];
  followUpQuestions?: string[];
  videoMetrics?: any;
  processingStatus?: string;
  questionAnalysis: QuestionAnalysis[];
  transcript?: TranscriptItem[];
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  mode: 'classic' | 'avatar' | 'video';
  jobRole: string;
  interviewerPersona: string;
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead';
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: string[];
  answers: Array<{
    question: string;
    answer: string;
    score?: number;
    feedback?: string;
  }>;
  metrics?: InterviewMetric;
  reportId?: string;
  videoReplayUrl?: string;
  createdAt: string;
}

export type ScheduledStatus =
  | 'scheduled'
  | 'in_progress'
  | 'waiting'
  | 'live'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface ScheduledInterview {
  id: string;
  roomId: string;
  interviewerId: string;
  interviewerName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobRole: string;
  interviewType: 'HR' | 'Technical' | 'System Design' | 'Mixed';
  mode: 'human' | 'ai';
  scheduledAt: string;
  duration: number; // in minutes: 15, 30, 45, 60
  status: ScheduledStatus;
  transcript: TranscriptItem[];
  reportId?: string;
  interviewId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ATSCategoryScore {
  category: string;
  weight: number;
  score: number;
  explanation: string;
  evidence: string;
  improvementAction: string;
}

export interface ATSStrength {
  title: string;
  explanation: string;
  evidence: string;
  roleRelevance: string;
  howToEmphasize: string;
}

export interface ATSWeakness {
  title: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  evidenceOrMissing: string;
  whyItMatters: string;
  recommendedCorrection: string;
  exampleImprovement?: string;
}

export interface ATSSkillGap {
  skill: string;
  importance: 'critical' | 'preferred' | 'optional';
  reason: string;
}

export interface ATSSectionFeedback {
  sectionName: string;
  status: 'strong' | 'needs_improvement' | 'missing' | 'acceptable';
  findings: string;
  recommendations: string;
}

export interface ATSProjectAnalysis {
  projectName: string;
  technologiesIdentified: string[];
  strengths: string;
  relevanceToRole: string;
  areasToDeepen: string;
}

export interface ATSBulletImprovement {
  originalText: string;
  problem: string;
  improvedText: string;
  explanation: string;
}

export interface ResumeAnalysisResult {
  scoreLabel: string;
  scoreDisclaimer: string;
  overallScore: number;
  score: number;
  subscores: {
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
  categoryRubric: ATSCategoryScore[];
  executiveSummary: string;
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
  strengths: ATSStrength[];
  weaknesses: ATSWeakness[];
  skillGaps: ATSSkillGap[];
  sectionFeedback: ATSSectionFeedback[];
  projectAnalysis: ATSProjectAnalysis[];
  bulletImprovements: ATSBulletImprovement[];
  formattingGrammarObservations: string[];
  keyRecommendations: string[];
  improvements?: string[];
  suggestions: string[];
  interviewPrepTips: string[];
  improvedResumeDraft: string;
}

export interface ResumeData {
  id: string;
  _id?: string;
  candidateId: string;
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
  categoryRubric?: ATSCategoryScore[];
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
  skillGaps?: ATSSkillGap[];
  sectionFeedback?: ATSSectionFeedback[];
  projectAnalysis?: ATSProjectAnalysis[];
  bulletImprovements?: ATSBulletImprovement[];
  formattingGrammarObservations?: string[];
  keyRecommendations?: string[];
  improvements?: string[];
  suggestions: string[];
  interviewPrepTips: string[];
  improvedResumeDraft?: string;
  createdAt: string;
}

export interface RoadmapResource {
  title: string;
  description: string;
  type: string;
  url: string;
}

export interface RoadmapWeek {
  weekNumber: number;
  title: string;
  learningObjectives: string[];
  topics: string[];
  detailedExplanation: string;
  estimatedHours: number | string;
  resources: RoadmapResource[];
  practicalExercises: string[];
  weeklyAssignments: string[];
  projectMilestone?: string;
  expectedOutcomes: string[];
}

export interface RoadmapTopic {
  stage: string;
  title: string;
  description: string;
  duration: string;
  resources: string[];
}

export interface CareerRoadmap {
  id: string;
  _id?: string;
  candidateId: string;
  jobRole: string;
  targetLevel?: string;
  durationMonths?: number;
  totalWeeks?: number;
  weeks?: RoadmapWeek[];
  requiredSkills: string[];
  learningTopics?: RoadmapTopic[];
  progression: string[];
  interviewPreparation: string[];
  areasToImprove: string[];
  completedTasks?: string[];
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalCandidates: number;
  totalInterviewers: number;
  totalInterviews: number;
  completedInterviews: number;
  averageScores: number;
}
