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
} from 'lucide-react';

interface InterviewerDashboardProps {
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

export const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({ onSelectView }) => {
  const { user } = useAuth();
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = async () => {
    try {
      const res = await api.scheduled.list();
      setScheduledList(res.scheduledInterviews || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const activeOrUpcoming = scheduledList.filter(
    (s) => s.status !== 'completed' && s.status !== 'cancelled'
  );
  const completedSessions = scheduledList.filter((s) => s.status === 'completed');
  const cancelledSessions = scheduledList.filter((s) => s.status === 'cancelled');
  const isInterviewerOrAdmin = user?.role === 'interviewer' || user?.role === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hub Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {isInterviewerOrAdmin ? `Hello, ${user?.fullName || 'Interviewer'}` : 'Live Interview Rooms'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              {isInterviewerOrAdmin
                ? 'Schedule and manage live video interviews with candidates, record notes, and review evaluation scorecards.'
                : 'Join your scheduled live video interview rooms with assigned interviewers and view completed scorecards.'}
            </p>
          </div>

          {isInterviewerOrAdmin && (
            <button
              id="btn-open-schedule-modal"
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule interview</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Upcoming sessions</p>
          <p className="text-2xl font-bold text-white mt-1">{activeOrUpcoming.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Ready to join</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Completed interviews</p>
          <p className="text-2xl font-bold text-white mt-1">{completedSessions.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Scorecards available</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400">Meeting provider</p>
          <p className="text-base font-bold text-white mt-1">WebRTC Video</p>
          <p className="text-[11px] text-slate-500 mt-1">Encrypted peer rooms</p>
        </div>
      </div>

      {/* Scheduled Sessions List */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              Upcoming interviews
            </h2>
          </div>
          <span className="text-xs text-slate-400">{activeOrUpcoming.length} scheduled</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading scheduled interviews...</div>
        ) : activeOrUpcoming.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">
              {isInterviewerOrAdmin ? 'No upcoming interviews scheduled.' : 'No live interviews currently scheduled for you.'}
            </p>
            {isInterviewerOrAdmin ? (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Schedule an Interview Now
              </button>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Your assigned interviewer will schedule your session here. When scheduled, you will be able to join the room directly.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {activeOrUpcoming.map((item) => (
              <div key={item.id || item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      {isInterviewerOrAdmin ? item.candidateName : `Interviewer: ${item.interviewerName || 'Assigned Interviewer'}`}
                    </span>
                    {isInterviewerOrAdmin && item.candidateEmail && (
                      <span className="text-xs text-slate-400">({item.candidateEmail})</span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                      {item.jobRole}
                    </span>
                    {(item.status === 'live' || item.status === 'in_progress') && (
                      <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold animate-pulse">
                        IN PROGRESS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
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

                <div className="flex items-center gap-2">
                  <button
                    id={`btn-interviewer-join-${item.roomId}`}
                    onClick={() => onSelectView('human-interview-room', { roomId: item.roomId })}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join room</span>
                  </button>
                  {isInterviewerOrAdmin && (
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
                            fetchScheduled();
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
            ))}
          </div>
        )}
      </div>

      {/* Completed Interviews */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Interview history
            </h2>
          </div>
          <span className="text-xs text-slate-400">{completedSessions.length} completed</span>
        </div>

        {completedSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No completed human interviews yet. Conclude a live session to view AI scorecards.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {completedSessions.map((session) => (
              <div key={session.id || session._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isInterviewerOrAdmin
                      ? `${session.candidateName} • ${session.jobRole}`
                      : `${session.jobRole} • Interview with ${session.interviewerName || 'Interviewer'}`}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {session.interviewType} • Completed Session
                  </p>
                </div>

                {session.reportId ? (
                  <button
                    id={`btn-view-report-${session.reportId}`}
                    onClick={() => onSelectView('report-view', { reportId: session.reportId })}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Scorecard</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">Processing</span>
                )}
              </div>
            ))}
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
