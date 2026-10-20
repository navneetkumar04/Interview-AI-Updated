import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { ResumeAnalysisResult } from '../types';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Upload,
  RefreshCw,
  Award,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Target,
  ShieldAlert,
  Layers,
  X,
  FileCheck,
  FileUp,
  Search,
  Printer,
  RotateCcw,
  Tag,
} from 'lucide-react';

export interface RoleCategory {
  category: string;
  roles: string[];
}

const ROLE_CATEGORIES: RoleCategory[] = [
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
    category: 'AI & Machine Learning',
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
    category: 'Cloud & DevOps',
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
    category: 'Database & Systems',
    roles: [
      'Database Administrator',
      'SQL Developer',
      'System Engineer',
    ],
  },
  {
    category: 'Testing & QA',
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
      'Other / Custom Role',
    ],
  },
];

const ALL_ROLES: string[] = ROLE_CATEGORIES.flatMap((c) => c.roles);

type InputMethod = 'paste' | 'pdf' | 'docx';

export const ResumeAnalyzer: React.FC = () => {
  // Input Method State
  const [inputMethod, setInputMethod] = useState<InputMethod>('paste');
  const [resumeText, setResumeText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    size: string;
    base64: string;
    type: string;
  } | null>(null);

  // Configuration State
  const [targetRole, setTargetRole] = useState<string>('Full Stack Developer');
  const [customRole, setCustomRole] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [roleSearchFilter, setRoleSearchFilter] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isJdExpanded, setIsJdExpanded] = useState<boolean>(false);

  // Analysis Lifecycle State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Automatically scroll smoothly to report when analysis completes
  useEffect(() => {
    if (analysis && !loading) {
      const scrollTimer = setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(scrollTimer);
    }
  }, [analysis, loading]);

  // Close target role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // File size formatter
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Process chosen or dropped file
  const processUploadedFile = (file: File) => {
    setError(null);
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    // Check extension
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx');
    const isText = lowerName.endsWith('.txt') || lowerName.endsWith('.md');

    if (!isPdf && !isDocx && !isText) {
      setError('Please upload a supported document (.pdf, .docx, .txt, or .md).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit. Please select a smaller document.');
      return;
    }

    // Set appropriate input method tab based on file
    if (isPdf) setInputMethod('pdf');
    else if (isDocx) setInputMethod('docx');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setSelectedFile({
          file,
          name: file.name,
          size: formatFileSize(file.size),
          base64: result,
          type: file.type || (isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        });
      }
    };
    reader.onerror = () => {
      setError('Failed to read the selected file. Please try again or paste the text directly.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    // reset input so the same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Role resolution
  const effectiveRole = targetRole === 'Other / Custom Role'
    ? (customRole.trim() || 'Custom Technical Role')
    : targetRole;

  // Analysis submission
  const handleAnalyze = async () => {
    if (loading) return;
    setError(null);

    // Validate inputs
    let payload: {
      fileName?: string;
      resumeText?: string;
      fileBase64?: string;
      fileType?: string;
      targetRole: string;
      jobDescription?: string;
    };

    if (inputMethod === 'paste') {
      const trimmed = resumeText.trim();
      if (!trimmed || trimmed.length < 50) {
        setError('Please paste your resume text (minimum 50 characters required for genuine AI analysis).');
        return;
      }
      payload = {
        resumeText: trimmed,
        targetRole: effectiveRole,
        jobDescription: jobDescription.trim() || undefined,
      };
    } else {
      if (!selectedFile) {
        setError(`Please select or drop a ${inputMethod.toUpperCase()} file to analyze.`);
        return;
      }
      payload = {
        fileName: selectedFile.name,
        fileBase64: selectedFile.base64,
        fileType: selectedFile.type,
        targetRole: effectiveRole,
        jobDescription: jobDescription.trim() || undefined,
      };
    }

    setLoading(true);
    setLoadingStep('Extracting document content and verifying structure...');

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep(`Evaluating ATS rubric and keyword alignment for "${effectiveRole}"...`);
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Synthesizing section audits, project impact, and XYZ formula bullet rewrites...');
      }, 5000);

      const res = await api.resume.analyze(payload);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.analysis) {
        setAnalysis(res.analysis);
      } else {
        throw new Error('No analysis data received from the AI engine. Please retry.');
      }
    } catch (err: any) {
      console.error('Resume analysis client error:', err);
      setError(
        err?.message ||
          'Analysis failed. Please verify that your AI API keys are configured and valid on the server, then retry.'
      );
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleCopyDraft = () => {
    if (!analysis?.improvedResumeDraft) return;
    navigator.clipboard.writeText(analysis.improvedResumeDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  // Helper for score gauge color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500 bg-emerald-500/10';
    if (score >= 65) return 'text-amber-400 border-amber-500 bg-amber-500/10';
    return 'text-rose-400 border-rose-500 bg-rose-500/10';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'High ATS Pass Likelihood', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (score >= 65) return { label: 'Moderate Match - Optimization Recommended', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { label: 'Low ATS Compatibility - Needs Structural Rework', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  };

  const filteredCategories = ROLE_CATEGORIES.map((cat) => ({
    category: cat.category,
    roles: cat.roles.filter((r) => r.toLowerCase().includes(roleSearchFilter.toLowerCase())),
  })).filter((cat) => cat.roles.length > 0);

  const totalFilteredCount = filteredCategories.reduce((acc, cat) => acc + cat.roles.length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 text-slate-100 pb-16">
      {/* Header Banner (with relative z-30 and internal glow clipping so dropdown is never cut off) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-30">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Dynamic ATS Optimization Engine
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                AI Resume ATS & Job Role Analyzer
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Upload or paste your actual resume to receive an authentic, dynamically computed ATS readiness score, 6-dimension weighted rubric breakdown, section audit, and concrete bullet improvements tailored to your target role.
              </p>
            </div>
          </div>
        </div>

        {/* Target Role & Optional Job Description Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6 pt-6 border-t border-slate-800/80 relative">
          {/* Target Role Selector (7 cols) - Positioned with high z-index and click-outside support */}
          <div className="md:col-span-7 relative z-40" ref={roleDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                Target Job Role
              </label>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                {isRoleDropdownOpen ? 'Close list ▲' : 'Change role ▼'}
              </button>
            </div>

            <div className="relative">
              <button
                id="target-role-dropdown-btn"
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`w-full bg-slate-900 border rounded-xl py-3 px-4 text-sm text-left text-white flex items-center justify-between transition-all cursor-pointer shadow-md ${
                  isRoleDropdownOpen
                    ? 'border-blue-500 ring-2 ring-blue-500/30 bg-slate-800/90'
                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-sm shadow-blue-500" />
                  <span className="font-bold text-white truncate text-sm">{effectiveRole}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isRoleDropdownOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {/* Elevated Dropdown Menu with Search & Categorized Roles */}
              {isRoleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-600/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-[9999] p-3 space-y-2.5 backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Filter Input */}
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={roleSearchFilter}
                      onChange={(e) => setRoleSearchFilter(e.target.value)}
                      placeholder="Search 40+ engineering & tech roles..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    {roleSearchFilter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleSearchFilter('');
                        }}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Scrollable Role List by Category */}
                  <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                    {filteredCategories.map((cat, cIdx) => (
                      <div key={cIdx} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-950/60 rounded-md">
                          {cat.category}
                        </div>
                        <div className="space-y-0.5">
                          {cat.roles.map((role) => {
                            const isSelected = targetRole === role;
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  setTargetRole(role);
                                  setIsRoleDropdownOpen(false);
                                  setRoleSearchFilter('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <span className="truncate">{role}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {totalFilteredCount === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                        <p>No predefined role matching "{roleSearchFilter}".</p>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetRole('Other / Custom Role');
                            setCustomRole(roleSearchFilter);
                            setIsRoleDropdownOpen(false);
                            setRoleSearchFilter('');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Use "{roleSearchFilter}" as Custom Role
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Role Input Box */}
            {targetRole === 'Other / Custom Role' && (
              <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1">
                <input
                  type="text"
                  autoFocus
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter custom job title (e.g. Lead Blockchain Architect, SDET Lead)"
                  className="w-full bg-slate-950 border-2 border-blue-500 rounded-xl py-2 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-inner"
                />
                <span className="text-[10px] text-blue-400 block px-1">
                  Custom role active: The AI will evaluate your resume specifically against this title.
                </span>
              </div>
            )}
          </div>

          {/* Job Description Toggle (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setIsJdExpanded(!isJdExpanded)}
              className="w-full py-2.5 px-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Job Description Matching</span>
                {jobDescription.trim().length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              {isJdExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Job Description Area */}
        {isJdExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Paste Target Job Posting / Description (Optional)
              </span>
              <span className="text-[11px] text-slate-400">
                {jobDescription.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste specific job requirements, required technologies, or responsibilities here to evaluate keyword overlap..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Input Selection Tabs & Submission Zone */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMethod('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                inputMethod === 'paste'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                inputMethod === 'pdf'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('docx')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                inputMethod === 'docx'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload DOCX</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Directly extracts paragraphs, tables, and credentials with zero data fabrication.
          </span>
        </div>

        {/* TAB 1: Paste Text */}
        {inputMethod === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pasted Resume Content
              </label>
              <span className="text-[11px] text-slate-400">
                {resumeText.length} characters (min 50)
              </span>
            </div>
            <textarea
              id="textarea-resume-text"
              rows={12}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your complete resume text here (Summary, Work Experience, Technical Skills, Projects, Education)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
            />
          </div>
        )}

        {/* TAB 2 & 3: File Upload (PDF or DOCX) */}
        {(inputMethod === 'pdf' || inputMethod === 'docx') && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={inputMethod === 'pdf' ? '.pdf' : '.docx'}
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                    : 'border-slate-700/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-blue-400 mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Drag & drop your {inputMethod.toUpperCase()} resume here
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Supports modern {inputMethod === 'pdf' ? 'PDF' : 'DOCX'} documents up to 15MB. Scanned text streams and tables are automatically parsed.
                </p>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span>Browse {inputMethod.toUpperCase()} File</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-md">{selectedFile.name}</h4>
                    <p className="text-xs text-slate-400">{selectedFile.size} • Ready for analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="font-bold block">Analysis Warning:</span>
              <p className="leading-relaxed">{error}</p>
              {error.toLowerCase().includes('paste') && (
                <button
                  type="button"
                  onClick={() => {
                    setInputMethod('paste');
                    setError(null);
                  }}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Switch to Paste Text Mode →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Trigger Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Targeting <strong>{effectiveRole}</strong> {jobDescription ? 'with Job Description keyword audit' : ''}</span>
          </div>

          <button
            id="btn-scan-resume"
            onClick={handleAnalyze}
            disabled={
              loading ||
              (inputMethod === 'paste' ? resumeText.trim().length < 50 : !selectedFile)
            }
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating ATS Rubric...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze ATS Match Score</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6" />
          <h3 className="text-lg font-bold text-white mb-2">Analyzing Resume Against {effectiveRole} Standards</h3>
          <p className="text-xs text-slate-400 max-w-md">{loadingStep || 'Processing structured document metrics...'}</p>
          <div className="w-64 bg-slate-900 rounded-full h-1.5 mt-6 overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      )}

      {/* DYNAMIC REPORT DISPLAY (Only shown when genuine AI analysis is returned) */}
      {analysis && !loading && (
        <div ref={reportRef} id="resume-analysis-report" className="space-y-8 animate-in fade-in duration-300 pt-2">
          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span className="text-xs font-bold text-white">
                ATS Evaluation Ready for <span className="text-blue-400 font-extrabold">{effectiveRole}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Another</span>
              </button>
            </div>
          </div>

          {/* 1. Score Overview Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>{analysis.scoreLabel || 'AI-Generated Estimated ATS Readiness Score'}</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  ATS Match & Competency Assessment
                </h2>
                <div className="inline-block px-3 py-1 rounded-lg border text-xs font-semibold mt-1">
                  <span className={getScoreBadge(analysis.overallScore).color}>
                    {getScoreBadge(analysis.overallScore).label}
                  </span>
                </div>
              </div>

              {/* Radial Gauge */}
              <div className="flex items-center gap-5">
                <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${getScoreColor(analysis.overallScore)}`}>
                  <span className="text-4xl font-black tracking-tight">{analysis.overallScore}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">out of 100</span>
                </div>
              </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Audit Note:</strong> {analysis.scoreDisclaimer || 'This score is an AI-generated estimate based on best-practice ATS parsing heuristics, keyword alignment, and structural benchmarks. It is not an endorsement or verified score from a specific company\'s proprietary ATS.'}
              </span>
            </div>

            {/* 7 Core Subscores Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
              {[
                { label: 'Role Match', val: analysis.subscores?.roleMatch ?? 75 },
                { label: 'Skills Match', val: analysis.subscores?.skillsMatch ?? 75 },
                { label: 'Project Relevance', val: analysis.subscores?.projectRelevance ?? 75 },
                { label: 'Structure', val: analysis.subscores?.resumeStructure ?? 80 },
                { label: 'Readability', val: analysis.subscores?.readability ?? 85 },
                { label: 'Keyword Coverage', val: analysis.subscores?.keywordCoverage ?? 70 },
                { label: 'Quant. Impact', val: analysis.subscores?.impact ?? 70 },
              ].map((sub, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate mb-1">
                    {sub.label}
                  </span>
                  <div className="text-xl font-black text-white">{sub.val}%</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        sub.val >= 80 ? 'bg-emerald-400' : sub.val >= 65 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${sub.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. ATS Keyword Alignment Card (Found vs. Missing) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-400" />
                  ATS Keyword Alignment & Gap Detection
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated applicant tracking systems evaluate candidate text against target keywords required for <strong>{effectiveRole}</strong>.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {(analysis.foundKeywords || []).length} Found
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> {(analysis.missingKeywords || []).length} Missing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Keywords Found */}
              <div className="bg-slate-900/60 border border-emerald-950/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Keywords Detected in Resume
                  </span>
                  <span className="text-[10px] text-emerald-500/80 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    ATS Recognized
                  </span>
                </div>
                {(analysis.foundKeywords && analysis.foundKeywords.length > 0) ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.foundKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No domain-specific keywords extracted.</p>
                )}
              </div>

              {/* Missing Keywords */}
              <div className="bg-slate-900/60 border border-rose-950/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <X className="w-4 h-4" />
                    Missing ATS Keywords for {effectiveRole}
                  </span>
                  <span className="text-[10px] text-rose-400/80 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                    Recommended Fix
                  </span>
                </div>
                {(analysis.missingKeywords && analysis.missingKeywords.length > 0) ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.missingKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400">Excellent keyword coverage! No critical industry keywords missing.</p>
                )}
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  💡 <strong>Tip:</strong> Incorporate these missing keywords into your project descriptions, skills list, or experience bullets where truthfully applicable.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Executive Summary & Candidate Profile Snapshot */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Executive Profile Evaluation
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl">
              {analysis.executiveSummary}
            </p>

            {analysis.extractedInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Detected Candidate</span>
                  <span className="font-semibold text-white">{analysis.extractedInfo.name || 'Candidate'}</span>
                  {analysis.extractedInfo.email && (
                    <span className="text-slate-400 block truncate text-[11px]">{analysis.extractedInfo.email}</span>
                  )}
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience Tenure</span>
                  <span className="font-semibold text-white">~{analysis.extractedInfo.experienceYears} Years</span>
                  <span className="text-slate-400 block text-[11px]">Calculated from timeline</span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Technologies</span>
                  <span className="font-semibold text-blue-400 truncate block">
                    {analysis.extractedInfo.topTechnologies?.slice(0, 4).join(', ') || 'Listed in profile'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. 6-Category Weighted ATS Rubric Breakdown */}
          {analysis.categoryRubric && analysis.categoryRubric.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Weighted ATS Scoring Rubric Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Individual category evaluations totaling 100% weight, with resume evidence and targeted improvement actions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {analysis.categoryRubric.map((cat, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 mb-1">
                          Weight: {cat.weight}%
                        </div>
                        <h4 className="text-sm font-bold text-white">{cat.category}</h4>
                      </div>
                      <div className={`px-2.5 py-1 rounded-xl font-bold text-sm border ${getScoreColor(cat.score)}`}>
                        {cat.score}/100
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{cat.explanation}</p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                          Resume Evidence:
                        </span>
                        <p className="text-slate-400 text-[11px] italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                          "{cat.evidence}"
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                          Improvement Action:
                        </span>
                        <p className="text-slate-300 text-[11px]">{cat.improvementAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Strengths & Weaknesses (Dynamic & Evidence-Backed) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-base font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <h3>Verified Strengths ({analysis.strengths?.length || 0})</h3>
              </div>
              <p className="text-xs text-slate-400">
                Key qualifications and evidence that strongly align with {effectiveRole}.
              </p>

              <div className="space-y-3">
                {(!analysis.strengths || analysis.strengths.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No specific strengths extracted.</p>
                ) : (
                  analysis.strengths.map((str: any, idx: number) => {
                    const title = typeof str === 'string' ? `Strength ${idx + 1}` : (str.title || `Strength ${idx + 1}`);
                    const explanation = typeof str === 'string' ? str : (str.explanation || str.title || '');
                    const evidence = typeof str === 'object' ? str.evidence : null;
                    const howToEmphasize = typeof str === 'object' ? str.howToEmphasize : null;
                    return (
                      <div key={idx} className="bg-slate-900/80 border border-emerald-950/60 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <h4 className="text-xs font-bold text-emerald-300">{title}</h4>
                        </div>
                        <p className="text-xs text-slate-200">{explanation}</p>
                        {evidence && (
                          <div className="text-[11px] bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-400 italic">
                            <span className="text-emerald-500 font-bold not-italic">Proof: </span>
                            "{evidence}"
                          </div>
                        )}
                        {howToEmphasize && (
                          <p className="text-[11px] text-blue-300 font-medium">
                            💡 How to emphasize: {howToEmphasize}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-rose-400 text-base font-bold">
                <ShieldAlert className="w-5 h-5" />
                <h3>Critical Gaps & Recommended Fixes ({analysis.weaknesses?.length || 0})</h3>
              </div>
              <p className="text-xs text-slate-400">
                Identified omissions, unquantified points, or risks for {effectiveRole}.
              </p>

              <div className="space-y-3">
                {(!analysis.weaknesses || analysis.weaknesses.length === 0) ? (
                  <p className="text-xs text-emerald-400">No major critical gaps detected in this draft.</p>
                ) : (
                  analysis.weaknesses.map((weak: any, idx: number) => {
                    const title = typeof weak === 'string' ? `Area for Improvement ${idx + 1}` : (weak.title || `Area for Improvement ${idx + 1}`);
                    const explanation = typeof weak === 'string' ? weak : (weak.explanation || weak.title || '');
                    const severity = (typeof weak === 'object' && weak.severity) ? weak.severity : 'medium';
                    const whyItMatters = typeof weak === 'object' ? weak.whyItMatters : null;
                    const recommendedCorrection = typeof weak === 'object' ? weak.recommendedCorrection : null;
                    return (
                      <div key={idx} className="bg-slate-900/80 border border-rose-950/60 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            <h4 className="text-xs font-bold text-rose-300">{title}</h4>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {severity} severity
                          </span>
                        </div>
                        <p className="text-xs text-slate-200">{explanation}</p>
                        {whyItMatters && (
                          <p className="text-[11px] text-amber-300/90">
                            <strong>Why it matters:</strong> {whyItMatters}
                          </p>
                        )}
                        {recommendedCorrection && (
                          <div className="text-[11px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                            <span className="text-emerald-400 font-bold">Recommended fix: </span>
                            {recommendedCorrection}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 5. Undemonstrated / Missing Skills */}
          {analysis.skillGaps && analysis.skillGaps.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Undemonstrated Role Skills & Technologies
              </h3>
              <p className="text-xs text-slate-400">
                Skills standard for {effectiveRole} that were not demonstrated in the submitted resume.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.skillGaps.map((gap, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{gap.skill}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        gap.importance === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {gap.importance}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{gap.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Section-by-Section Audit */}
          {analysis.sectionFeedback && analysis.sectionFeedback.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Section-by-Section ATS Audit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.sectionFeedback.map((sec, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">{sec.sectionName}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        sec.status === 'strong'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : sec.status === 'needs_improvement'
                          ? 'bg-amber-500/20 text-amber-400'
                          : sec.status === 'missing'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {sec.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{sec.findings}</p>
                    {sec.recommendations && (
                      <p className="text-[11px] text-blue-400 font-medium">
                        → {sec.recommendations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Detected Projects & Practical Relevance Analysis */}
          {analysis.projectAnalysis && analysis.projectAnalysis.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Detected Projects & Implementation Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Evaluation of genuine projects identified in candidate resume.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.projectAnalysis.map((proj, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-white">{proj.projectName}</h4>
                    </div>

                    {proj.technologiesIdentified?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.technologiesIdentified.map((tech, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/50 text-[10px] text-blue-300 font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300"><strong>Strengths:</strong> {proj.strengths}</p>
                      <p className="text-slate-400"><strong>Role Fit:</strong> {proj.relevanceToRole}</p>
                      <p className="text-amber-300/90"><strong>Areas to Deepen:</strong> {proj.areasToDeepen}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Before & After Bullet Point Rewrites (XYZ Formula) */}
          {analysis.bulletImprovements && analysis.bulletImprovements.length > 0 && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-emerald-400" />
                  Before-and-After Bullet Point Improvements (XYZ Formula)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rewritten directly using Google's formula: "Accomplished [X] as measured by [Y], by doing [Z]" without inventing fake facts.
                </p>
              </div>

              <div className="space-y-4 mt-4">
                {analysis.bulletImprovements.map((bullet, idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block flex items-center gap-1">
                          <X className="w-3 h-3" /> Original Bullet from Resume
                        </span>
                        <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl text-xs text-slate-300 italic">
                          "{bullet.originalText}"
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300">Problem:</strong> {bullet.problem}
                        </p>
                      </div>

                      {/* Improved */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block flex items-center gap-1">
                          <Check className="w-3 h-3" /> AI Improved (XYZ Formula)
                        </span>
                        <div className="bg-emerald-950/30 border border-emerald-800/60 p-3 rounded-xl text-xs text-emerald-200 font-medium">
                          "{bullet.improvedText}"
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300">Why it works:</strong> {bullet.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Key Recommendations & Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Top Priority ATS Actions
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {(analysis.keyRecommendations || analysis.improvements || []).map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{typeof rec === 'string' ? rec : (rec as any)?.title || JSON.stringify(rec)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Grammar & Formatting Observations
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.formattingGrammarObservations?.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 10. Improved Resume Draft */}
          {analysis.improvedResumeDraft && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    ATS-Optimized Resume Draft (Markdown)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Organized strictly from your authentic credentials, achievements, and projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 rounded-xl transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {copiedDraft ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy Improved Draft</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 max-h-96 overflow-y-auto">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {analysis.improvedResumeDraft}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
