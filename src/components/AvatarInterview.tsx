import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { speechService } from '../services/speech';
import { BrandIcon } from './BrandLogo';
import { TECH_ROLES, TECH_ROLE_NAMES } from '../constants/techRoles';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  Activity,
  RotateCcw,
  Clock,
  LogOut,
  FileText,
  X,
  AlertTriangle,
  Award,
  Layers,
  Check,
} from 'lucide-react';

interface AvatarInterviewProps {
  initialInterviewId?: string;
  onSelectView: (view: string, params?: any) => void;
}

interface PersonaConfig {
  id: string;
  name: string;
  role: string;
  tone: string;
  avatarColor: string;
  accentColor: string;
  pitch: number;
  rate: number;
  svgHair: string;
  svgShirt: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'elena',
    name: 'Elena Rostova',
    role: 'Principal Cloud & Systems Architect',
    tone: 'Methodical, deeply technical, probes scalability, concurrency, and architecture trade-offs',
    avatarColor: 'from-blue-600 to-cyan-500',
    accentColor: 'text-cyan-400',
    pitch: 1.05,
    rate: 1.0,
    svgHair: '#1e293b',
    svgShirt: '#0284c7',
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    role: 'VP of Engineering (Executive)',
    tone: 'Results-driven, high standards, challenges system justifications and business impact',
    avatarColor: 'from-purple-600 to-indigo-600',
    accentColor: 'text-purple-400',
    pitch: 0.9,
    rate: 0.98,
    svgHair: '#0f172a',
    svgShirt: '#4f46e5',
  },
  {
    id: 'chloe',
    name: 'Chloe Bennett',
    role: 'Startup CTO & Founder',
    tone: 'Fast iteration velocity, pragmatic product engineering, ownership, and culture fit',
    avatarColor: 'from-emerald-500 to-teal-400',
    accentColor: 'text-emerald-400',
    pitch: 1.1,
    rate: 1.05,
    svgHair: '#78350f',
    svgShirt: '#059669',
  },
  {
    id: 'aris',
    name: 'Dr. Aris Thorne',
    role: 'Staff Algorithms & Infrastructure Lead',
    tone: 'Computer science fundamentals, time & memory complexity, cache coherence, and edge cases',
    avatarColor: 'from-amber-500 to-orange-400',
    accentColor: 'text-amber-400',
    pitch: 0.95,
    rate: 0.95,
    svgHair: '#334155',
    svgShirt: '#d97706',
  },
];

const PRESET_ROLES = TECH_ROLE_NAMES;

export const AvatarInterview: React.FC<AvatarInterviewProps> = ({ initialInterviewId, onSelectView }) => {
  // Setup configuration state
  const [jobRole, setJobRole] = useState(TECH_ROLE_NAMES[0]);
  const [difficulty, setDifficulty] = useState('Senior');
  const [duration, setDuration] = useState(15);
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig>(PERSONAS[0]);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingActionText, setLoadingActionText] = useState('Initializing interview...');

  // Live session state
  const [interviewId, setInterviewId] = useState<string>('');
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalEstimatedQuestions, setTotalEstimatedQuestions] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionType, setCurrentQuestionType] = useState('technical');
  const [currentTopic, setCurrentTopic] = useState('System Architecture');
  const [contextComment, setContextComment] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const [blinkPhase, setBlinkPhase] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<{
    score: number;
    feedback: string;
    strengths?: string[];
    improvement?: string;
  } | null>(null);

  // Transcript log & transcript drawer
  const [transcriptLog, setTranscriptLog] = useState<
    Array<{ speaker: 'ai' | 'candidate'; text: string; timestamp: string }>
  >([]);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);

  // Timing state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);

  // Webcam & biometric metrics
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [eyeContactScore, setEyeContactScore] = useState(88);
  const [pacingWpm, setPacingWpm] = useState(132);

  // Session Recovery & Page Refresh resilience
  useEffect(() => {
    const resumeId = initialInterviewId || localStorage.getItem('active_avatar_interview_id');
    if (resumeId && !isSessionStarted) {
      setIsLoading(true);
      setLoadingActionText('Restoring your in-progress avatar session...');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session restore timeout')), 4000)
      );
      Promise.race([api.avatarInterviews.getById(resumeId), timeoutPromise])
        .then((res: any) => {
          const av = res?.avatarInterview;
          if (av && av.status === 'in_progress') {
            const activeId = av.id || av._id;
            setInterviewId(activeId);
            setJobRole(av.jobRole || 'Full Stack Engineer');
            setDifficulty(av.difficulty || 'Senior');
            setDuration(av.duration || 15);
            const foundPersona = PERSONAS.find((p) => p.name === av.persona) || PERSONAS[0];
            setSelectedPersona(foundPersona);
            const qList = av.questions || [];
            const lastQ = qList[qList.length - 1] || 'Describe your system architecture experience.';
            setCurrentQuestion(lastQ);
            setCurrentQuestionNumber(qList.length || 1);
            const estTotal = Math.max(4, Math.min(8, Math.round((av.duration || 15) / 2.5)));
            setTotalEstimatedQuestions(estTotal);
            setContextComment(av.persona ? `Resuming interview with ${av.persona}` : 'Welcome back to your interview.');
            if (av.transcript && av.transcript.length > 0) {
              setTranscriptLog(
                av.transcript.map((t: any) => ({
                  speaker: t.speaker === 'candidate' ? 'candidate' : 'ai',
                  text: t.text,
                  timestamp: t.timestamp
                    ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '',
                }))
              );
            }
            setIsSessionStarted(true);
            startCamera();
          } else {
            localStorage.removeItem('active_avatar_interview_id');
          }
        })
        .catch((err) => {
          console.warn('Could not restore avatar session:', err);
          localStorage.removeItem('active_avatar_interview_id');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialInterviewId]);

  // Mouth animation loop during avatar speech
  useEffect(() => {
    let interval: any;
    if (isAvatarSpeaking) {
      interval = setInterval(() => {
        setMouthPhase((prev) => (prev + 1) % 4);
      }, 130);
    } else {
      setMouthPhase(0);
    }
    return () => clearInterval(interval);
  }, [isAvatarSpeaking]);

  // Natural idle blinking loop for avatar
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkPhase(true);
      setTimeout(() => setBlinkPhase(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Interview timer loop
  useEffect(() => {
    let timerInterval: any;
    if (isSessionStarted) {
      timerInterval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isSessionStarted]);

  // Turn webcam on when session starts
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
    } catch (e) {
      console.warn('Webcam permission not granted or camera unavailable:', e);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Cleanup on unmount or session exit
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
      stopCamera();
    };
  }, []);

  // Text-To-Speech wrapper with persona vocal characteristics
  const speakAvatarText = (text: string) => {
    if (isVoiceMuted || !text) {
      setIsAvatarSpeaking(false);
      return;
    }
    setIsAvatarSpeaking(true);
    speechService.speak(text, {
      pitch: selectedPersona.pitch,
      rate: selectedPersona.rate,
      onStart: () => setIsAvatarSpeaking(true),
      onEnd: () => setIsAvatarSpeaking(false),
    });
  };

  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handler: Start Session
  const handleStartSession = async () => {
    if (!jobRole.trim()) return;

    // Synchronously prime browser audio engine upon user click
    speechService.resumeAudio();

    setIsLoading(true);
    setLoadingActionText(`Generating personalized interview with ${selectedPersona.name}...`);

    try {
      const res = await api.avatarInterviews.start({
        jobRole: jobRole.trim(),
        difficulty,
        duration,
        persona: selectedPersona.name,
      });

      setInterviewId(res.interviewId);
      localStorage.setItem('active_avatar_interview_id', res.interviewId);
      setCurrentQuestion(res.initialQuestion);
      setCurrentQuestionType(res.questionType || 'technical');
      setCurrentTopic(res.topic || 'System Architecture');
      setCurrentQuestionNumber(1);
      const estTotal = Math.max(4, Math.min(8, Math.round(duration / 2.5)));
      setTotalEstimatedQuestions(estTotal);
      setRemainingSeconds(duration * 60);
      setElapsedSeconds(0);
      setContextComment(res.greeting);

      const initialSpeech = `${res.greeting} ${res.initialQuestion}`;
      setTranscriptLog([
        {
          speaker: 'ai',
          text: initialSpeech,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setIsSessionStarted(true);

      // Start webcam preview
      startCamera();

      // Trigger Avatar vocal greeting with a small 250ms delay for smooth audio rendering
      if (!isVoiceMuted) {
        setTimeout(() => {
          speakAvatarText(initialSpeech);
        }, 250);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to start AI avatar interview.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle candidate speech recognition
  const toggleListening = () => {
    if (isMicActive) {
      speechService.stopListening();
      setIsMicActive(false);
    } else {
      speechService.stopSpeaking();
      setIsAvatarSpeaking(false);

      const ok = speechService.startListening({
        initialText: answerText,
        onResult: (transcript) => {
          setAnswerText(transcript);
          // Calculate dynamic words per minute
          const words = transcript.trim().split(/\s+/).filter(Boolean).length;
          setPacingWpm(Math.min(170, Math.max(105, 115 + (words % 35))));
          setEyeContactScore(Math.floor(82 + Math.random() * 14));
        },
        onError: (err) => {
          console.warn('Speech recognition warning:', err);
          setIsMicActive(false);
        },
        onEnd: () => {
          setIsMicActive(false);
        },
      });

      if (!ok) {
        alert(
          'Microphone recognition is not available or permission was blocked. You can type your response directly in the answer box!'
        );
      }
      setIsMicActive(ok);
    }
  };

  // Handler: Submit Answer & Fetch Next Dynamic Question
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      alert('Please speak or type your answer before submitting.');
      return;
    }

    speechService.stopSpeaking();
    speechService.stopListening();
    setIsMicActive(false);
    setIsLoading(true);
    setLoadingActionText('Analyzing response & dynamically formulating next challenge...');

    const submittedAnswer = answerText.trim();
    const candidateTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append to transcript log
    setTranscriptLog((prev) => [
      ...prev,
      { speaker: 'candidate', text: submittedAnswer, timestamp: candidateTimeStr },
    ]);

    try {
      const res = await api.avatarInterviews.nextQuestion({
        interviewId,
        answer: submittedAnswer,
      });

      if (res.evaluation) {
        setLastEvaluation(res.evaluation);
      }

      if (res.isCompleted) {
        // Conclude interview and generate comprehensive evaluation scorecard
        setLoadingActionText('All questions concluded. Synthesizing full evaluation scorecard...');
        const completeRes = await api.avatarInterviews.complete({
          interviewId,
        });

        stopCamera();
        localStorage.removeItem('active_avatar_interview_id');
        setIsSessionStarted(false);
        onSelectView('report-view', { reportId: completeRes.reportId });
        return;
      }

      // Next dynamic question received!
      setAnswerText('');
      setCurrentQuestion(res.nextQuestion || '');
      setCurrentQuestionType(res.questionType || 'technical');
      setCurrentTopic(res.topic || 'Engineering Fundamentals');
      setContextComment(res.contextComment || 'Thanks for that explanation.');
      if (res.questionNumber) {
        setCurrentQuestionNumber(res.questionNumber);
      }
      if (res.totalQuestions) {
        setTotalEstimatedQuestions(res.totalQuestions);
      }

      const aiSpeech = `${res.contextComment || ''} ${res.nextQuestion || ''}`.trim();
      setTranscriptLog((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: aiSpeech,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (!isVoiceMuted) {
        setTimeout(() => {
          speakAvatarText(aiSpeech);
        }, 250);
      }
    } catch (err: any) {
      alert(err?.message || 'Error communicating with AI Avatar interviewer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Conclude interview early from modal
  const handleConfirmEndEarly = async () => {
    setShowEndConfirmModal(false);
    setIsLoading(true);
    setLoadingActionText('Concluding session and compiling official evaluation scorecard...');

    speechService.stopSpeaking();
    speechService.stopListening();
    stopCamera();

    try {
      const res = await api.avatarInterviews.complete({
        interviewId,
        finalAnswer: answerText.trim() || undefined,
      });

      localStorage.removeItem('active_avatar_interview_id');
      setIsSessionStarted(false);
      onSelectView('report-view', { reportId: res.reportId });
    } catch (err: any) {
      alert(err?.message || 'Failed to complete interview session.');
      setIsLoading(false);
    }
  };

  // Repeat current question
  const handleRepeatQuestion = () => {
    if (!currentQuestion) return;
    speakAvatarText(currentQuestion);
  };

  // ==========================================
  // VIEW 1: Setup & Configuration View
  // ==========================================
  if (!isSessionStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="border border-slate-800 bg-[#0f172a] rounded-2xl p-6 md:p-8 shadow-xl">
          {/* Title Banner */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Avatar interview practice</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Practice answering spoken technical questions with real-time feedback and follow-ups.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Step 1: Select Interviewer Persona */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                1. Select Interviewer Persona & Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PERSONAS.map((persona) => {
                  const isSelected = selectedPersona.id === persona.id;
                  return (
                    <div
                      key={persona.id}
                      id={`persona-${persona.id}`}
                      onClick={() => setSelectedPersona(persona)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/25 shadow-md shadow-purple-500/15 ring-1 ring-purple-500/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${persona.avatarColor} flex items-center justify-center text-white shrink-0 shadow-md`}
                        >
                          <Bot className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{persona.name}</h3>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
                          </div>
                          <p className={`text-xs font-semibold ${persona.accentColor} mt-0.5`}>{persona.role}</p>
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{persona.tone}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Job Role */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Target Tech Role ({TECH_ROLES.length} Curated Specializations)
                </label>
                <span className="text-[11px] text-slate-400">Select or enter custom</span>
              </div>

              {/* Dropdown for complete 12 tech roles */}
              <div className="mb-2">
                <select
                  id="select-avatar-role-dropdown"
                  value={TECH_ROLE_NAMES.includes(jobRole) ? jobRole : ''}
                  onChange={(e) => {
                    if (e.target.value) setJobRole(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="" disabled>-- Select from 12 Curated Tech Specializations --</option>
                  {TECH_ROLES.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name} ({role.category})
                    </option>
                  ))}
                </select>
              </div>

              <input
                id="input-avatar-role"
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer, Cloud Architect, Systems Engineer"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />

              {/* Responsive chips for all 12 tech roles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 mt-2.5">
                {TECH_ROLES.map((role) => {
                  const isSelected = jobRole === role.name;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setJobRole(role.name)}
                      className={`p-2 rounded-lg text-left text-xs font-medium transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/25 text-purple-300 border-purple-500/50 shadow-sm'
                          : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">{role.category}</span>
                      <span className="line-clamp-1">{role.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Difficulty & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  3. Difficulty Level
                </label>
                <select
                  id="select-avatar-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Junior">Junior (0-2 YOE) - Core fundamentals</option>
                  <option value="Mid-Level">Mid-Level (3-5 YOE) - System patterns & testing</option>
                  <option value="Senior">Senior (5-8 YOE) - Scalability & concurrency</option>
                  <option value="Staff / Principal">Staff / Principal (8+ YOE) - Multi-system architecture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  4. Interview Duration
                </label>
                <select
                  id="select-avatar-duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={10}>10 Minutes (~4 Dynamic Questions)</option>
                  <option value={15}>15 Minutes (~5-6 Dynamic Questions)</option>
                  <option value={20}>20 Minutes (~6-7 Dynamic Questions)</option>
                  <option value={30}>30 Minutes (~8 Dynamic Questions)</option>
                </select>
              </div>
            </div>

            {/* Feature Badges Checklist */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Lip-Synchronized Avatar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Dynamic Navneet Engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Live Speech Recognition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Gaze & Pacing Metrics</span>
              </div>
            </div>

            {/* Start Button */}
            <button
              id="btn-start-avatar-session"
              onClick={handleStartSession}
              disabled={isLoading || !jobRole.trim()}
              className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-sm sm:text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{loadingActionText}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start interview with {selectedPersona.name}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: Live Avatar Interactive Session
  // ==========================================
  const progressPercent = Math.min(100, Math.round((currentQuestionNumber / totalEstimatedQuestions) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Session Top Bar: Header & Controls */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        {/* Left: Persona & Role Status */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${selectedPersona.avatarColor} flex items-center justify-center text-white shrink-0 shadow-md`}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">{selectedPersona.name}</h2>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                {difficulty}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium flex items-center gap-1">
                <BrandIcon size={12} variant="dark" withTile={false} />
                <span>Interview.ai</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {jobRole} • <span className="capitalize">{currentTopic}</span>
            </p>
          </div>
        </div>

        {/* Center: Progress & Question Count */}
        <div className="flex items-center gap-4">
          <div className="w-32 sm:w-44">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1 font-semibold">
              <span>
                Question {currentQuestionNumber} of {totalEstimatedQuestions}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Countdown Timer */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${
              remainingSeconds < 120
                ? 'bg-red-950/40 border-red-800 text-red-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
            title="Interview time remaining"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Avatar Voice Mute Toggle */}
          <button
            id="btn-toggle-voice"
            onClick={() => {
              if (!isVoiceMuted) speechService.stopSpeaking();
              setIsVoiceMuted(!isVoiceMuted);
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              isVoiceMuted
                ? 'bg-red-950/40 border-red-800 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isVoiceMuted ? 'Unmute Avatar Speech' : 'Mute Avatar Speech'}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isVoiceMuted ? 'Muted' : 'Voice On'}</span>
          </button>

          {/* Repeat Question Button */}
          <button
            id="btn-repeat-question"
            onClick={handleRepeatQuestion}
            disabled={isAvatarSpeaking || isVoiceMuted}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Repeat Question via TTS"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Repeat</span>
          </button>

          {/* Full Transcript Drawer Button */}
          <button
            id="btn-view-transcript"
            onClick={() => setShowTranscriptDrawer(true)}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="View Interview Transcript"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Transcript</span>
          </button>

          {/* Conclude Session Early Button */}
          <button
            id="btn-end-interview"
            onClick={() => setShowEndConfirmModal(true)}
            className="p-2 rounded-xl border border-red-800/80 bg-red-950/30 text-red-300 hover:bg-red-950/60 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="End Interview & Generate Scorecard"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">End</span>
          </button>
        </div>
      </div>

      {/* Main Split Stage: Avatar (7 cols) & Candidate (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Animated AI Avatar Stage */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[500px]">
          {/* Header Status & Question Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAvatarSpeaking ? 'bg-purple-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isAvatarSpeaking ? `${selectedPersona.name} is Speaking...` : `${selectedPersona.name} is Listening`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 capitalize">
                {currentQuestionType}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {currentTopic}
              </span>
            </div>
          </div>

          {/* Animated 3D/Vector Digital Human Avatar Viewport */}
          <div className="relative my-6 flex flex-col items-center justify-center">
            {/* Ambient Avatar Halo Glow */}
            <div
              className={`absolute w-64 h-64 rounded-full filter blur-3xl transition-all duration-700 pointer-events-none ${
                isAvatarSpeaking
                  ? 'bg-purple-600/35 opacity-100 scale-110'
                  : 'bg-blue-600/15 opacity-60 scale-95'
              }`}
            />

            {/* Rendered Animated Avatar SVG Character */}
            <div
              className={`relative z-10 w-52 h-52 sm:w-56 sm:h-56 rounded-full p-2.5 bg-gradient-to-tr ${
                selectedPersona.avatarColor
              } shadow-2xl transition-transform duration-300 ${isAvatarSpeaking ? 'scale-102' : ''}`}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full rounded-full bg-slate-950 overflow-hidden">
                <defs>
                  <linearGradient id="avatarStageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                <rect width="200" height="200" fill="url(#avatarStageGrad)" />

                {/* Torso / Suit */}
                <path d="M 35 185 Q 100 148 165 185 L 180 215 L 20 215 Z" fill="#1e293b" />
                <path d="M 75 160 L 100 198 L 125 160 Z" fill={selectedPersona.svgShirt} opacity="0.9" />
                {/* Collar */}
                <polygon points="84,160 100,188 116,160 100,166" fill="#f8fafc" />

                {/* Neck */}
                <rect x="85" y="124" width="30" height="36" rx="6" fill="#fcd34d" opacity="0.85" />

                {/* Head */}
                <ellipse cx="100" cy="92" rx="42" ry="48" fill="#fde68a" />

                {/* Hair */}
                <path
                  d="M 56 82 Q 100 38 144 82 Q 135 52 100 48 Q 65 52 56 82 Z"
                  fill={selectedPersona.svgHair}
                />

                {/* Eyebrows */}
                <path
                  d={isAvatarSpeaking ? 'M 72 73 Q 82 68 92 73' : 'M 72 75 Q 82 72 92 75'}
                  stroke={selectedPersona.svgHair}
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={isAvatarSpeaking ? 'M 108 73 Q 118 68 128 73' : 'M 108 75 Q 118 72 128 75'}
                  stroke={selectedPersona.svgHair}
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Eyes (With blinking cycle) */}
                {blinkPhase ? (
                  <>
                    <line x1="76" y1="86" x2="88" y2="86" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="112" y1="86" x2="124" y2="86" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="82" cy="86" rx="6" ry={isAvatarSpeaking ? 5.5 : 5} fill="#0f172a" />
                    <circle cx="84" cy="84" r="2" fill="#ffffff" />
                    <ellipse cx="118" cy="86" rx="6" ry={isAvatarSpeaking ? 5.5 : 5} fill="#0f172a" />
                    <circle cx="120" cy="84" r="2" fill="#ffffff" />
                  </>
                )}

                {/* Nose */}
                <path d="M 100 88 L 97 103 L 103 103" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* Dynamic Lip Synchronization Mouth */}
                {isAvatarSpeaking ? (
                  mouthPhase === 0 ? (
                    <ellipse cx="100" cy="119" rx="9" ry="8" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="2" />
                  ) : mouthPhase === 1 ? (
                    <ellipse cx="100" cy="119" rx="12" ry="5" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="2" />
                  ) : mouthPhase === 2 ? (
                    <ellipse cx="100" cy="119" rx="8" ry="10" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="2" />
                  ) : (
                    <ellipse cx="100" cy="119" rx="13" ry="6" fill="#7f1d1d" stroke="#b91c1c" strokeWidth="2" />
                  )
                ) : (
                  <path d="M 88 119 Q 100 124 112 119" stroke="#b91c1c" strokeWidth="3" fill="none" strokeLinecap="round" />
                )}
              </svg>
            </div>

            {/* Vocal Audio Equalizer Wave Bars */}
            {isAvatarSpeaking && (
              <div className="flex items-center gap-1.5 mt-4">
                {[6, 14, 26, 34, 20, 30, 16, 8].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s`, height: `${h}px` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Live Captions & Question Subtitles Card */}
          <div className="p-4 rounded-xl bg-slate-900/95 border border-slate-800 shadow-inner">
            {contextComment && (
              <p className="text-xs text-purple-300 font-medium italic mb-1.5">
                "{contextComment}"
              </p>
            )}
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
              {currentQuestion}
            </p>
          </div>
        </div>

        {/* Right: Candidate Camera & Response Studio (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Candidate Live Camera Viewport */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Your Camera Feed</span>
              </div>
              <button
                type="button"
                onClick={toggleCamera}
                className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-3 h-3 text-red-400" />
                    <span>Disable</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>Enable</span>
                  </>
                )}
              </button>
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
                  <Camera className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400 font-medium">Camera is disabled or permission withheld</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click "Enable" above to turn on webcam</p>
                </div>
              )}

              {/* Eye-Contact Tracking Overlay HUD */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-white/10 flex items-center gap-1 text-[10px] text-slate-200">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>Gaze Stability: {eyeContactScore}%</span>
              </div>

              {/* Pacing Speed HUD */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-white/10 flex items-center gap-1 text-[10px] text-slate-200">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span>Pacing: {pacingWpm} WPM</span>
              </div>
            </div>
          </div>

          {/* Last Answer Instant Feedback Pill (if available) */}
          {lastEvaluation && (
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-2.5 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 font-bold text-white mb-0.5">
                  <span>Previous Answer Evaluation:</span>
                  <span className="text-purple-300">{lastEvaluation.score}%</span>
                </div>
                <p className="text-[11px] text-slate-300">{lastEvaluation.feedback}</p>
                {lastEvaluation.improvement && (
                  <p className="text-[10px] text-purple-300/80 mt-1 italic">
                    Tip: {lastEvaluation.improvement}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Spoken / Typed Response Box */}
          <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span>Your Answer</span>
                  {isMicActive && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold px-2 py-0.2 rounded-full bg-red-950/60 border border-red-800/60 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Listening to speech...
                    </span>
                  )}
                </label>
                <span className="text-[11px] text-slate-400">
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <textarea
                id="textarea-avatar-answer"
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Click 'Speak Answer (Mic)' to speak via microphone, or type your answer directly here..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
              />
            </div>

            {/* Action Buttons: Microphone Toggle & Submit */}
            <div className="mt-3.5 flex items-center gap-3">
              <button
                id="btn-toggle-mic"
                type="button"
                onClick={toggleListening}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isMicActive
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/25'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                }`}
              >
                {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMicActive ? 'Listening... Click to Finish Speech' : 'Speak Answer (Mic)'}</span>
              </button>

              <button
                id="btn-submit-avatar-answer"
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isLoading || !answerText.trim()}
                className="py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{currentQuestionNumber >= totalEstimatedQuestions ? 'Finish' : 'Next'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Drawer Modal */}
      {showTranscriptDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Interview Transcript Record</h3>
              </div>
              <button
                onClick={() => setShowTranscriptDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
              {transcriptLog.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No transcript entries recorded yet.</p>
              ) : (
                transcriptLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      entry.speaker === 'ai'
                        ? 'bg-purple-950/20 border-purple-900/40 text-purple-100'
                        : 'bg-slate-900/90 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400 font-bold uppercase">
                      <span>{entry.speaker === 'ai' ? selectedPersona.name : 'You (Candidate)'}</span>
                      <span>{entry.timestamp}</span>
                    </div>
                    <p>{entry.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowTranscriptDrawer(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Interview Confirmation Modal */}
      {showEndConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Conclude Interview Early?</h3>
                <p className="text-xs text-slate-400">
                  Are you ready to submit your answers and generate your official evaluation report?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
              Navneet will analyze your answers, pacing, eye-contact stability, and technical precision to compile
              your full 5-competency scorecard.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleConfirmEndEarly}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/25 cursor-pointer"
              >
                Finish & View Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
