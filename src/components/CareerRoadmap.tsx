import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { CareerRoadmap as ICareerRoadmap, RoadmapWeek, RoadmapResource } from '../types';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  Target,
  Clock,
  Layers,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  Code2,
  FileCode,
  Flag,
  Calendar,
  X,
  Check,
} from 'lucide-react';

export interface CareerCategory {
  category: string;
  roles: string[];
}

export const CAREER_CATEGORIES: CareerCategory[] = [
  {
    category: 'Software Development',
    roles: [
      'Software Engineer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'Java Developer',
      'Python Developer',
      'C++ Developer',
    ],
  },
  {
    category: 'Web Development',
    roles: [
      'MERN Stack Developer',
      'React.js Developer',
      'Node.js Developer',
      'Angular Developer',
      'Next.js Developer',
    ],
  },
  {
    category: 'AI and Machine Learning',
    roles: [
      'AI Engineer',
      'Machine Learning Engineer',
      'Generative AI Engineer',
      'LLM Application Developer',
      'NLP Engineer',
      'Computer Vision Engineer',
    ],
  },
  {
    category: 'Data Careers',
    roles: [
      'Data Analyst',
      'Data Scientist',
      'Data Engineer',
      'Business Intelligence Developer',
    ],
  },
  {
    category: 'Cloud and DevOps',
    roles: [
      'Cloud Engineer',
      'AWS Cloud Engineer',
      'Azure Cloud Engineer',
      'DevOps Engineer',
      'Site Reliability Engineer',
    ],
  },
  {
    category: 'Cybersecurity',
    roles: [
      'Cybersecurity Analyst',
      'Security Engineer',
      'Penetration Testing Specialist',
    ],
  },
  {
    category: 'Mobile Development',
    roles: [
      'Android Developer',
      'iOS Developer',
      'Flutter Developer',
      'React Native Developer',
    ],
  },
  {
    category: 'Database and Systems',
    roles: [
      'Database Administrator',
      'SQL Developer',
      'System Engineer',
    ],
  },
  {
    category: 'Testing and QA',
    roles: [
      'QA Engineer',
      'Automation Test Engineer',
      'SDET',
    ],
  },
  {
    category: 'Other Technical Careers',
    roles: [
      'Blockchain Developer',
      'Embedded Systems Engineer',
      'Game Developer',
    ],
  },
];

export const DURATION_OPTIONS = [
  { months: 1, label: '1 Month', weeks: 4, desc: 'Intensive sprints & core practical skills' },
  { months: 2, label: '2 Months', weeks: 8, desc: 'Fundamentals, frameworks & working capstone' },
  { months: 3, label: '3 Months', weeks: 12, desc: 'Deep architecture, APIs & system design drills' },
  { months: 4, label: '4 Months', weeks: 16, desc: 'Enterprise systems, testing & observability' },
  { months: 5, label: '5 Months', weeks: 20, desc: 'Cloud native, Kubernetes & flagship apps' },
  { months: 6, label: '6 Months', weeks: 24, desc: 'Open source leadership & elite interview prep' },
];

export const CareerRoadmap: React.FC = () => {
  const [selectedCareer, setSelectedCareer] = useState<string>(() => {
    return localStorage.getItem('last_roadmap_career') || 'Software Engineer';
  });
  const [selectedDuration, setSelectedDuration] = useState<number>(() => {
    const saved = localStorage.getItem('last_roadmap_duration');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [roadmap, setRoadmap] = useState<ICareerRoadmap | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded weeks state (default: all expanded or first 2)
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'all'>('all');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRoadmap = async (career: string, durationMonths: number, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    localStorage.setItem('last_roadmap_career', career);
    localStorage.setItem('last_roadmap_duration', String(durationMonths));

    try {
      // Check existing roadmaps if not forcing refresh
      if (!forceRefresh) {
        try {
          const listRes = await api.roadmap.myRoadmaps();
          const expectedWeeks = durationMonths * 4;
          const existing = listRes.roadmaps?.find(
            (r: any) =>
              r.jobRole?.toLowerCase() === career.toLowerCase() &&
              (r.durationMonths === durationMonths || r.totalWeeks === expectedWeeks)
          );
          if (existing) {
            setRoadmap(existing);
            setCompletedTasks(existing.completedTasks || []);
            // Expand first 3 weeks by default
            const initialExpanded: Record<number, boolean> = {};
            (existing.weeks || []).forEach((w: RoadmapWeek, idx: number) => {
              initialExpanded[w.weekNumber] = idx < 3;
            });
            setExpandedWeeks(initialExpanded);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Could not check saved roadmaps:', e);
        }
      }

      const res = await api.roadmap.generate({ jobRole: career, durationMonths });
      if (res && res.roadmap) {
        setRoadmap(res.roadmap);
        setCompletedTasks(res.roadmap.completedTasks || []);
        // Expand first 3 weeks by default
        const initialExpanded: Record<number, boolean> = {};
        (res.roadmap.weeks || []).forEach((w: RoadmapWeek, idx: number) => {
          initialExpanded[w.weekNumber] = idx < 3;
        });
        setExpandedWeeks(initialExpanded);
      } else {
        throw new Error('No roadmap data returned by the server.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate career roadmap. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!roadmap) return;
    const roadmapId = roadmap.id || (roadmap as any)._id;

    // Optimistically update UI
    const isCompleted = completedTasks.includes(taskId);
    const updated = isCompleted
      ? completedTasks.filter((t) => t !== taskId)
      : [...completedTasks, taskId];
    setCompletedTasks(updated);

    try {
      if (roadmapId) {
        const res = await api.roadmap.toggleTask(roadmapId, taskId);
        if (res && res.completedTasks) {
          setCompletedTasks(res.completedTasks);
        }
      }
    } catch (err) {
      console.warn('Failed to persist task progress to server:', err);
      // Revert if failed
      setCompletedTasks(completedTasks);
    }
  };

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const toggleAllWeeks = () => {
    if (!roadmap?.weeks) return;
    const allExpanded = roadmap.weeks.every((w) => expandedWeeks[w.weekNumber]);
    const newState: Record<number, boolean> = {};
    roadmap.weeks.forEach((w) => {
      newState[w.weekNumber] = !allExpanded;
    });
    setExpandedWeeks(newState);
  };

  useEffect(() => {
    fetchRoadmap(selectedCareer, selectedDuration);
  }, [selectedCareer, selectedDuration]);

  // Filter career roles for searchable dropdown
  const filteredCategories = CAREER_CATEGORIES.map((cat) => ({
    ...cat,
    roles: cat.roles.filter(
      (r) =>
        r.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.roles.length > 0);

  // Find category for current selected role
  const currentCategory =
    CAREER_CATEGORIES.find((cat) => cat.roles.includes(selectedCareer))?.category ||
    'Software Development';

  // Compute total weeks and progress
  const totalWeeks =
    roadmap?.totalWeeks || (roadmap?.weeks ? roadmap.weeks.length : selectedDuration * 4);
  const completedWeeksCount = (roadmap?.weeks || []).filter((w) =>
    completedTasks.includes(`week_${w.weekNumber}`)
  ).length;
  const progressPercentage =
    totalWeeks > 0 ? Math.round((completedWeeksCount / totalWeeks) * 100) : 0;

  // Filter weeks by month if selected
  const displayedWeeks = (roadmap?.weeks || []).filter((w) => {
    if (selectedMonthFilter === 'all') return true;
    const weekMonth = Math.ceil(w.weekNumber / 4);
    return weekMonth === selectedMonthFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header & Controls Panel */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Career Roadmap & Preparation Curriculum
              </div>
              <h1 className="text-2xl font-extrabold text-white">Career Progression Roadmap</h1>
              <p className="text-sm text-slate-400">
                Tailored week-by-week curriculum, learning resources, coding exercises, and milestone projects.
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchRoadmap(selectedCareer, selectedDuration, true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-semibold rounded-xl transition-all self-start md:self-center disabled:opacity-50 shadow-sm"
            title="Generate fresh roadmap"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Roadmap
          </button>
        </div>

        {/* Form Controls: Career Role + Duration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800/80">
          {/* 1. Searchable Career Dropdown (5 Cols) */}
          <div className="lg:col-span-5 space-y-2 relative" ref={dropdownRef}>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Select Career Role</span>
              <span className="text-[11px] font-normal text-slate-400">43 Roles Available</span>
            </label>

            {/* Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl text-left flex items-center justify-between gap-3 text-white transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide truncate">
                  {currentCategory}
                </span>
                <span className="text-sm font-bold text-white truncate">{selectedCareer}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Overlay */}
            {isDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-[#0b1222] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
                {/* Search Input Box */}
                <div className="p-3 border-b border-slate-800 bg-slate-900/80">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search across 43 career roles..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Categorized Roles List */}
                <div className="max-h-72 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                  {filteredCategories.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No career roles found matching "{searchQuery}".
                    </div>
                  ) : (
                    filteredCategories.map((cat) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>{cat.category}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {cat.roles.length}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {cat.roles.map((role) => {
                            const isSelected = selectedCareer === role;
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  setSelectedCareer(role);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-cyan-600 text-white font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                }`}
                              >
                                <span>{role}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Duration Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                How much time do you have to prepare?
              </label>
              <span className="text-[11px] font-bold text-cyan-400">
                {selectedDuration} {selectedDuration === 1 ? 'Month' : 'Months'} = {selectedDuration * 4} Weeks
              </span>
            </div>

            {/* 6 Duration Options Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDuration === opt.months;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setSelectedDuration(opt.months)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-600/30 to-indigo-600/20 border-cyan-400 text-white shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400/50'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                      }`}
                    >
                      {opt.weeks} Wks
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Duration directly structures the learning depth, project scope, and weekly curriculum.
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">
              Synthesizing {selectedDuration * 4}-Week Curriculum for {selectedCareer}...
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Curating official documentation, coding assignments, architectural milestones, and interview defense topics.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded-full bg-red-900/30 border border-red-700/50 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-200">Roadmap Generation Failed</h3>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchRoadmap(selectedCareer, selectedDuration, true)}
            className="px-4 py-1.5 bg-red-800/60 hover:bg-red-700/60 border border-red-700 text-xs font-semibold text-white rounded-lg transition-all"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Roadmap Content */}
      {roadmap && !loading && (
        <div className="space-y-6">
          {/* Overview Banner & Progress */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {currentCategory}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {roadmap.durationMonths || selectedDuration} Months ({totalWeeks} Weeks)
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white mt-2">
                  {roadmap.jobRole || selectedCareer}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete week-by-week learning syllabus, direct reference links, practical assignments, and milestone deliverables.
                </p>
              </div>

              {/* Progress Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Preparation Progress</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {progressPercentage}% Complete
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>
                    {completedWeeksCount} of {totalWeeks} Weeks Done
                  </span>
                  <span>{totalWeeks - completedWeeksCount} Remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Required Skills Section */}
          {roadmap.requiredSkills && roadmap.requiredSkills.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Key Competencies & Technical Skills Target
              </h3>
              <div className="flex flex-wrap gap-2">
                {roadmap.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 text-xs font-medium rounded-lg transition-all"
                  >
                    <Zap className="w-3 h-3 text-cyan-400" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Month Quick Tabs & Expand All Controls */}
          {roadmap.weeks && roadmap.weeks.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Month Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonthFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedMonthFilter === 'all'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All {totalWeeks} Weeks
                </button>
                {Array.from({ length: Math.ceil(totalWeeks / 4) }).map((_, mIdx) => {
                  const mNum = mIdx + 1;
                  const startW = (mNum - 1) * 4 + 1;
                  const endW = Math.min(totalWeeks, mNum * 4);
                  return (
                    <button
                      key={mNum}
                      type="button"
                      onClick={() => setSelectedMonthFilter(mNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedMonthFilter === mNum
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      Month {mNum} (W{startW}-{endW})
                    </button>
                  );
                })}
              </div>

              {/* Expand / Collapse All */}
              <button
                type="button"
                onClick={toggleAllWeeks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Toggle All Details
              </button>
            </div>
          )}

          {/* WEEK-BY-WEEK ACCORDION CARDS */}
          {roadmap.weeks && roadmap.weeks.length > 0 ? (
            <div className="space-y-4">
              {displayedWeeks.map((week) => {
                const isExpanded = !!expandedWeeks[week.weekNumber];
                const isCompleted = completedTasks.includes(`week_${week.weekNumber}`);

                return (
                  <div
                    key={week.weekNumber}
                    className={`bg-[#0f172a] border rounded-2xl transition-all shadow-xl overflow-hidden ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : isExpanded
                        ? 'border-cyan-500/40 ring-1 ring-cyan-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Week Header (Click to toggle expansion) */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Checkbox + Week Title */}
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        {/* Completion Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(`week_${week.weekNumber}`)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/30'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-transparent'
                          }`}
                          title={isCompleted ? 'Mark week incomplete' : 'Mark week completed'}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Week Badge + Title */}
                        <div
                          className="cursor-pointer flex-1 min-w-0"
                          onClick={() => toggleWeek(week.weekNumber)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Week {String(week.weekNumber).padStart(2, '0')}
                            </span>
                            {week.estimatedHours && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {week.estimatedHours}
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                Completed
                              </span>
                            )}
                          </div>
                          <h4
                            className={`text-base font-bold mt-1 text-white truncate ${
                              isCompleted ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {week.title}
                          </h4>
                        </div>
                      </div>

                      {/* Right: Expand Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleWeek(week.weekNumber)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Syllabus'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Week Expanded Body */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-2 border-t border-slate-800/80 space-y-5 animate-in fade-in duration-150">
                        {/* Detailed Explanation */}
                        {week.detailedExplanation && (
                          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              What to Study & Architectural Context
                            </div>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              {week.detailedExplanation}
                            </p>
                          </div>
                        )}

                        {/* Two Columns: Learning Objectives & Topics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Learning Objectives */}
                          {week.learningObjectives && week.learningObjectives.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
                              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-indigo-400" />
                                Learning Objectives
                              </div>
                              <ul className="space-y-1.5">
                                {week.learningObjectives.map((obj, oIdx) => (
                                  <li
                                    key={oIdx}
                                    className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{obj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Topics to Learn */}
                          {week.topics && week.topics.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
                              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                Topics & Technologies
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {week.topics.map((t, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-md font-medium"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Learning Resources with Direct Clickable Links */}
                        {week.resources && week.resources.length > 0 && (
                          <div className="space-y-2.5 pt-1">
                            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                              Curated Learning Resources & Documentation
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {week.resources.map((res: RoadmapResource, rIdx: number) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                        {res.type || 'Documentation'}
                                      </span>
                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                                      {res.title}
                                    </h5>
                                    {res.description && (
                                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                        {res.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-2.5 text-[10px] text-cyan-400 font-semibold flex items-center gap-1 truncate">
                                    <span>Open Resource</span>
                                    <span>&rarr;</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Practical Coding Exercises & Weekly Assignments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Exercises */}
                          {week.practicalExercises && week.practicalExercises.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                                Practical Coding Exercises
                              </div>
                              <ul className="space-y-1.5">
                                {week.practicalExercises.map((ex, eIdx) => (
                                  <li
                                    key={eIdx}
                                    className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                                  >
                                    <span className="text-[10px] font-bold text-cyan-400 mt-0.5">
                                      0{eIdx + 1}.
                                    </span>
                                    <span>{ex}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Weekly Assignments */}
                          {week.weeklyAssignments && week.weeklyAssignments.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                                Weekly Assignment & Deliverable
                              </div>
                              <ul className="space-y-1.5">
                                {week.weeklyAssignments.map((asg, aIdx) => (
                                  <li
                                    key={aIdx}
                                    className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                                  >
                                    <span className="text-[10px] font-bold text-indigo-400 mt-0.5">
                                      &bull;
                                    </span>
                                    <span>{asg}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Project Milestone & Expected Outcomes */}
                        {(week.projectMilestone || (week.expectedOutcomes && week.expectedOutcomes.length > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            {/* Project Milestone */}
                            {week.projectMilestone && (
                              <div className="bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-800/40 rounded-xl p-4">
                                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                                  Project Milestone Checkpoint
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                  {week.projectMilestone}
                                </p>
                              </div>
                            )}

                            {/* Expected Outcomes */}
                            {week.expectedOutcomes && week.expectedOutcomes.length > 0 && (
                              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                                  Expected Learning Outcomes
                                </div>
                                <ul className="space-y-1">
                                  {week.expectedOutcomes.map((out, oIdx) => (
                                    <li
                                      key={oIdx}
                                      className="text-xs text-slate-300 flex items-start gap-1.5"
                                    >
                                      <span className="text-emerald-400">&check;</span>
                                      <span>{out}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback for legacy roadmaps that only have learningTopics */
            roadmap.learningTopics &&
            roadmap.learningTopics.length > 0 && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <span>
                    Viewing a saved roadmap from a previous format. Click Regenerate to upgrade to the new week-by-week curriculum.
                  </span>
                  <button
                    onClick={() => fetchRoadmap(selectedCareer, selectedDuration, true)}
                    className="px-2.5 py-1 bg-amber-800/60 hover:bg-amber-700/60 rounded text-xs font-semibold text-white ml-2"
                  >
                    Regenerate
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {roadmap.learningTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                          {topic.stage}
                        </span>
                        <span className="text-xs text-slate-400">{topic.duration}</span>
                      </div>
                      <h4 className="text-base font-bold text-white">{topic.title}</h4>
                      <p className="text-xs text-slate-300">{topic.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Career Progression Pathway */}
          {roadmap.progression && roadmap.progression.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Preparation Timeline & Milestone Milestones
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roadmap.progression.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed font-medium">
                      {milestone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Column Grid: Interview Preparation & Areas to Improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview Preparation */}
            {roadmap.interviewPreparation && roadmap.interviewPreparation.length > 0 && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Interview Preparation Focus & Defense Drills
                </h3>
                <ul className="space-y-2.5">
                  {roadmap.interviewPreparation.map((prep, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{prep}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas to Improve & Traps to Avoid */}
            {roadmap.areasToImprove && roadmap.areasToImprove.length > 0 && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Areas to Improve & Traps to Avoid
                </h3>
                <ul className="space-y-2.5">
                  {roadmap.areasToImprove.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
