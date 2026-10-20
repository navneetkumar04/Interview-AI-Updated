import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import {
  Sparkles,
  Bot,
  Video,
  FileText,
  Compass,
  Calendar,
  Shield,
  LogOut,
  Layers,
  Camera,
  ChevronDown,
  Play,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const role = user?.role || 'candidate';

  const scrollToLandingSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      onSelectView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleLogoClick = () => {
    if (!user) {
      onSelectView('landing');
    } else if (user.role === 'candidate') {
      onSelectView('dashboard');
    } else if (user.role === 'interviewer') {
      onSelectView('interviewer-dashboard');
    } else if (user.role === 'admin') {
      onSelectView('admin-panel');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={handleLogoClick}
              className="flex items-center text-left focus:outline-none"
            >
              <BrandLogo size="md" showBadge={false} />
            </button>
          </div>

          {/* Center Navigation for Authenticated Users */}
          {user ? (
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
              {role === 'candidate' && (
                <>
                  <button
                    id="nav-candidate-dashboard"
                    onClick={() => onSelectView('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'dashboard'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Dashboard
                  </button>
                  <button
                    id="nav-avatar-interview"
                    onClick={() => onSelectView('avatar-interview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'avatar-interview'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <span>Avatar practice</span>
                  </button>
                  <button
                    id="nav-classic-interview"
                    onClick={() => onSelectView('classic-interview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'classic-interview'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 text-blue-400" />
                    Mock interview
                  </button>
                  <button
                    id="nav-human-interviews"
                    onClick={() => onSelectView('scheduled-interviews')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'scheduled-interviews'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live rooms</span>
                  </button>
                  <button
                    id="nav-resume-analyzer"
                    onClick={() => onSelectView('resume-analyzer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'resume-analyzer'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Resume review
                  </button>
                  <button
                    id="nav-video-analyzer"
                    onClick={() => onSelectView('video-analyzer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'video-analyzer'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Video review
                  </button>
                  <button
                    id="nav-career-roadmap"
                    onClick={() => onSelectView('career-roadmap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'career-roadmap'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Roadmap
                  </button>
                </>
              )}

              {role === 'interviewer' && (
                <>
                  <button
                    id="nav-interviewer-dashboard"
                    onClick={() => onSelectView('interviewer-dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'interviewer-dashboard'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Interviews Hub
                  </button>
                  <button
                    id="nav-interviewer-schedule"
                    onClick={() => onSelectView('schedule-modal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'schedule-modal'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Schedule Live Call
                  </button>
                  <button
                    id="nav-interviewer-reports"
                    onClick={() => onSelectView('interviews-history')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'interviews-history'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    Candidate Evaluations
                  </button>
                </>
              )}

              {role === 'admin' && (
                <>
                  <button
                    id="nav-admin-panel"
                    onClick={() => onSelectView('admin-panel')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'admin-panel'
                        ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Platform Admin
                  </button>
                  <button
                    id="nav-admin-interviews"
                    onClick={() => onSelectView('admin-interviews')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'admin-interviews'
                        ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    All Live Sessions
                  </button>
                </>
              )}
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-400">
              <span
                id="nav-link-platform-overview"
                role="button"
                tabIndex={0}
                className="hover:text-white transition-colors cursor-pointer select-none py-1 focus:outline-none focus:text-white"
                onClick={() => scrollToLandingSection('platform-overview')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToLandingSection('platform-overview');
                  }
                }}
              >
                Features
              </span>
              <span
                id="nav-link-ai-avatars"
                role="button"
                tabIndex={0}
                className="hover:text-white transition-colors cursor-pointer select-none py-1 focus:outline-none focus:text-white"
                onClick={() => scrollToLandingSection('ai-avatars-section')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToLandingSection('ai-avatars-section');
                  }
                }}
              >
                Avatar practice
              </span>
              <span
                id="nav-link-live-webrtc"
                role="button"
                tabIndex={0}
                className="hover:text-white transition-colors cursor-pointer select-none py-1 focus:outline-none focus:text-white"
                onClick={() => scrollToLandingSection('webrtc-section')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToLandingSection('webrtc-section');
                  }
                }}
              >
                Live mock rooms
              </span>
            </div>
          )}

          {/* Right Section: User Profile or Auth Buttons (NO MANUAL ROLE SWITCHER) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName)}`}
                    alt={user.fullName}
                    className="w-7 h-7 rounded-lg object-cover bg-slate-800"
                  />
                  <div className="hidden md:block text-left pr-1">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-bold text-white">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] uppercase font-bold text-slate-300">
                          {user.role} role verified
                        </span>
                      </div>
                    </div>

                    <button
                      id="menu-item-dashboard"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSelectView(
                          role === 'candidate'
                            ? 'dashboard'
                            : role === 'interviewer'
                            ? 'interviewer-dashboard'
                            : 'admin-panel'
                        );
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-left hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Home Dashboard
                    </button>

                    <button
                      id="menu-item-signout"
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await logout();
                        onSelectView('landing');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-left text-red-400 hover:bg-red-950/40 flex items-center gap-2 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-signin"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  Sign in
                </button>
                <button
                  id="btn-nav-get-started"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
