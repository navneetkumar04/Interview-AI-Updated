import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TECH_ROLES, TECH_ROLE_NAMES } from '../constants/techRoles';
import {
  X,
  Calendar,
  Clock,
  Video,
  User,
  Mail,
  Sparkles,
  CheckCircle2,
  CalendarClock,
  ChevronDown,
} from 'lucide-react';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (scheduled: any) => void;
}

// Generate standard 30-minute time slots from 07:00 AM to 10:00 PM
const TIME_SLOTS: Array<{ value: string; label: string }> = [];
for (let h = 7; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) continue;
    const hourStr = String(h).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');
    const value = `${hourStr}:${minStr}`;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const label = `${displayHour}:${minStr} ${period}`;
    TIME_SLOTS.push({ value, label });
  }
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [scheduleMode, setScheduleMode] = useState<'select' | 'email'>('select');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateId, setCandidateId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobRole, setJobRole] = useState('Senior Full Stack Engineer');
  const [interviewType, setInterviewType] = useState('Technical Coding & System Design');

  // Separated date and time for 100% reliable cross-browser selection
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [duration, setDuration] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format Date as local YYYY-MM-DD
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatLocalDate(new Date());

  useEffect(() => {
    if (isOpen) {
      // Default date & time: now + 1 hour, rounded to next 30 minutes
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const minutes = nextHour.getMinutes();
      if (minutes > 30) {
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0, 0, 0);
      } else {
        nextHour.setMinutes(30, 0, 0);
      }

      setInterviewDate(formatLocalDate(nextHour));
      const hh = String(nextHour.getHours()).padStart(2, '0');
      const mm = String(nextHour.getMinutes()).padStart(2, '0');
      setInterviewTime(`${hh}:${mm}`);
      setError(null);

      // Fetch candidates list
      api.users
        .candidates()
        .then((res) => {
          const list = res.candidates || [];
          setCandidates(list);
          if (list.length > 0) {
            setCandidateId(list[0].id || list[0]._id);
            setCandidateName(list[0].fullName);
            setCandidateEmail(list[0].email);
            if (list[0].preferredRole) {
              setJobRole(list[0].preferredRole);
            }
          } else {
            setScheduleMode('email');
          }
        })
        .catch(() => {
          setScheduleMode('email');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCandidate = (cId: string) => {
    setCandidateId(cId);
    const found = candidates.find((c) => (c.id || c._id) === cId);
    if (found) {
      setCandidateName(found.fullName);
      setCandidateEmail(found.email);
      if (found.preferredRole) {
        setJobRole(found.preferredRole);
      }
    }
  };

  // Quick preset helper
  const handleApplyPreset = (preset: 'today' | 'tomorrow_morning' | 'tomorrow_afternoon' | 'in_2_days') => {
    const d = new Date();
    if (preset === 'today') {
      const target = new Date(d.getTime() + 60 * 60 * 1000);
      setInterviewDate(formatLocalDate(target));
      const hh = String(target.getHours()).padStart(2, '0');
      setInterviewTime(`${hh}:00`);
    } else if (preset === 'tomorrow_morning') {
      d.setDate(d.getDate() + 1);
      setInterviewDate(formatLocalDate(d));
      setInterviewTime('10:00');
    } else if (preset === 'tomorrow_afternoon') {
      d.setDate(d.getDate() + 1);
      setInterviewDate(formatLocalDate(d));
      setInterviewTime('14:00');
    } else if (preset === 'in_2_days') {
      d.setDate(d.getDate() + 2);
      setInterviewDate(formatLocalDate(d));
      setInterviewTime('11:00');
    }
  };

  // Calculate human-readable preview date
  let previewDateObj: Date | null = null;
  if (interviewDate && interviewTime) {
    const [y, m, d] = interviewDate.split('-').map(Number);
    const [hh, mm] = interviewTime.split(':').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && !isNaN(hh) && !isNaN(mm)) {
      previewDateObj = new Date(y, m - 1, d, hh, mm);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate email if email mode
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (scheduleMode === 'email') {
      if (!candidateEmail.trim() || !emailRegex.test(candidateEmail.trim())) {
        setError('Please enter a valid candidate email address.');
        return;
      }
    }

    // 2. Validate date and time
    if (!interviewDate) {
      setError('Please select an interview date.');
      return;
    }
    if (!interviewTime) {
      setError('Please select an interview time.');
      return;
    }

    const [y, m, d] = interviewDate.split('-').map(Number);
    const [hh, mm] = interviewTime.split(':').map(Number);
    const scheduledDateTime = new Date(y, m - 1, d, hh, mm, 0);

    if (isNaN(scheduledDateTime.getTime())) {
      setError('The selected date and time is invalid. Please pick a valid time.');
      return;
    }

    // Don't allow scheduling more than 15 minutes in the past
    if (scheduledDateTime.getTime() < Date.now() - 15 * 60 * 1000) {
      setError('Please select a future date and time for the interview.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        jobRole: jobRole.trim(),
        interviewType,
        scheduledAt: scheduledDateTime.toISOString(),
        duration,
      };

      if (scheduleMode === 'select' && candidateId) {
        payload.candidateId = candidateId;
        payload.candidateEmail = candidateEmail.trim().toLowerCase();
        payload.candidateName = candidateName;
      } else {
        payload.candidateEmail = candidateEmail.trim().toLowerCase();
        payload.candidateName = candidateName.trim() || candidateEmail.split('@')[0];
      }

      const res = await api.scheduled.create(payload);
      onSuccess(res.interview);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="schedule-modal"
        className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Schedule Live Interview</h2>
            <p className="text-xs text-slate-400">
              Creates a private encrypted video room restricted to the authorized candidate
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Mode Selector Toggle */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 mb-4">
          <button
            type="button"
            onClick={() => setScheduleMode('select')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              scheduleMode === 'select'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Select Candidate</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setScheduleMode('email');
              setCandidateId('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              scheduleMode === 'email'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invite by Email</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Candidate Selection */}
          {scheduleMode === 'select' ? (
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Candidate
              </label>
              {candidates.length > 0 ? (
                <select
                  id="select-candidate"
                  value={candidateId}
                  onChange={(e) => handleSelectCandidate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {candidates.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.fullName} ({c.email}) - {c.preferredRole || 'Candidate'}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  No registered candidates found. Please switch to &quot;Invite by Email&quot;.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Candidate Verified Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  id="input-candidate-email"
                  type="email"
                  required
                  placeholder="e.g. candidate@gmail.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Private access will be strictly restricted to this verified email address upon sign-in.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Candidate Full Name (Optional)
                </label>
                <input
                  id="input-candidate-name"
                  type="text"
                  placeholder="e.g. Navneet Kumar"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Job Role */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold uppercase tracking-wider text-slate-300">
                Target Tech Role ({TECH_ROLES.length} Curated Specializations)
              </label>
            </div>

            {/* Quick dropdown for 12 tech roles */}
            <div className="mb-2">
              <select
                id="select-sched-tech-role"
                value={TECH_ROLE_NAMES.includes(jobRole) ? jobRole : ''}
                onChange={(e) => {
                  if (e.target.value) setJobRole(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="" disabled>-- Select from 12 Curated Tech Specializations --</option>
                {TECH_ROLES.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.category})
                  </option>
                ))}
              </select>
            </div>

            <input
              id="input-sched-role"
              type="text"
              required
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Principal Distributed Systems Architect"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Interview Format
            </label>
            <select
              id="select-sched-type"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="Technical Coding & System Design">Technical Coding & System Design</option>
              <option value="Architecture & Scale Deep Dive">Architecture & Scale Deep Dive</option>
              <option value="Behavioral & Leadership Principles">Behavioral & Leadership Principles (STAR)</option>
              <option value="Executive Bar Raiser">Executive Bar Raiser</option>
            </select>
          </div>

          {/* Quick Schedule Presets */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-1.5">
              Quick Date & Time Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('today')}
                className="py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors text-center cursor-pointer"
              >
                Today (+1 hr)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tomorrow_morning')}
                className="py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors text-center cursor-pointer"
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tomorrow_afternoon')}
                className="py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors text-center cursor-pointer"
              >
                Tomorrow 2 PM
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('in_2_days')}
                className="py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60 transition-colors text-center cursor-pointer"
              >
                In 2 Days 11 AM
              </button>
            </div>
          </div>

          {/* Date, Time, and Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Date Selector */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Interview Date
              </label>
              <div className="relative">
                <input
                  id="input-sched-date"
                  type="date"
                  required
                  min={todayStr}
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker?.();
                    } catch {}
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Time Slot Selector */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Time Slot
              </label>
              <div className="relative">
                <select
                  id="select-sched-time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Duration */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Duration
              </label>
              <select
                id="select-sched-duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
              </select>
            </div>
          </div>

          {/* Live Schedule Confirmation Card */}
          {previewDateObj && !isNaN(previewDateObj.getTime()) && (
            <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 shrink-0">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Confirmed Schedule Preview
                </span>
                <span className="text-xs font-bold text-purple-200">
                  {previewDateObj.toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {previewDateObj.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  <span className="text-slate-400 font-normal">({duration} minutes)</span>
                </span>
              </div>
            </div>
          )}

          <button
            id="btn-submit-schedule"
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>Confirm & Generate Private Room</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
