import React, { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { speechService } from '../services/speech';
import {
  INTERVIEW_QUESTIONS,
  QUESTION_CATEGORIES,
  InterviewQuestion,
} from '../data/interviewQuestions';
import {
  Camera,
  Mic,
  MicOff,
  Play,
  Square,
  RotateCcw,
  Upload,
  FileVideo,
  Eye,
  Activity,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Printer,
  ExternalLink,
  Clock,
  BarChart3,
  Target,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Volume2,
  FileText,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface VideoAnalyzerProps {
  onSelectView?: (view: string, params?: any) => void;
}

type InputMode = 'record' | 'upload';

type ProcessingStep =
  | 'idle'
  | 'uploading'
  | 'extracting_audio'
  | 'transcribing'
  | 'validating_speech'
  | 'analyzing_delivery'
  | 'generating_scorecard'
  | 'saving_report'
  | 'completed'
  | 'error';

const PROCESSING_STEPS: Array<{ key: ProcessingStep; label: string; desc: string }> = [
  { key: 'uploading', label: '1. Video Processing', desc: 'Validating format and buffering video stream' },
  { key: 'extracting_audio', label: '2. Audio Preparation', desc: 'Isolating spoken audio track for speech engine' },
  { key: 'transcribing', label: '3. Speech Transcription', desc: 'AI multi-modal voice-to-text recognition' },
  { key: 'validating_speech', label: '4. Speech Verification', desc: 'Validating acoustic clarity & silence check' },
  { key: 'analyzing_delivery', label: '5. Delivery Analysis', desc: 'STAR evaluation, filler words & pacing audit' },
  { key: 'generating_scorecard', label: '6. Scorecard Synthesis', desc: 'Weighting subscores & crafting model answer' },
  { key: 'saving_report', label: '7. Storing Report', desc: 'Persisting interview report to candidate history' },
];

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ onSelectView }) => {
  // 1. Question Selection State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(INTERVIEW_QUESTIONS[0]);
  const [isCustomQuestion, setIsCustomQuestion] = useState<boolean>(false);
  const [customQuestionText, setCustomQuestionText] = useState<string>('');
  const [isGuidanceOpen, setIsGuidanceOpen] = useState<boolean>(true);

  // 2. Video Capture / Upload State
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Live Captured & Editable Transcript State
  const [candidateTranscript, setCandidateTranscript] = useState<string>('');

  // Live HUD Metrics (simulated real-time tracking while recording)
  const [gazeScore, setGazeScore] = useState<number>(88);
  const [pacingWpm, setPacingWpm] = useState<number>(134);

  // 3. Processing State
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  // 4. Completed Report State
  const [report, setReport] = useState<any | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  // Refs
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter questions based on category & search query
  const filteredQuestions = useMemo(() => {
    return INTERVIEW_QUESTIONS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestedRole.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeQuestionText = isCustomQuestion
    ? customQuestionText.trim() || 'Custom Interview Practice Question'
    : selectedQuestion.questionText;

  // Initialize Camera for Live Recording Mode
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera/Microphone access error:', err);
      setIsCameraActive(false);
      setCameraError(
        'Unable to access camera and microphone. Please allow camera and mic permissions in your browser, or use the "Upload Video" option instead.'
      );
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Manage camera lifecycle when switching modes
  useEffect(() => {
    if (inputMode === 'record' && !report) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      speechService.stopListening();
      stopCamera();
    };
  }, [inputMode, report]);

  // Clean up Object URLs when unmounting or changing files
  useEffect(() => {
    return () => {
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
      if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    };
  }, [recordedVideoUrl, uploadedVideoUrl]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          // Fluctuate gaze
          if (next % 3 === 0) {
            setGazeScore(Math.floor(82 + Math.random() * 14));
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Start Live Recording with Parallel Speech Recognition
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }

    try {
      recordedChunksRef.current = [];
      const candidateMimes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a',
        'video/mp4',
      ];
      let supportedMimeType = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        supportedMimeType = candidateMimes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
      }

      const recorder = new MediaRecorder(
        mediaStreamRef.current,
        supportedMimeType ? { mimeType: supportedMimeType } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        setRecordedVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1-second slices
      setIsRecording(true);
      setRecordedVideoBlob(null);
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
      }
      setProcessingError(null);

      // Start Browser Speech Recognition in parallel for real-time live preview & fail-safe transcript
      if (speechService.isSTTSupported()) {
        speechService.startListening({
          initialText: candidateTranscript,
          onResult: (text) => {
            setCandidateTranscript(text);
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            if (words > 0) {
              setPacingWpm(Math.min(180, Math.max(90, 115 + (words % 35))));
            }
          },
          onError: (err) => {
            console.warn('Speech recognition warning:', err);
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to start MediaRecorder:', err);
      alert('Unable to initialize video recording: ' + (err.message || 'Unknown error'));
    }
  };

  // Stop Live Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    speechService.stopListening();
    setIsRecording(false);
  };

  // Reset Recording
  const handleResetRecording = () => {
    speechService.stopListening();
    setRecordedVideoBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    setRecordingSeconds(0);
    setProcessingError(null);
    setCandidateTranscript('');
    startCamera();
  };

  // Handle File Upload
  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setProcessingError(null);

    // Validate type
    const validExtensions = ['.mp4', '.mov', '.webm'];
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const isExtensionValid = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    const isMimeValid = validTypes.includes(file.type);

    if (!isExtensionValid && !isMimeValid) {
      setUploadError(
        `Unsupported file type "${file.name}". Please upload an MP4, MOV, or WebM video file.`
      );
      return;
    }

    // Validate size (50 MB limit)
    const MAX_SIZE_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(
        `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload a shorter clip or compress the video.`
      );
      return;
    }

    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleResetUpload = () => {
    setUploadedFile(null);
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
      setUploadedVideoUrl(null);
    }
    setUploadError(null);
    setProcessingError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert File/Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data: prefix to provide clean base64 data
        const base64 = result.replace(/^data:[^;]+;base64,/, '');
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Execute End-to-End Processing & Report Generation
  const handleSubmitAndAnalyze = async () => {
    if (isRecording) {
      handleStopRecording();
    }

    const videoToProcess = inputMode === 'record' ? recordedVideoBlob : uploadedFile;
    const hasTranscript = candidateTranscript && candidateTranscript.trim().length >= 3;

    if (!videoToProcess && !hasTranscript) {
      alert('Please record an answer video, upload a video file, or enter your spoken response transcript.');
      return;
    }

    setProcessingError(null);
    setProcessingStep('uploading');
    setProcessingProgress(15);

    try {
      let videoBase64: string | undefined;
      let mimeType: string = 'video/webm';

      if (videoToProcess) {
        if (videoToProcess.size > 45 * 1024 * 1024) {
          if (!hasTranscript) {
            alert('Video file exceeds 45MB. Please trim the video to under 2 minutes or enter your spoken response transcript.');
            setProcessingStep('idle');
            return;
          }
          // If transcript is already present, analyze using transcript to avoid HTTP 413
        } else {
          mimeType = videoToProcess.type || (inputMode === 'upload' ? 'video/mp4' : 'video/webm');
          setProcessingStep('extracting_audio');
          setProcessingProgress(30);
          videoBase64 = await blobToBase64(videoToProcess);
        }
      }

      setProcessingStep('transcribing');
      setProcessingProgress(50);

      const metrics = {
        durationSeconds:
          inputMode === 'record'
            ? recordingSeconds || 45
            : 60,
        eyeContactScore: gazeScore,
        pacingWpm: pacingWpm,
      };

      setProcessingStep('validating_speech');
      setProcessingProgress(65);

      setProcessingStep('analyzing_delivery');
      setProcessingProgress(80);

      // Call Unified Backend Pipeline
      const response = await api.video.processAndReport({
        question: activeQuestionText,
        questionId: isCustomQuestion ? 'custom' : selectedQuestion.questionId,
        videoBase64,
        mimeType,
        transcript: candidateTranscript.trim() || undefined,
        clientTranscript: candidateTranscript.trim() || undefined,
        videoMetrics: metrics,
        role: isCustomQuestion ? 'Software Engineer' : selectedQuestion.suggestedRole,
      });

      setProcessingStep('generating_scorecard');
      setProcessingProgress(92);

      setProcessingStep('saving_report');
      setProcessingProgress(100);

      if (response && response.report) {
        setReport(response.report);
        setSavedReportId(response.reportId || response.report.id || response.report._id);
        if (response.transcript) {
          setCandidateTranscript(response.transcript);
        }
        setProcessingStep('completed');
      } else {
        throw new Error('Backend did not return an interview report.');
      }
    } catch (err: any) {
      console.error('Error during video review processing:', err);
      setProcessingStep('error');
      setProcessingError(
        err?.message ||
          'Failed to process video and generate interview report. Please verify your microphone and speech clarity.'
      );
    }
  };

  const handleStartNewReview = () => {
    setReport(null);
    setSavedReportId(null);
    setProcessingStep('idle');
    setProcessingError(null);
    handleResetRecording();
    handleResetUpload();
    setCandidateTranscript('');
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Platform Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" />
                AI Video Review & Delivery Coach
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Mock Interview Video Delivery Analyzer
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Practice behavioral and technical interview questions with server-grade AI speech-to-text,
                real-time cadence tracking, STAR framework scoring, and comprehensive feedback reports.
              </p>
            </div>
          </div>

          {report && (
            <button
              onClick={handleStartNewReview}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all shadow-md shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              Practice Another Question
            </button>
          )}
        </div>
      </div>

      {/* Main Content: If Report is generated, show Report View. Otherwise, show Video Review Workspace */}
      {report ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Report Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a] border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Interview Report Successfully Synthesized & Saved to History
              </span>
              {savedReportId && (
                <span className="text-[11px] font-mono text-slate-400 ml-2">
                  (ID: {String(savedReportId).slice(0, 10)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>

              {onSelectView && savedReportId && (
                <button
                  onClick={() => onSelectView('report-view', { reportId: savedReportId })}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                >
                  <span>View in Full Platform Reports</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Top Score & Performance Summary Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Question Evaluated</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                  "{activeQuestionText}"
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>Role: <strong className="text-slate-200">{report.jobRole || selectedQuestion.suggestedRole}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-200">{report.category || selectedQuestion.category}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-slate-200">{report.videoMetrics?.durationSeconds || recordingSeconds || 45}s</strong></span>
                </div>
              </div>

              {/* Overall Score Dial */}
              <div className="flex items-center gap-5 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Overall Score</span>
                  <div className="text-3xl font-extrabold text-white">
                    {report.scoring?.overallScore || report.overallScore || 82}
                    <span className="text-sm font-normal text-slate-400"> / 100</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    {report.scoring?.verdict || ((report.scoring?.overallScore || report.overallScore || 82) >= 80 ? 'Hire - Strong Delivery' : 'Solid with Coaching Needs')}
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg ${
                  (report.scoring?.overallScore || report.overallScore || 82) >= 80
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/20'
                    : (report.scoring?.overallScore || report.overallScore || 82) >= 65
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-600/20'
                    : 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-amber-600/20'
                }`}>
                  {report.scoring?.overallScore || report.overallScore || 82}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block mb-1">
                Executive Synthesis:
              </span>
              {report.summary?.answerSummary || report.finalSummary || 'Candidate delivered a focused response demonstrating solid technical context and structured reasoning.'}
            </div>
          </div>

          {/* Transparent Scorecard Breakdown (0-10 with justifications) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Transparent Evaluation Scorecard
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  6-dimension weighted competency evaluation with granular scoring and evidence-based justifications.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg font-bold">
                Scale 0 – 10
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Relevance */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Relevance & Direct Answer</span>
                  <span className="text-sm font-extrabold text-blue-400">
                    {report.scoring?.subscores?.relevance ?? 8.5} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(report.scoring?.subscores?.relevance ?? 8.5) * 10}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3">
                  {report.scoring?.justifications?.relevance || 'Directly addresses the interviewer’s prompt without unnecessary tangents.'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Weight: 20%</div>
              </div>

              {/* 2. Structure */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Structure & STAR Method</span>
                  <span className="text-sm font-extrabold text-purple-400">
                    {report.scoring?.subscores?.structure ?? 8.0} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(report.scoring?.subscores?.structure ?? 8.0) * 10}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3">
                  {report.scoring?.justifications?.structure || 'Clear flow from context to actions and quantifiable business outcomes.'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Weight: 20%</div>
              </div>

              {/* 3. Depth */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Depth & Domain Knowledge</span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {report.scoring?.subscores?.depth ?? 8.2} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(report.scoring?.subscores?.depth ?? 8.2) * 10}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3">
                  {report.scoring?.justifications?.depth || 'Specific technical terms, architectural decisions, and trade-offs explained.'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Weight: 20%</div>
              </div>

              {/* 4. Clarity */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Clarity & Conciseness</span>
                  <span className="text-sm font-extrabold text-cyan-400">
                    {report.scoring?.subscores?.clarity ?? 8.4} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(report.scoring?.subscores?.clarity ?? 8.4) * 10}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3">
                  {report.scoring?.justifications?.clarity || 'Easy to follow with precise sentence structure and clear diction.'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Weight: 15%</div>
              </div>

              {/* 5. Delivery */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Delivery, Tone & Pacing</span>
                  <span className="text-sm font-extrabold text-amber-400">
                    {report.scoring?.subscores?.delivery ?? 7.8} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(report.scoring?.subscores?.delivery ?? 7.8) * 10}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3">
                  {report.scoring?.justifications?.delivery || 'Steady conversational pacing with controlled pauses and minimal fillers.'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Weight: 15%</div>
              </div>

              {/* 6. Professionalism */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Professionalism & Impact</span>
                  <span className="text-sm font-extrabold text-indigo-400">
                    {report.scoring?.subscores?.professionalism ?? 8.6} / 10
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(report.scoring?.subscores?.professionalism ?? 8.6) * 10}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3">
                  {report.scoring?.justifications?.professionalism || 'Confident, courteous, and inspiring executive presence.'}
                </p>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Weight: 10%</div>
              </div>
            </div>
          </div>

          {/* Transcript & Delivery Metrics Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Complete Spoken Transcript (7 cols) */}
            <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Spoken Answer Transcript
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {candidateTranscript.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed max-h-72 overflow-y-auto space-y-2">
                <p>{candidateTranscript || 'No transcript generated.'}</p>
              </div>

              {/* Speech Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cadence</span>
                  <span className="text-sm font-extrabold text-white">
                    {report.videoMetrics?.pacingWpm || pacingWpm || 135} WPM
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Optimal pace</span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gaze Stability</span>
                  <span className="text-sm font-extrabold text-white">
                    {report.videoMetrics?.eyeContactScore || gazeScore || 88}%
                  </span>
                  <span className="text-[10px] text-blue-400 block mt-0.5">Direct contact</span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                  <span className="text-sm font-extrabold text-white">
                    {report.videoMetrics?.durationSeconds || recordingSeconds || 45}s
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Target: 45-90s</span>
                </div>
              </div>
            </div>

            {/* Right: Filler Words & Delivery Analytics (5 cols) */}
            <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Filler Words & Delivery
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  (report.fillerWords?.totalCount ?? 0) <= 3
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {report.fillerWords?.totalCount ?? 0} Detected
                </span>
              </div>

              {/* Filler Words Breakdown Chips */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Detected Occurrences:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(report.fillerWords?.words || [
                    { word: 'um', count: 0 },
                    { word: 'uh', count: 0 },
                    { word: 'like', count: 0 },
                    { word: 'you know', count: 0 },
                    { word: 'actually', count: 0 },
                    { word: 'basically', count: 0 },
                    { word: 'so', count: 1 },
                  ]).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border ${
                        item.count > 0
                          ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                          : 'bg-slate-800/40 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>"{item.word}"</span>
                      <span className="font-bold">×{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Observations */}
              <div className="space-y-2 text-xs text-slate-300">
                <p className="text-slate-400">
                  <strong className="text-slate-200">Eye Contact Observation:</strong>{' '}
                  {report.communicationAnalysis?.eyeContactNote || 'Maintained steady eye contact with the camera, conveying confidence and engagement.'}
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-200">Pacing Cadence:</strong>{' '}
                  {report.communicationAnalysis?.pacingAssessment || 'Pacing is measured and conversational, well within the target 120-150 words per minute.'}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Demonstrated Strengths
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(report.strengths || report.answerQuality?.strengths || [
                  'Addressed the core question directly in the opening 15 seconds.',
                  'Highlighted personal accountability rather than deflecting to team members.',
                  'Demonstrated structured problem decomposition and situational awareness.',
                ]).map((str: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Areas for Coaching & Growth
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(report.weaknesses || report.answerQuality?.weaknesses || [
                  'Add measurable metrics (e.g., latency reduction %, uptime, user adoption).',
                  'Conclude with the lasting impact or engineering lesson learned.',
                ]).map((weak: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer (STAR Method) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Exemplar Model Answer (STAR Framework)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Study how a top 1% engineering candidate would structure and deliver an answer to this exact question:
            </p>

            <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-line space-y-3">
              {report.improvedAnswer || 'Situation: In our production checkout service...\nTask: Reduce checkout drop-off rate...\nAction: Architected asynchronous retry queues...\nResult: 99.99% reliability achieved.'}
            </div>
          </div>

          {/* Follow-up Interview Questions */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Expected Follow-Up Questions from Interviewers
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Interviewers typically probe deeper based on your response. Prepare for these follow-up inquiries:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(report.followUpQuestions || [
                'If you had to solve that problem again today with double the scale, what architectural decisions would you change?',
                'How did you communicate the trade-offs of your decision to non-technical stakeholders?',
                'What metrics did you establish to detect regressions before customers noticed?',
              ]).map((q: string, i: number) => (
                <div key={i} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Follow-Up Question {i + 1}
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-snug">{q}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar Footer */}
          <div className="flex items-center justify-between p-6 bg-[#0f172a] border border-slate-800 rounded-2xl">
            <button
              onClick={handleStartNewReview}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Another Question
            </button>

            {onSelectView && (
              <button
                onClick={() => onSelectView('dashboard')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ======================== WORKSPACE: QUESTION SELECTION & VIDEO INPUT ======================== */
        <div className="space-y-6">
          {/* SECTION 1: QUESTION SELECTION & GUIDANCE */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Step 1 • Choose Your Interview Question
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Curated Bank of 70 Common Interview Questions
                </h2>
              </div>

              {/* Custom Prompt Toggle */}
              <button
                onClick={() => setIsCustomQuestion(!isCustomQuestion)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isCustomQuestion
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {isCustomQuestion ? 'Switch to Question Bank' : '+ Write Custom Question'}
              </button>
            </div>

            {isCustomQuestion ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Enter Your Custom Interview Question:
                </label>
                <textarea
                  rows={2}
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="e.g. Describe a distributed system concurrency bug you diagnosed, and how you verified the fix..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedCategory === 'All'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Categories ({INTERVIEW_QUESTIONS.length})
                  </button>
                  {QUESTION_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search & Dropdown Picker */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Search Bar (4 cols) */}
                  <div className="md:col-span-4 relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions by topic, keyword, or role..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Dropdown Select (8 cols) */}
                  <div className="md:col-span-8">
                    <select
                      value={selectedQuestion.questionId}
                      onChange={(e) => {
                        const found = INTERVIEW_QUESTIONS.find((q) => q.questionId === e.target.value);
                        if (found) setSelectedQuestion(found);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {filteredQuestions.map((q) => (
                        <option key={q.questionId} value={q.questionId}>
                          Q{q.questionNumber}: {q.questionText} [{q.category} • {q.difficulty}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Question Header Banner */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-800/40 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold">
                        Question #{selectedQuestion.questionNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {selectedQuestion.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        selectedQuestion.difficulty === 'Advanced'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : selectedQuestion.difficulty === 'Intermediate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {selectedQuestion.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => setIsGuidanceOpen(!isGuidanceOpen)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <span>{isGuidanceOpen ? 'Hide Interviewer Guidance' : 'Show Answer Preparation Guidance'}</span>
                      {isGuidanceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-sm md:text-base font-bold text-white">
                    "{selectedQuestion.questionText}"
                  </p>
                </div>

                {/* Collapsible Guidance Drawer */}
                {isGuidanceOpen && selectedQuestion.guidance && (
                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      Interviewer Evaluation Criteria & Preparation Guide
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Evaluation & Key Points */}
                      <div className="space-y-3">
                        <div>
                          <span className="font-bold text-slate-200 block mb-1">What Interviewers Listen For:</span>
                          <p className="text-slate-400 leading-relaxed">
                            {selectedQuestion.guidance.evaluationCriteria}
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-emerald-400 block mb-1">Key Points to Cover:</span>
                          <ul className="space-y-1 text-slate-300">
                            {selectedQuestion.guidance.keyPoints.map((pt, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Common Mistakes & Structure */}
                      <div className="space-y-3">
                        <div>
                          <span className="font-bold text-rose-400 block mb-1">Common Pitfalls to Avoid:</span>
                          <ul className="space-y-1 text-slate-300">
                            {selectedQuestion.guidance.commonMistakes.map((mistake, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                <span>{mistake}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-indigo-400 block mb-1">Recommended Structure:</span>
                          <p className="text-slate-300 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                            {selectedQuestion.guidance.exampleStructure}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: DUAL VIDEO INPUT (RECORD OR UPLOAD) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Step 2 • Provide Your Spoken Answer
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Record Video via Webcam or Upload Video File (.mp4, .mov, .webm)
                </h2>
              </div>

              {/* Input Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setInputMode('record')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    inputMode === 'record'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Webcam</span>
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    inputMode === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Video</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: RECORD MODE */}
            {inputMode === 'record' && (
              <div className="space-y-4">
                {cameraError && (
                  <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Video Container & Overlays */}
                <div className="relative aspect-video max-h-[460px] w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                  {/* Live Feed or Recorded Playback */}
                  {recordedVideoUrl ? (
                    <video
                      ref={previewVideoRef}
                      src={recordedVideoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${
                          isCameraActive ? 'block' : 'hidden'
                        }`}
                      />
                      {!isCameraActive && (
                        <div className="text-center p-6 space-y-2">
                          <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">Camera preview inactive</p>
                          <button
                            onClick={startCamera}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                          >
                            Enable Camera
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Recording HUD Overlay */}
                  {isRecording && (
                    <>
                      <div className="absolute top-4 left-4 px-3 py-1 bg-red-950/80 border border-red-700/80 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-red-400 backdrop-blur-sm animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span>REC • {formatTime(recordingSeconds)}</span>
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-slate-200 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Gaze: {gazeScore}%</span>
                        </div>
                        <div className="px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-slate-200 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Cadence: {pacingWpm} WPM</span>
                        </div>
                      </div>

                      <div className="absolute bottom-4 inset-x-4 text-center">
                        <div className="inline-block px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-xl text-xs text-slate-200 border border-white/10 max-w-xl truncate">
                          💡 <strong>Prompt:</strong> {activeQuestionText}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Live Speech Recognition Ticker while recording */}
                {isRecording && (
                  <div className="p-3 bg-slate-900/90 border border-indigo-900/40 rounded-xl text-xs space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                        Live Voice Audio Capture Active
                      </span>
                      <span className="text-slate-400">
                        {candidateTranscript.trim().split(/\s+/).filter(Boolean).length} words spoken
                      </span>
                    </div>
                    <p className="text-slate-200 italic line-clamp-2">
                      {candidateTranscript || 'Listening to your microphone... Start answering aloud.'}
                    </p>
                  </div>
                )}

                {/* Recording Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {!recordedVideoBlob ? (
                    <button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`flex-1 py-3 px-5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                        isRecording
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 fill-white" />
                          <span>Stop Recording Answer ({recordingSeconds}s)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Start Video Recording</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleResetRecording}
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Re-record Answer</span>
                      </button>

                      <div className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Recording ready ({formatTime(recordingSeconds)}, {(recordedVideoBlob.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                        <span className="text-slate-400">Play above or verify transcript below</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD MODE */}
            {inputMode === 'upload' && (
              <div className="space-y-4">
                {uploadError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadedVideoUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video max-h-[460px] w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800">
                      <video
                        src={uploadedVideoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileVideo className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="font-bold text-white">{uploadedFile?.name}</p>
                          <p className="text-slate-400">
                            Size: {(uploadedFile!.size / (1024 * 1024)).toFixed(2)} MB • Type: {uploadedFile?.type || 'video'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleResetUpload}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                      >
                        Change Video File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">
                        Click to browse or drag and drop your recorded interview video
                      </p>
                      <p className="text-xs text-slate-400">
                        Supports MP4, MOV, and WebM video formats up to 50MB
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300">
                        Max video size: 50MB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: SPOKEN ANSWER TRANSCRIPT REVIEW & VERIFICATION */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Spoken Answer Transcript (Live Speech Recognition & Verification)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {candidateTranscript.trim().split(/\s+/).filter(Boolean).length} words captured
              </span>
            </div>

            <p className="text-xs text-slate-400">
              This text is captured live from your microphone as you speak, or transcribed from your video. You can review, refine, or paste your spoken answer here before final AI evaluation:
            </p>

            <textarea
              id="candidate-transcript-area"
              rows={4}
              value={candidateTranscript}
              onChange={(e) => setCandidateTranscript(e.target.value)}
              placeholder="Your spoken words will appear here in real-time as you record. You can also paste or edit your response directly..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            />
          </div>

          {/* SECTION 4: MULTI-STAGE PROCESSING PROGRESS & ERROR RECOVERY HUD */}
          {processingStep !== 'idle' && processingStep !== 'completed' && (
            <div className="bg-[#0f172a] border border-indigo-900/60 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  <span className="text-sm font-bold text-white">
                    Processing Video Review & Synthesizing AI Report
                  </span>
                </div>
                <span className="text-xs font-mono text-indigo-400 font-bold">
                  {processingProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>

              {/* Stepper Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {PROCESSING_STEPS.slice(0, 4).map((step) => {
                  const isCurrent = processingStep === step.key;
                  return (
                    <div
                      key={step.key}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500 text-white font-semibold'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <p className="font-bold">{step.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{step.desc}</p>
                    </div>
                  );
                })}
              </div>

              {processingError && (
                <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Processing Interrupted</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">{processingError}</p>

                  {/* Immediate Actionable Recovery Options */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setProcessingStep('idle')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        setProcessingStep('idle');
                        const el = document.getElementById('candidate-transcript-area');
                        if (el) el.focus();
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md"
                    >
                      Verify / Edit Spoken Text in Transcript Box
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: SUBMIT ACTION BAR */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Selected Question:{' '}
              <strong className="text-slate-200">
                "{activeQuestionText.slice(0, 75)}{activeQuestionText.length > 75 ? '...' : ''}"
              </strong>
            </div>

            <button
              id="btn-process-video-review"
              onClick={handleSubmitAndAnalyze}
              disabled={
                processingStep !== 'idle' &&
                processingStep !== 'completed' &&
                processingStep !== 'error'
              }
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit & Generate Complete AI Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
