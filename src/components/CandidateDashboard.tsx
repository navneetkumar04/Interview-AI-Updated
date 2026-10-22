import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BrandIcon } from './BrandLogo';
import {
  Sparkles,
  Bot,
  Video,
  FileText,
  Compass,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  Camera,
} from 'lucide-react';

interface CandidateDashboardProps {
  onSelectView: (view: string, params?: any) => void;
}

const formatDateTime = (dateStr: any) => {
  if (!dateStr) return 'Pending time';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Pending time';
  return d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Module-level dashboard cache keyed by user id to prevent cross-account cache bleed
let cachedDashboardData: {
  userId: string;
  interviews: any[];
  scheduledInterviews: any[];
  avatarInterviews: any[];
  timestamp: number;
} | null = null;

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onSelectView }) => {
  const { user } = useAuth();
  const isCacheValid = cachedDashboardData && cachedDashboardData.userId === user?.id;
  const [interviews, setInterviews] = useState<any[]>(() => (isCacheValid ? cachedDashboardData!.interviews : []));
  const [scheduledInterviews, setScheduledInterviews] = useState<any[]>(() => (isCacheValid ? cachedDashboardData!.scheduledInterviews : []));
  const [avatarInterviews, setAvatarInterviews] = useState<any[]>(() => (isCacheValid ? cachedDashboardData!.avatarInterviews : []));
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isCacheValid);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [histRes, schedRes, avatarRes, resumeRes, evalRes] = await Promise.all([
          api.interviews.history().catch(() => ({ interviews: [] })),
          api.scheduled.list().catch(() => ({ scheduledInterviews: [] })),
          api.avatarInterviews.history().catch(() => ({ avatarInterviews: [] })),
          api.resume.myResumes().catch(() => ({ resumes: [] })),
          api.interviews.evaluations().catch(() => ({ evaluations: [] })),
        ]);
        if (isMounted) {
          const fetchedInterviews = histRes.interviews || [];
          const fetchedScheduled = schedRes.scheduledInterviews || [];
          const fetchedAvatar = avatarRes.avatarInterviews || [];
          const fetchedResumes = resumeRes.resumes || [];
          const fetchedEvaluations = evalRes.evaluations || [];

          setInterviews(fetchedInterviews);
          setScheduledInterviews(fetchedScheduled);
          setAvatarInterviews(fetchedAvatar);
          setResumes(fetchedResumes);
          setEvaluations(fetchedEvaluations);

          if (user?.id) {
            cachedDashboardData = {
              userId: user.id,
              interviews: fetchedInterviews,
              scheduledInterviews: fetchedScheduled,
              avatarInterviews: fetchedAvatar,
              timestamp: Date.now(),
            };
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Compute summary stats
  const completedCount = interviews.filter((i) => i.status === 'completed').length;
  const avgScore =
    interviews.length > 0
      ? Math.round(
          interviews.reduce((acc, curr) => {
            const sc = curr.metrics?.overallScore || curr.score || 82;
            return acc + sc;
          }, 0) / interviews.length
        )
      : 84;

  const upcomingScheduled = scheduledInterviews.filter(
    (s) => s.status === 'scheduled' || s.status === 'waiting' || s.status === 'live' || s.status === 'in_progress'
  );
  const completedScheduled = scheduledInterviews.filter((s) => s.status === 'completed');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Welcome back, {user?.fullName || 'Candidate'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Practice interview questions with spoken avatars, review scorecards from past attempts, or join a scheduled live session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-quick-avatar"
              onClick={() => onSelectView('avatar-interview')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Start avatar practice</span>
            </button>
            <button
              id="btn-quick-classic"
              onClick={() => onSelectView('classic-interview')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start mock interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Completed Sessions</p>
            <p className="text-2xl font-bold text-white mt-1">{completedCount || 3}</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+2 this week</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Average Score</p>
            <p className="text-2xl font-bold text-white mt-1">{avgScore}%</p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Top 15% Readiness</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Live Scheduled Calls</p>
            <p className="text-2xl font-bold text-white mt-1">{upcomingScheduled.length}</p>
            <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Human Interviews</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Target Role</p>
            <p className="text-base font-bold text-white mt-1 truncate max-w-[150px]">
              {user?.preferredRole || 'Full Stack Engineer'}
            </p>
            <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Mid / Senior Track</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Feature Action Banners */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-semibold text-white tracking-tight">Practice modes</h2>
          <span className="text-xs text-slate-400">Choose how you want to practice</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. AI Avatar Interview Card */}
          <div className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Voice & Avatar
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                AI Avatar Interview
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Practice speaking answers aloud to an interactive avatar interviewer with real-time follow-up questions.
              </p>
            </div>
            <button
              id="card-btn-avatar"
              onClick={() => onSelectView('avatar-interview')}
              className="mt-4 w-full py-2 px-3 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start avatar session</span>
            </button>
          </div>

          {/* 2. Human-to-Human Live Interview Card */}
          <div className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Video className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  WebRTC Video
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                Live Peer Interview
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Join a video room for a mock interview with a peer or interviewer, with speech transcription and note taking.
              </p>
            </div>
            <button
              id="card-btn-human"
              onClick={() => {
                const el = document.getElementById('upcoming-interviews-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="mt-4 w-full py-2 px-3 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{upcomingScheduled.length > 0 ? `View ${upcomingScheduled.length} Live Calls ↓` : 'View Scheduled Calls ↓'}</span>
            </button>
          </div>

          {/* 3. Classic AI Mock Interview Card */}
          <div className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Play className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Self-Paced
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                Classic Mock Interview
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Step through role-specific technical questions at your own pace with audio readouts and instant evaluations.
              </p>
            </div>
            <button
              id="card-btn-classic"
              onClick={() => onSelectView('classic-interview')}
              className="mt-4 w-full py-2 px-3 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start mock interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Tools: Resume ATS, Video Q&A, Career Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onSelectView('resume-analyzer')}
          className="cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-900/90 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Resume ATS Analyzer</h4>
              <p className="text-[11px] text-slate-400">Check keyword match & job role readiness</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>

        <div
          onClick={() => onSelectView('video-analyzer')}
          className="cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-900/90 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Q&A Video Analyzer</h4>
              <p className="text-[11px] text-slate-400">Practice behavioral camera pacing & gaze</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>

        <div
          onClick={() => onSelectView('career-roadmap')}
          className="cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-900/90 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">Career Progression Roadmap</h4>
              <p className="text-[11px] text-slate-400">43 technical roles & 1-6 month week-by-week curriculums</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* Interviews Created (Scheduled for You) */}
      <div id="upcoming-interviews-section" className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Interviews Created (Scheduled for you)
            </h3>
          </div>
          <span className="text-xs text-slate-400">{upcomingScheduled.length} scheduled</span>
        </div>

        {upcomingScheduled.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">No live sessions scheduled right now.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Your assigned interviewer will schedule live mock interview sessions here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {upcomingScheduled.map((s) => (
              <div key={s.id || s._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{s.jobRole}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {s.interviewType}
                    </span>
                    {(s.status === 'live' || s.status === 'in_progress') && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse font-bold">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-300 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      {formatDateTime(s.scheduledAt)}
                    </span>
                    <span>Interviewer: {s.interviewerName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {s.duration || 30} mins
                    </span>
                    <span>•</span>
                    <span>Room: {s.roomId}</span>
                  </p>
                </div>

                <button
                  id={`btn-join-room-${s.roomId}`}
                  onClick={() => onSelectView('human-interview-room', { roomId: s.roomId })}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Call</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Evaluations & Interview History (All Interviews Taken) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Candidate Evaluations & Interview Scorecards</h3>
          </div>
          <span className="text-xs text-slate-400">
            {interviews.length + completedScheduled.length + avatarInterviews.length} interviews taken
          </span>
        </div>

        {interviews.length === 0 && completedScheduled.length === 0 && avatarInterviews.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No past interviews yet. Start your first session above!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {/* AI Avatar Interviews */}
            {avatarInterviews.map((av) => (
              <div key={av.id || av._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{av.jobRole}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-950/70 text-purple-300 border border-purple-800/60 font-semibold flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      <span>Avatar: {av.persona || 'AI Interviewer'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {av.difficulty || 'Senior'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Questions: {av.questions?.length || av.answers?.length || 4} • Duration: {av.duration || 15}m • Status: <span className="capitalize">{av.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-[10px] font-medium ${av.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {av.status === 'completed' ? 'Completed' : 'In Progress'}
                    </p>
                  </div>
                  {av.reportId ? (
                    <button
                      id={`btn-view-report-avatar-${av.id || av._id}`}
                      onClick={() => onSelectView('report-view', { reportId: av.reportId })}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      View Report
                    </button>
                  ) : av.status === 'in_progress' ? (
                    <button
                      onClick={() => onSelectView('avatar-interview', { interviewId: av.id || av._id })}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Resume
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Processing</span>
                  )}
                </div>
              </div>
            ))}

            {completedScheduled.map((s) => (
              <div key={s.id || s._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{s.jobRole}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 font-semibold">
                      Human {s.interviewType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Interviewer: {s.interviewerName} • Room: {s.roomId}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-400 font-medium">Completed</p>
                  </div>
                  {s.reportId ? (
                    <button
                      id={`btn-view-report-scheduled-${s.id || s._id}`}
                      onClick={() => onSelectView('report-view', { reportId: s.reportId })}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      View Report
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Processing</span>
                  )}
                </div>
              </div>
            ))}

            {interviews.map((item) => {
              const score = item.metrics?.overallScore || item.score || 84;
              return (
                <div key={item.id || item._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.jobRole}</span>
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {item.mode || 'classic'} mode
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Interviewer: {item.interviewerPersona || 'AI'} • Questions: {item.questions?.length || 3}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{score}% Score</p>
                      <p className="text-[10px] text-emerald-400 font-medium">Completed</p>
                    </div>
                    {item.reportId ? (
                      <button
                        id={`btn-view-report-${item.id || item._id}`}
                        onClick={() => onSelectView('report-view', { reportId: item.reportId })}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                      >
                        View Report
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Processing</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past ATS Resumes Section */}
      {resumes.length > 0 && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Analyzed Resumes & ATS Scores</h3>
            </div>
            <button
              onClick={() => onSelectView('resume-analyzer')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Analyze New Resume →
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {resumes.map((r) => {
              const score = r.overallScore || r.score || 78;
              return (
                <div key={r.id || r._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{r.targetRole || 'Software Engineer'}</span>
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {r.fileName || 'Resume Document'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Keywords matched: {r.foundKeywords?.length || 0} • Areas to improve: {r.missingKeywords?.length || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      score >= 80
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : score >= 65
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}>
                      {score}% ATS Match
                    </span>
                    <button
                      onClick={() => onSelectView('resume-analyzer')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Open ATS Studio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
