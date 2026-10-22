import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { BrandLogo } from './components/BrandLogo';
import { Shield, Mail, FileText } from 'lucide-react';

// Code-split dynamic views so landing page loads immediately without heavy dependencies
const CandidateDashboard = lazy(() =>
  import('./components/CandidateDashboard').then((m) => ({ default: m.CandidateDashboard }))
);
const AvatarInterview = lazy(() =>
  import('./components/AvatarInterview').then((m) => ({ default: m.AvatarInterview }))
);
const ClassicInterview = lazy(() =>
  import('./components/ClassicInterview').then((m) => ({ default: m.ClassicInterview }))
);
const HumanInterviewRoom = lazy(() =>
  import('./components/HumanInterviewRoom').then((m) => ({ default: m.HumanInterviewRoom }))
);
const InterviewerDashboard = lazy(() =>
  import('./components/InterviewerDashboard').then((m) => ({ default: m.InterviewerDashboard }))
);
const ResumeAnalyzer = lazy(() =>
  import('./components/ResumeAnalyzer').then((m) => ({ default: m.ResumeAnalyzer }))
);
const VideoAnalyzer = lazy(() =>
  import('./components/VideoAnalyzer').then((m) => ({ default: m.VideoAnalyzer }))
);
const CareerRoadmap = lazy(() =>
  import('./components/CareerRoadmap').then((m) => ({ default: m.CareerRoadmap }))
);
const ReportView = lazy(() =>
  import('./components/ReportView').then((m) => ({ default: m.ReportView }))
);
const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
const ScheduleInterviewModal = lazy(() =>
  import('./components/ScheduleInterviewModal').then((m) => ({ default: m.ScheduleInterviewModal }))
);
const AuthModal = lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);

const ViewSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse py-4">
    <div className="h-32 bg-slate-900/60 border border-slate-800 rounded-xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl" />
      <div className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl" />
      <div className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl" />
      <div className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl" />
    </div>
    <div className="h-64 bg-slate-900/40 border border-slate-800 rounded-xl" />
  </div>
);

const MainContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<any>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Check URL pathname and query params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const roomParam = searchParams.get('room');

      if (roomParam) {
        sessionStorage.setItem('pending_interview_room', roomParam);
        if (!user && !isLoading) {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }
      }

      if (path === '/login') {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      } else if (path === '/signup' || path === '/register') {
        setAuthModalMode('register');
        setIsAuthModalOpen(true);
      }
    }
  }, [user, isLoading]);

  // Synchronize view based on authentication state and user role
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // If unauthenticated, always default to landing page
        setCurrentView('landing');
      } else {
        // Check for pending interview room invitation link (either from URL or sessionStorage)
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const directRoom = urlParams?.get('room');
        const pendingRoom = directRoom || (typeof window !== 'undefined' ? sessionStorage.getItem('pending_interview_room') : null);
        
        if (pendingRoom) {
          sessionStorage.removeItem('pending_interview_room');
          // Clean the query param from URL without page reload
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          setViewParams({ roomId: pendingRoom });
          setCurrentView('human-interview-room');
          return;
        }

        // If user is authenticated, redirect to appropriate role dashboard
        if (currentView === 'landing') {
          if (user.role === 'interviewer') {
            setCurrentView('interviewer-dashboard');
          } else if (user.role === 'admin') {
            setCurrentView('admin-panel');
          } else {
            setCurrentView('dashboard');
          }
        }
      }
    }
  }, [user, isLoading]);

  // Handle View Navigation with strict Authentication & Role Guards
  // Preload role dashboard during idle time once user is known
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        if (user.role === 'interviewer') {
          import('./components/InterviewerDashboard');
        } else if (user.role === 'admin') {
          import('./components/AdminPanel');
        } else {
          import('./components/CandidateDashboard');
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSelectView = (view: string, params: any = {}) => {
    if (view === 'schedule-modal') {
      if (!user) {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
        return;
      }
      setIsScheduleModalOpen(true);
      return;
    }

    // Public view: Landing
    if (view === 'landing') {
      setViewParams({});
      setCurrentView('landing');
      if (params?.sectionId) {
        setTimeout(() => {
          const el = document.getElementById(params.sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // Private views: Require authentication
    if (!user) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    // Role-based Access Control Guards
    if (view === 'admin-panel' && user.role !== 'admin') {
      setCurrentView(user.role === 'interviewer' ? 'interviewer-dashboard' : 'dashboard');
      return;
    }

    // Guard interviewer-dashboard private controls from candidate accounts (scheduled-interviews is accessible by candidates to view their live rooms)
    if (view === 'interviewer-dashboard' && user.role === 'candidate') {
      setCurrentView('scheduled-interviews');
      return;
    }

    setViewParams(params);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Initializing Interview.ai...</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying secure session token</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600/40">
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1 w-full">
        {/* PUBLIC VIEW: Render ONLY Landing Page when unauthenticated */}
        {!user || currentView === 'landing' ? (
          <LandingPage
            onOpenLogin={() => handleOpenAuth('login')}
            onOpenSignUp={() => handleOpenAuth('register')}
          />
        ) : (
          /* PRIVATE VIEWS: Rendered ONLY when user is authenticated */
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<ViewSkeleton />}>
              {currentView === 'dashboard' && (
                <CandidateDashboard onSelectView={handleSelectView} />
              )}

              {currentView === 'avatar-interview' && (
                <AvatarInterview
                  initialInterviewId={viewParams?.interviewId}
                  onSelectView={handleSelectView}
                />
              )}

              {currentView === 'classic-interview' && (
                <ClassicInterview onSelectView={handleSelectView} />
              )}

              {currentView === 'human-interview-room' && (
                <HumanInterviewRoom
                  roomId={viewParams.roomId || 'room-tech-preview'}
                  onSelectView={handleSelectView}
                />
              )}

              {currentView === 'scheduled-interviews' && (
                <InterviewerDashboard onSelectView={handleSelectView} />
              )}

              {currentView === 'interviewer-dashboard' && (
                <InterviewerDashboard onSelectView={handleSelectView} />
              )}

              {currentView === 'resume-analyzer' && <ResumeAnalyzer />}

              {currentView === 'video-analyzer' && (
                <VideoAnalyzer onSelectView={handleSelectView} />
              )}

              {currentView === 'career-roadmap' && <CareerRoadmap />}

              {currentView === 'report-view' && (
                <ReportView
                  reportId={viewParams.reportId || 'rep_preview'}
                  onBack={() =>
                    handleSelectView(
                      user?.role === 'interviewer' ? 'interviewer-dashboard' : 'dashboard'
                    )
                  }
                />
              )}

              {currentView === 'admin-panel' && <AdminPanel />}
            </Suspense>
          </div>
        )}
      </main>

      {/* Comprehensive Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-3">
                <BrandLogo size="sm" showBadge={false} />
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Enterprise-grade multi-modal interview simulator powered by Navneet AI and WebRTC audio/video architecture.
              </p>
              <div className="text-[11px] text-slate-400">
                Practice smarter. Interview better.
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => handleSelectView('avatar-interview')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    AI Avatar Simulator
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectView('classic-interview')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Classic Mock Interviews
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectView('resume-analyzer')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    ATS Resume Analyzer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectView('video-analyzer')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Behavioral Video Analysis
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Roles & Portals</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => handleSelectView('dashboard')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Candidate Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectView('interviewer-dashboard')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Interviewer Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectView('admin-panel')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Administrator Panel
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSelectView('career-roadmap')}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Career Roadmaps
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Support & Governance</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Privacy Policy & Data Security</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terms of Service</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>support@interview.ai</span>
                </li>
                <li className="text-[11px] text-slate-400 pt-1">
                  GDPR & SOC-2 Compliant Architecture
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-[11px]">
              &copy; {new Date().getFullYear()} Interview.ai Inc. All rights reserved.
            </p>
            <p className="text-slate-400 text-[11px]">
              Multi-modal Navneet AI &bull; WebRTC Real-Time &bull; End-to-End Encrypted Sessions
            </p>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            defaultMode={authModalMode}
            onClose={() => {
              setIsAuthModalOpen(false);
              // If browser URL was /login or /signup, normalize back to root
              if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
                window.history.replaceState({}, '', '/');
              }
            }}
            onLoginSuccess={(role) => {
              if (role === 'interviewer') {
                setCurrentView('interviewer-dashboard');
              } else if (role === 'admin') {
                setCurrentView('admin-panel');
              } else {
                setCurrentView('dashboard');
              }
            }}
          />
        </Suspense>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <Suspense fallback={null}>
          <ScheduleInterviewModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            onSuccess={() => {
              handleSelectView('interviewer-dashboard');
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
