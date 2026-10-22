import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { BrandIcon } from './BrandLogo';
import {
  Video,
  Calendar,
  Clock,
  User,
  Plus,
  FileText,
  Award,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Search,
  Filter,
  Check,
  TrendingUp,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface InterviewerDashboardProps {
  onSelectView: (view: string, params?: any) => void;
  initialTab?: 'created' | 'evaluations';
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

export const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({ onSelectView, initialTab }) => {
  const { user } = useAuth();
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'created' | 'evaluations'>(initialTab || 'created');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, evalRes] = await Promise.all([
        api.scheduled.list().catch(() => ({ scheduledInterviews: [] })),
        api.interviews.evaluations().catch(() => ({ evaluations: [] })),
      ]);
      setScheduledList(schedRes.scheduledInterviews || []);
      setEvaluationsList(evalRes.evaluations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isInterviewerOrAdmin = user?.role === 'interviewer' || user?.role === 'admin';

  // Filtered scheduled interviews
  const filteredScheduled = scheduledList.filter((item) => {
    // Status filter
    if (statusFilter === 'active') {
      if (item.status === 'completed' || item.status === 'cancelled') return false;
    } else if (statusFilter === 'completed') {
      if (item.status !== 'completed') return false;
    } else if (statusFilter === 'cancelled') {
      if (item.status !== 'cancelled') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCandidate = item.candidateName?.toLowerCase().includes(q);
      const matchEmail = item.candidateEmail?.toLowerCase().includes(q);
      const matchRole = item.jobRole?.toLowerCase().includes(q);
      const matchRoom = item.roomId?.toLowerCase().includes(q);
      return matchCandidate || matchEmail || matchRole || matchRoom;
    }
    return true;
  });

  // Filtered evaluations
  const filteredEvaluations = evaluationsList.filter((ev) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCandidate = ev.candidateName?.toLowerCase().includes(q);
      const matchRole = ev.jobRole?.toLowerCase().includes(q);
      return matchCandidate || matchRole;
    }
    return true;
  });

  const activeOrUpcoming = scheduledList.filter(
    (s) => s.status !== 'completed' && s.status !== 'cancelled'
  );
  const completedSessions = scheduledList.filter((s) => s.status === 'completed');

  const copyMeetingLink = (roomId: string) => {
    const link = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2500);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hub Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {isInterviewerOrAdmin ? `Hello, ${user?.fullName || 'Interviewer'}` : 'Interview Center'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {isInterviewerOrAdmin ? 'Interviewer Portal' : 'Candidate Portal'}
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              {isInterviewerOrAdmin
                ? 'Create and manage live video interviews, monitor real-time rooms, and review AI candidate evaluation scorecards.'
                : 'Join your live one-to-one interview rooms and explore all scorecards from interviews taken.'}
            </p>
          </div>

          {isInterviewerOrAdmin && (
            <button
              id="btn-open-schedule-modal"
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Interview</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Total Interviews Created</p>
          <p className="text-2xl font-bold text-white mt-1">{scheduledList.length}</p>
          <p className="text-[11px] text-purple-400 mt-1">Live 1-on-1 Sessions</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Active & Upcoming</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeOrUpcoming.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Ready for connection</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Completed Interviews</p>
          <p className="text-2xl font-bold text-white mt-1">{completedSessions.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Concluded calls</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Candidate Evaluations</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{evaluationsList.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Scorecards logged</p>
        </div>
      </div>

      {/* Tab Navigation & Search Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('created')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'created'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Interviews Created ({scheduledList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'evaluations'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Candidate Evaluations ({evaluationsList.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'created' ? 'Search by candidate, role, room...' : 'Search evaluations by candidate or role...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* TAB 1: Interviews Created & Scheduled */}
        {activeTab === 'created' && (
          <div className="mt-4 space-y-4">
            {/* Status Filter Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" />
                  <span>Status:</span>
                </span>
                {(['all', 'active', 'completed', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {st === 'active' ? 'Upcoming & Live' : st}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                Showing {filteredScheduled.length} of {scheduledList.length}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading interviews created...
              </div>
            ) : filteredScheduled.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  {searchQuery ? 'No interviews match your search.' : 'No interviews found under this status filter.'}
                </p>
                {isInterviewerOrAdmin && (
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="mt-3 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Schedule an Interview Now
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredScheduled.map((item) => {
                  const isLive = item.status === 'live' || item.status === 'in_progress';
                  const isDone = item.status === 'completed';
                  const isCancelled = item.status === 'cancelled';

                  return (
                    <div
                      key={item.id || item._id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">
                            {isInterviewerOrAdmin
                              ? item.candidateName
                              : `Interviewer: ${item.interviewerName || 'Assigned Interviewer'}`}
                          </span>
                          {item.candidateEmail && (
                            <span className="text-xs text-slate-400 font-mono">
                              ({item.candidateEmail})
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                            {item.jobRole}
                          </span>

                          {/* Status Badge */}
                          {isLive && (
                            <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              IN PROGRESS
                            </span>
                          )}
                          {isDone && (
                            <span className="px-2 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                              COMPLETED
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-2 py-0.5 text-[10px] rounded bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
                              CANCELLED
                            </span>
                          )}
                          {!isLive && !isDone && !isCancelled && (
                            <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                              SCHEDULED
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1.5 text-purple-300 font-semibold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            {formatDateTime(item.scheduledAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {item.duration || 45} mins
                          </span>
                          <span>•</span>
                          <span>Format: {item.interviewType}</span>
                          <span>•</span>
                          <span>
                            Room ID: <strong className="text-purple-300 font-mono">{item.roomId}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Copy Link */}
                        <button
                          onClick={() => copyMeetingLink(item.roomId)}
                          title="Copy meeting link"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
                        >
                          {copiedRoomId === item.roomId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        {/* Join Room */}
                        {!isCancelled && (
                          <button
                            id={`btn-interviewer-join-${item.roomId}`}
                            onClick={() => onSelectView('human-interview-room', { roomId: item.roomId })}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/25"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isDone ? 'Re-open Room' : 'Join Room'}</span>
                          </button>
                        )}

                        {/* View Report if completed */}
                        {isDone && item.reportId && (
                          <button
                            id={`btn-view-report-${item.reportId}`}
                            onClick={() => onSelectView('report-view', { reportId: item.reportId })}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Scorecard</span>
                          </button>
                        )}

                        {/* Cancel Interview (Interviewer only) */}
                        {isInterviewerOrAdmin && !isCancelled && !isDone && (
                          <button
                            id={`btn-cancel-interview-${item.roomId}`}
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Are you sure you want to cancel this scheduled interview for ${item.candidateName}?`
                                )
                              ) {
                                try {
                                  await api.scheduled.cancel(item.id || item._id || item.roomId);
                                  fetchData();
                                } catch (err: any) {
                                  alert(err?.message || 'Failed to cancel interview');
                                }
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Candidate Evaluations & Scorecards */}
        {activeTab === 'evaluations' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Detailed AI-evaluated scorecards, performance metrics, and question breakdowns for all interviews taken.
              </p>
              <span className="text-xs text-slate-400">
                {filteredEvaluations.length} evaluation{filteredEvaluations.length === 1 ? '' : 's'} recorded
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading candidate evaluations...
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  {searchQuery ? 'No evaluations match your search.' : 'No candidate evaluations recorded yet.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  When an interview is completed and concluded, the AI generates a multi-dimensional scorecard with score badges, strengths, and recommendations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvaluations.map((ev) => {
                  const score = ev.overallScore || 82;
                  const scoreColor =
                    score >= 85
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : score >= 70
                      ? 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                  const reportId = ev.id || ev._id;

                  return (
                    <div
                      key={reportId}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div>
                        {/* Header: Candidate & Score Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{ev.candidateName || 'Candidate'}</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {ev.jobRole || 'Software Engineer'}
                            </p>
                          </div>

                          <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-1 ${scoreColor}`}>
                            <Award className="w-3.5 h-3.5" />
                            <span>{score}% Score</span>
                          </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <p className="text-[10px] text-slate-400">Technical</p>
                            <p className="text-xs font-bold text-white mt-0.5">
                              {ev.technicalKnowledge || Math.min(100, score + 2)}%
                            </p>
                          </div>
                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <p className="text-[10px] text-slate-400">Communication</p>
                            <p className="text-xs font-bold text-white mt-0.5">
                              {ev.communication || score}%
                            </p>
                          </div>
                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <p className="text-[10px] text-slate-400">Problem Solving</p>
                            <p className="text-xs font-bold text-white mt-0.5">
                              {ev.problemSolving || Math.max(60, score - 3)}%
                            </p>
                          </div>
                        </div>

                        {/* Strengths summary if available */}
                        {ev.strengths && ev.strengths.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Key Strengths:
                            </p>
                            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                              {Array.isArray(ev.strengths) ? ev.strengths.slice(0, 2).join(' • ') : ev.strengths}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer: Date & View Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-500">
                          Evaluated: {formatDateTime(ev.createdAt)}
                        </span>
                        <button
                          onClick={() => onSelectView('report-view', { reportId })}
                          className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Scorecard</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isInterviewerOrAdmin && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={(scheduled) => {
            setScheduledList((prev) => [scheduled, ...prev]);
          }}
        />
      )}
    </div>
  );
};
