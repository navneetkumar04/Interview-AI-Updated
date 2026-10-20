import React from 'react';
import { BrandIcon } from './BrandLogo';
import {
  Bot,
  Video,
  FileText,
  Camera,
  Compass,
  Shield,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  BarChart3,
  Brain,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onOpenSignUp }) => {
  return (
    <div className="w-full text-slate-100 flex flex-col items-center">
      {/* 1. HERO SECTION */}
      <section className="w-full py-16 md:py-20 px-4 max-w-5xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Technical and behavioral interview practice</span>
        </div>

        <div className="flex flex-col items-center justify-center mb-5">
          <div className="mb-4">
            <BrandIcon size={56} variant="dark" withTile={true} />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
            Interview<span className="text-blue-400">.ai</span>
          </h1>
        </div>

        <p className="text-xl sm:text-2xl font-medium text-slate-200 mb-3 max-w-2xl">
          Practice interviews, get feedback, and improve before the real interview.
        </p>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed mb-8">
          Work through role-specific questions with conversational mock interviewers, run live practice sessions with peers, and review practical feedback on your answers.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            id="hero-btn-signup"
            onClick={onOpenSignUp}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Create an account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="hero-btn-login"
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium rounded-lg text-sm border border-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Sign in</span>
          </button>
        </div>
      </section>

      {/* 2. FEATURE OVERVIEW SECTION */}
      <section id="platform-overview" className="w-full py-14 px-4 bg-[#0a0f1d] border-y border-slate-800/80 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Tools to prepare for each stage of the hiring process
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mt-1.5">
              Practice answering questions out loud, review resume match suggestions, or join a live room for a mock technical screen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1: AI Mock Interviews */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Interactive Mock Interviews</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Role-specific technical and behavioral questions tailored to your experience level, with follow-ups based on what you answer.
              </p>
            </div>

            {/* Feature 2: AI Avatar Interviews */}
            <div id="ai-avatars-section" className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col scroll-mt-24">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Spoken Avatar Practice</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Practice answering aloud with realistic voice synthesis, active microphone transcription, and natural conversational cadence.
              </p>
            </div>

            {/* Feature 3: Human-to-Human Interviews */}
            <div id="webrtc-section" className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col scroll-mt-24">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Live Mock Rooms</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Peer-to-peer WebRTC video rooms where an interviewer can take notes, transcribe speech, and complete a structured evaluation sheet.
              </p>
            </div>

            {/* Feature 4: ATS Resume Analysis */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Resume Keywords & Match</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare your resume text against target job descriptions to identify missing technical keywords and formatting improvements.
              </p>
            </div>

            {/* Feature 5: Video Delivery Feedback */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Video Delivery Feedback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Record a video response to review your speaking pace, filler words, posture, and answer structure before actual interviews.
              </p>
            </div>

            {/* Feature 6: Career Roadmaps */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Career Roadmaps</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Personalized week-by-week learning curriculums for 43 technical roles across 1 to 6 months preparation duration with verified resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (4 STEPS) */}
      <section className="w-full py-14 px-4 max-w-5xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            How Interview.ai works
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mt-1.5">
            A simple process designed to help you practice regularly and track what you need to improve.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center mb-3 text-xs">
              1
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Set up your profile</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose your target role and seniority level to get questions tailored to your field.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center mb-3 text-xs">
              2
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Select a practice mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start an on-demand mock interview, practice speaking with an avatar, or schedule a live video call.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center mb-3 text-xs">
              3
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Answer and explain</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Respond naturally by voice or text. The simulator asks adaptive follow-ups on your logic.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center mb-3 text-xs">
              4
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Review your scorecard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Check breakdown scores on technical depth and communication, with clear ideas for next time.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ROLE OVERVIEW SECTION */}
      <section className="w-full py-14 px-4 bg-[#0a0f1d] border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Accounts
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Built for candidates and interviewers
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mt-1.5">
              Clear workspaces for candidates practicing skills and hiring managers running live interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Candidate */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Candidates</h3>
                  <span className="text-[11px] text-slate-400">Job seekers & engineers</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-5 flex-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>AI Avatar and written mock interviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Resume scan with target keyword matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Video delivery feedback on pacing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Structured career roadmaps by role</span>
                </li>
              </ul>
              <button
                id="portal-btn-candidate"
                onClick={onOpenSignUp}
                className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors text-center"
              >
                Sign up as candidate
              </button>
            </div>

            {/* Interviewer */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Interviewers</h3>
                  <span className="text-[11px] text-slate-400">Hiring managers & leads</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-5 flex-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Schedule 1-on-1 mock or screening rooms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Live candidate rubric scorecards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Private notes during the video call</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Automated speech transcript assistance</span>
                </li>
              </ul>
              <button
                id="portal-btn-interviewer"
                onClick={onOpenSignUp}
                className="w-full py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors text-center"
              >
                Sign up as interviewer
              </button>
            </div>

            {/* Administrator */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Administrators</h3>
                  <span className="text-[11px] text-slate-400">Team oversight</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mb-5 flex-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Role-based user permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Overview of active interview sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>User directory and account status management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Platform health and activity metrics</span>
                </li>
              </ul>
              <button
                id="portal-btn-admin-login"
                onClick={onOpenLogin}
                className="w-full py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors text-center"
              >
                Admin sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TECHNOLOGY & DETAILS SECTION */}
      <section className="w-full py-14 px-4 max-w-5xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Platform details
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Built for realistic practice and clear feedback
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mt-1.5">
            Key details behind how the mock interviews and evaluations work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1">Adaptive questions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Questions adjust based on your previous answers, probing edge cases and architectural trade-offs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1">Voice & speech synthesis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Low-latency speech audio and microphone recognition so you can practice speaking your thoughts aloud.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1">Live video rooms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Peer-to-peer WebRTC connections with shared notes and structured evaluation scorecards.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <BarChart3 className="w-5 h-5 text-blue-400 mb-2" />
            <h3 className="text-sm font-semibold text-white mb-1">Detailed scorecards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Objective scores across technical accuracy, problem solving, and communication with question-by-question feedback.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <Compass className="w-5 h-5 text-purple-400 mb-2" />
            <h3 className="text-sm font-semibold text-white mb-1">Career roadmaps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured study tracks that turn identified areas for growth into realistic milestones.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <Shield className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white mb-1">Authenticated access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict role-based access control protecting candidate reports, interviewer notes, and admin controls.
            </p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA BANNER */}
      <section className="w-full py-14 px-4 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Ready to practice for your next interview?
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
            Create an account in under a minute to start a mock interview, review your resume, or schedule a live session.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="cta-bottom-signup"
              onClick={onOpenSignUp}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Get started for free
            </button>
            <button
              id="cta-bottom-login"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium rounded-lg text-sm border border-slate-700 transition-colors"
            >
              Sign in to your account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
