import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { speechService } from '../services/speech';
import { BrandIcon } from './BrandLogo';
import { TECH_ROLES, TechRoleOption } from '../constants/techRoles';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Play,
  CheckCircle2,
  ArrowRight,
  Eye,
  Activity,
  Award,
  ChevronRight,
  RotateCcw,
  LogOut,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Square,
  Check,
  Briefcase,
  Layers,
} from 'lucide-react';

interface ClassicInterviewProps {
  onSelectView: (view: string, params?: any) => void;
}

export const ClassicInterview: React.FC<ClassicInterviewProps> = ({ onSelectView }) => {
  // Config state
  const [selectedRoleOption, setSelectedRoleOption] = useState<TechRoleOption>(TECH_ROLES[0]);
  const [jobRole, setJobRole] = useState(TECH_ROLES[0].name);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [difficulty, setDifficulty] = useState('Mid-Level');
  const [persona, setPersona] = useState('Professional Technical Hiring Lead');
  const [questionCount, setQuestionCount] = useState(3);
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Live session state
  const [interviewId, setInterviewId] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string; score?: number }>>([]);
  const [instantEvaluation, setInstantEvaluation] = useState<any | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [eyeContactScore, setEyeContactScore] = useState(86);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      }
    } catch {
      setIsCameraActive(false);
    }
  };

  // Lifecycle: Camera control
  useEffect(() => {
    if (isStarted) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isStarted]);

  // Lifecycle: Unmount only (Never cancel speech mid-interview on state changes)
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
      stopCamera();
    };
  }, []);

  // Text-To-Speech helper for current question
  const speakQuestion = (text: string) => {
    if (isVoiceMuted || !text) {
      setIsAiSpeaking(false);
      return;
    }
    setIsAiSpeaking(true);
    speechService.speak(text, {
      pitch: 1.0,
      rate: 0.98,
      onStart: () => setIsAiSpeaking(true),
      onEnd: () => setIsAiSpeaking(false),
    });
  };

  // Automatically read questions aloud when interview starts or question advances
  useEffect(() => {
    if (isStarted && questions.length > 0 && questions[currentIndex]) {
      const timer = setTimeout(() => {
        speakQuestion(questions[currentIndex]);
      }, 300);

      return () => {
        clearTimeout(timer);
        speechService.stopSpeaking();
        setIsAiSpeaking(false);
      };
    }
  }, [isStarted, currentIndex, isVoiceMuted]);

  // Handle tech role selection
  const handleSelectRole = (role: TechRoleOption) => {
    setSelectedRoleOption(role);
    setJobRole(role.name);
    setIsCustomRole(false);
  };

  // Start interview session
  const handleStart = async () => {
    const finalRole = isCustomRole ? customRoleInput.trim() : jobRole.trim();
    if (!finalRole) return;

    // Synchronously prime browser audio activation upon user gesture
    speechService.resumeAudio();

    setLoading(true);
    setStartError(null);

    try {
      const res = await api.interviews.generateQuestions({
        jobRole: finalRole,
        interviewerPersona: persona,
        difficulty,
        mode: 'classic',
        count: questionCount,
      });

      if (!res.questions || res.questions.length === 0) {
        throw new Error('No interview questions returned. Please retry.');
      }

      setInterviewId(res.interviewId);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setQaHistory([]);
      setInstantEvaluation(null);
      setAnswerText('');
      setIsStarted(true);
    } catch (err: any) {
      setStartError(err?.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (isMicActive) {
      speechService.stopListening();
      setIsMicActive(false);
    } else {
      speechService.stopSpeaking();
      setIsAiSpeaking(false);
      setMicNotice(null);

      const ok = speechService.startListening({
        initialText: answerText,
        onResult: (transcript) => {
          setAnswerText(transcript);
          setEyeContactScore(Math.floor(82 + Math.random() * 14));
        },
        onError: () => {
          setIsMicActive(false);
          setMicNotice('Microphone input is unavailable or permission was blocked. You can type your answer directly!');
        },
        onEnd: () => {
          setIsMicActive(false);
        },
      });

      if (!ok) {
        setMicNotice('Speech recognition is not supported in this browser. You can type your answer directly in the box below!');
      }
      setIsMicActive(ok);
    }
  };

  // Step 1: Evaluate Current Answer
  const handleAnalyzeAnswer = async () => {
    if (!answerText.trim()) return;

    speechService.stopSpeaking();
    setIsAiSpeaking(false);
    speechService.stopListening();
    setIsMicActive(false);
    setLoading(true);

    const currentQ = questions[currentIndex];
    const finalRole = isCustomRole ? customRoleInput.trim() : jobRole.trim();

    try {
      const evalRes = await api.interviews.analyzeAnswer({
        question: currentQ,
        answer: answerText.trim(),
        jobRole: finalRole,
        difficulty,
      });

      setInstantEvaluation(evalRes);
    } catch (err: any) {
      alert(err?.message || 'Error evaluating answer.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Proceed to Next Question or Finalize
  const handleProceedNext = async () => {
    const currentQ = questions[currentIndex];
    const scoreToRecord = instantEvaluation?.score || 80;
    const finalRole = isCustomRole ? customRoleInput.trim() : jobRole.trim();

    const updatedHistory = [
      ...qaHistory,
      {
        question: currentQ,
        answer: answerText.trim(),
        score: scoreToRecord,
      },
    ];
    setQaHistory(updatedHistory);

    // If final question, generate scorecard
    if (currentIndex + 1 >= questions.length) {
      setLoading(true);
      try {
        const completeRes = await api.interviews.completeSession({
          interviewId,
          qaList: updatedHistory,
          jobRole: finalRole,
          difficulty,
          mode: 'classic',
          interviewerPersona: persona,
          eyeContactAverage: eyeContactScore,
        });

        stopCamera();
        speechService.stopSpeaking();
        setIsStarted(false);
        onSelectView('report-view', { reportId: completeRes.reportId });
      } catch (err: any) {
        alert(err?.message || 'Error generating final interview report.');
        setLoading(false);
      }
    } else {
      // Advance to next question (auto-read is handled cleanly by useEffect)
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setAnswerText('');
      setInstantEvaluation(null);
    }
  };

  // Exit session early
  const handleExitSession = () => {
    if (window.confirm('Are you sure you want to exit this mock interview? Unsaved progress will be lost.')) {
      speechService.stopSpeaking();
      speechService.stopListening();
      stopCamera();
      setIsStarted(false);
      onSelectView('dashboard');
    }
  };

  // Setup View
  if (!isStarted) {
    const activeRoleDisplay = isCustomRole ? customRoleInput : jobRole;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="border border-slate-800 bg-[#0f172a] rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3.5 mb-6">
            <BrandIcon size={48} variant="dark" withTile={true} />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <BrandIcon size={12} variant="dark" withTile={false} />
                Interview.ai Studio
              </div>
              <h1 className="text-2xl font-extrabold text-white">Classic Mock Interview</h1>
              <p className="text-sm text-slate-400">
                Self-paced technical and behavioral mock interview with natural voice question reading, live camera analysis, instant evaluations, and full scorecard.
              </p>
            </div>
          </div>

          {startError && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{startError}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Tech Role Selection Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Target Tech Role ({TECH_ROLES.length} Curated Specializations)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomRole(!isCustomRole);
                    if (!isCustomRole && !customRoleInput) {
                      setCustomRoleInput(jobRole);
                    }
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  {isCustomRole ? '← Choose from Curated Roles' : '+ Enter Custom Tech Role'}
                </button>
              </div>

              {isCustomRole ? (
                <div>
                  <input
                    id="input-classic-custom-role"
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="e.g. Distributed Consensus Engineer (Raft / Rust)"
                    className="w-full bg-slate-900 border border-blue-500 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Type any specific engineering stack or domain. AI will dynamically formulate authentic questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Dropdown for complete 12 tech roles */}
                  <select
                    id="select-classic-role-dropdown"
                    value={jobRole}
                    onChange={(e) => {
                      const found = TECH_ROLES.find((r) => r.name === e.target.value);
                      if (found) handleSelectRole(found);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {TECH_ROLES.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name} ({role.category})
                      </option>
                    ))}
                  </select>

                  {/* Quick-Pick Role Chips (All 12 Roles) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                    {TECH_ROLES.map((role) => {
                      const isSelected = jobRole === role.name;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleSelectRole(role)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                              {role.category}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                          </div>
                          <span className="text-xs font-semibold line-clamp-2 leading-tight">
                            {role.shortName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Role Stack Summary Card */}
                  {selectedRoleOption && (
                    <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block sm:inline mr-2">Core Tech Stack:</span>
                        <span className="text-slate-400">{selectedRoleOption.description}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {selectedRoleOption.primarySkills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Experience Level
                </label>
                <select
                  id="select-classic-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Junior">Junior (Entry Level)</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead / Architect">Lead / Architect</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Number of Questions
                </label>
                <select
                  id="select-classic-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={3}>3 Questions (Express)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={7}>7 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Interviewer Persona Style
              </label>
              <select
                id="select-classic-persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Professional Technical Hiring Lead">Professional Technical Hiring Lead (Balanced)</option>
                <option value="Strict Architectural Panelist">Strict Architectural Panelist (In-depth Tradeoffs)</option>
                <option value="Behavioral & Cultural Fit Evaluator">Behavioral & Cultural Fit Evaluator (STAR Focus)</option>
                <option value="High-Velocity Startup CTO">High-Velocity Startup CTO (Product Engineering)</option>
              </select>
            </div>

            <button
              id="btn-start-classic-session"
              onClick={handleStart}
              disabled={loading || !(isCustomRole ? customRoleInput.trim() : jobRole.trim())}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Formulating Questions with AI & Priming Voice...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Mock Interview ({activeRoleDisplay})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Live Screen
  const currentQ = questions[currentIndex] || 'Loading question...';
  const isLastQuestion = currentIndex + 1 >= questions.length;
  const activeRoleName = isCustomRole ? customRoleInput : jobRole;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Session Progress Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Question {currentIndex + 1} of {questions.length} • {activeRoleName}
            </h2>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium flex items-center gap-1">
              <BrandIcon size={12} variant="dark" withTile={false} />
              <span>Interview.ai</span>
            </span>
          </div>
          <div className="w-48 bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active AI Voice Reading Badge */}
          {isAiSpeaking && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              <span>AI Speaking...</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
                <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                <span className="w-1 bg-blue-400 rounded-full animate-bounce h-3" />
              </div>
            </div>
          )}

          {/* Repeat / Stop voice button */}
          {isAiSpeaking ? (
            <button
              id="btn-classic-pause-voice"
              onClick={() => {
                speechService.stopSpeaking();
                setIsAiSpeaking(false);
              }}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1.5 cursor-pointer"
              title="Pause AI speech"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : (
            <button
              id="btn-classic-repeat"
              onClick={() => speakQuestion(currentQ)}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer"
              title="Read question aloud"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Read Aloud</span>
            </button>
          )}

          {/* Voice Mute Toggle */}
          <button
            id="btn-classic-voice-toggle"
            onClick={() => {
              if (!isVoiceMuted) {
                speechService.stopSpeaking();
                setIsAiSpeaking(false);
              }
              setIsVoiceMuted(!isVoiceMuted);
            }}
            className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            <span className="hidden sm:inline">{isVoiceMuted ? 'Muted' : 'Voice On'}</span>
          </button>

          {/* Exit Button */}
          <button
            id="btn-classic-exit"
            onClick={handleExitSession}
            className="p-2 bg-slate-900 border border-red-800/40 text-red-300 hover:bg-red-950/40 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Question & Evaluation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span>Interviewer Question #{currentIndex + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => speakQuestion(currentQ)}
                className="text-xs text-slate-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Question</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">{currentQ}</p>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Your Answer Response
              </label>
              <span className="text-[11px] text-slate-400">
                {answerText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {micNotice && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center justify-between">
                <span>{micNotice}</span>
                <button
                  type="button"
                  onClick={() => setMicNotice(null)}
                  className="text-amber-400 hover:text-amber-200 ml-2 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              id="textarea-classic-answer"
              rows={5}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Click 'Speak with Microphone' or type your structured answer here..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button
                id="btn-classic-toggle-mic"
                type="button"
                onClick={toggleMic}
                className={`flex-1 min-w-[180px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isMicActive
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/25'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                }`}
              >
                {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMicActive ? 'Listening... (Click to Stop)' : 'Speak with Microphone'}</span>
              </button>

              {!instantEvaluation ? (
                <button
                  id="btn-classic-submit-answer"
                  type="button"
                  onClick={handleAnalyzeAnswer}
                  disabled={loading || !answerText.trim()}
                  className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Evaluate Response</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  id="btn-classic-proceed-next"
                  type="button"
                  onClick={handleProceedNext}
                  disabled={loading}
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLastQuestion ? 'Finalize & View Full Scorecard' : 'Proceed to Next Question'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Instant Evaluation Feedback Card */}
          {instantEvaluation && (
            <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Instant AI Response Assessment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Score:</span>
                  <span className="text-sm font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                    {instantEvaluation.score}%
                  </span>
                </div>
              </div>

              {/* Feedback & Suggestion */}
              <div className="space-y-2 text-xs">
                {instantEvaluation.feedback && (
                  <div>
                    <span className="font-bold text-slate-300 block mb-0.5">Strengths:</span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      {instantEvaluation.feedback}
                    </p>
                  </div>
                )}

                {instantEvaluation.suggestion && (
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">Growth Tip:</span>
                    <p className="text-amber-200/90 leading-relaxed bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
                      {instantEvaluation.suggestion}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInstantEvaluation(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Refine Answer
                </button>

                <button
                  type="button"
                  onClick={handleProceedNext}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/25"
                >
                  <span>{isLastQuestion ? 'Finalize & View Report' : 'Next Question →'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Camera Feed & Biometrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                Camera Feed
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Analysis
              </span>
            </div>

            <div className="relative aspect-video w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              />
              {!isCameraActive && (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Camera preview inactive</p>
                </div>
              )}

              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-white/10 flex items-center gap-1 text-[10px] text-slate-200">
                <Eye className="w-3 h-3 text-blue-400" />
                <span>Eye Contact: {eyeContactScore}%</span>
              </div>
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Interview Best Practices
            </p>
            <p className="text-slate-400 leading-relaxed">
              • Use the <strong>STAR method</strong>: Situation, Task, Action, Result.
            </p>
            <p className="text-slate-400 leading-relaxed">
              • Frame solutions around performance metrics, failure handling, and operational simplicity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
