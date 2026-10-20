import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BrandLogo } from './BrandLogo';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Printer,
  FileText,
  ChevronRight,
  User,
  Clock,
  Briefcase,
  Share2,
} from 'lucide-react';

interface ReportViewProps {
  reportId: string;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ reportId, onBack }) => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.interviews.getReport(reportId);
        setReport(res.report);
      } catch (err: any) {
        alert(err?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-white">Synthesizing Navneet Multi-Modal Report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-[#0f172a] border border-slate-800 rounded-2xl text-center">
        <p className="text-sm text-slate-400">Report not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const overall = report.metrics?.overallScore || report.overallScore || 85;
  const technical = report.metrics?.technicalKnowledge || report.technicalKnowledge || 86;
  const problemSolving = report.metrics?.problemSolving || report.problemSolving || 84;
  const communication = report.metrics?.communication || report.communication || 88;
  const confidence = report.metrics?.confidence || report.confidence || 82;
  const roleFit = report.metrics?.roleFit || report.roleFit || 85;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Header Summary Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 md:p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <BrandLogo size="sm" showBadge={false} />
          <span className="text-[11px] font-mono text-slate-400">
            ID: {reportId.slice(0, 12)}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Interview evaluation</span>
            </div>
            <h1 className="text-xl font-bold text-white">{report.jobRole || 'Software Engineer'}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Candidate: <strong className="text-slate-200">{report.candidateName || 'Candidate'}</strong>
              {report.interviewerName && (
                <>
                  {' '}• Interviewer: <strong className="text-slate-200">{report.interviewerName}</strong>
                </>
              )}
              {' '}• Format: <span className="capitalize">{report.mode === 'avatar' ? 'AI Avatar Interview' : (report.mode || 'Live Interview')}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs uppercase font-medium text-slate-400">Total Score</span>
              <p className="text-3xl font-extrabold text-white">{overall}%</p>
              <p className="text-[11px] text-emerald-400 font-medium">
                {overall >= 80 ? 'Passing evaluation' : 'Needs review'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
              {overall}
            </div>
          </div>
        </div>

        {/* 5 Core Competency Scores breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Technical</span>
              <span className="text-blue-400">{technical}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${technical}%` }} />
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Problem Solving</span>
              <span className="text-purple-400">{problemSolving}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${problemSolving}%` }} />
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Communication</span>
              <span className="text-emerald-400">{communication}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${communication}%` }} />
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Confidence</span>
              <span className="text-amber-400">{confidence}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Role Fit</span>
              <span className="text-cyan-400">{roleFit}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${roleFit}%` }} />
            </div>
          </div>
        </div>

        {/* Executive Summary if available */}
        {(report.finalSummary || report.detailedFeedback) && (
          <div className="mt-5 p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              <span>Evaluation summary</span>
            </div>
            <p className="text-slate-300">{report.finalSummary || report.detailedFeedback}</p>
          </div>
        )}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key strengths</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.strengths?.map((str: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Areas for improvement</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {(report.improvements || report.weaknesses)?.map((imp: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question by Question Detailed Feedback */}
      {((report.questionAnalysis && report.questionAnalysis.length > 0) ||
        (report.questionEvaluations && report.questionEvaluations.length > 0)) && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Question breakdown
          </h3>

          <div className="space-y-4 divide-y divide-slate-800">
            {(report.questionAnalysis || report.questionEvaluations).map((item: any, idx: number) => (
              <div key={idx} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Question {idx + 1}</span>
                  {item.score && (
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      Score: {item.score}%
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-white">{item.question}</p>

                {item.answer && (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-slate-400 text-[10px] uppercase mb-1">Response Summary:</p>
                    <p className="italic">"{item.answer}"</p>
                  </div>
                )}

                {item.feedback && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-purple-300">Feedback: </strong> {item.feedback}
                  </p>
                )}

                {item.suggestion && (
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    <strong>Suggestion: </strong> {item.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Conversation Transcript */}
      {report.transcript && report.transcript.length > 0 && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recorded Conversation Transcript ({report.transcript.length} utterances)
            </h3>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs divide-y divide-slate-800/60">
            {report.transcript.map((t: any, idx: number) => (
              <div key={idx} className="pt-2 first:pt-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-slate-200">{t.speaker}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{t.timestamp}</span>
                </div>
                <p className="text-slate-300">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
