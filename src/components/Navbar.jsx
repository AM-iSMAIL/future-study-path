import { useState } from 'react';
import {
  ChevronRight,
  Zap,
  GraduationCap,
  BookOpen,
  Trophy,
  BarChart3,
  Users,
} from 'lucide-react';

const SCREENS = [
  { id: 'teacher-setup', label: 'Setup', icon: Zap },
  { id: 'student-join', label: 'Join', icon: Users },
  { id: 'waiting-room', label: 'Waiting', icon: BookOpen },
  { id: 'classroom', label: 'Class', icon: GraduationCap },
  { id: 'quiz', label: 'Quiz', icon: Trophy },
  { id: 'results', label: 'Results', icon: BarChart3 },
];

const SCREEN_LABELS = {
  'teacher-setup': 'Teacher Setup',
  'student-join': 'Student Join',
  'waiting-room': 'Waiting Room',
  'classroom': 'AI Classroom',
  'quiz': 'Interactive Quiz',
  'results': 'Session Results'
};

export default function Navbar({ currentScreen, onNavigate, studentInfo, strikeCount, classData }) {
  const currentIndex = SCREENS.findIndex((s) => s.id === currentScreen);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Screen Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-accent-500 to-cyber-purple glow-accent">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span
                className="text-lg font-bold tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Class<span className="text-accent-400">AI</span>
              </span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 uppercase tracking-wider font-mono hidden sm:inline-block select-none">
              {SCREEN_LABELS[currentScreen] || currentScreen}
            </span>
          </div>

          {/* Screen Steps */}
          <div className="hidden lg:flex items-center gap-1">
            {SCREENS.map((screen, idx) => {
              const Icon = screen.icon;
              const isActive = screen.id === currentScreen;
              const isPast = idx < currentIndex;

              return (
                <button
                  key={screen.id}
                  onClick={() => onNavigate(screen.id)}
                  className={`
                    group flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-xs font-medium transition-all duration-300 cursor-pointer
                    border-none
                    ${
                      isActive
                        ? 'bg-accent-500/20 text-accent-300 glow-accent'
                        : isPast
                        ? 'text-accent-400/60 hover:text-accent-300 hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  <Icon
                    size={14}
                    className={`transition-all duration-300 ${
                      isActive ? 'text-accent-400' : ''
                    }`}
                  />
                  <span>{screen.label}</span>
                  {idx < SCREENS.length - 1 && (
                    <ChevronRight
                      size={12}
                      className="ml-1 text-navy-600 group-last:hidden"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Section: Session Code & Student Status */}
          <div className="flex items-center gap-3">
            {/* Active Session Code */}
            {classData?.sessionCode && (
              <div className="flex items-center gap-1.5 bg-accent-500/10 border border-accent-500/20 px-3 py-1.5 rounded-lg text-xs font-bold text-accent-300 font-mono tracking-wider select-all">
                <span className="text-slate-500 text-[10px] uppercase font-sans font-normal hidden sm:inline">Code:</span>
                {classData.sessionCode}
              </div>
            )}

            {/* Student Status Badge */}
            {studentInfo && (
              <div className="hidden sm:flex items-center gap-2.5 bg-navy-950 border border-white/5 px-3.5 py-1.5 rounded-full shadow-inner animate-fade-in select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-300 font-display">
                  {studentInfo.fullName}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">|</span>
                <span className={`text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded ${
                  strikeCount > 0 
                    ? 'bg-error/15 text-error border border-error/20 animate-pulse' 
                    : 'bg-accent-500/15 text-accent-400 border border-accent-500/20'
                }`}>
                  Strikes: {strikeCount}
                </span>
              </div>
            )}
          </div>

          {/* Mobile current screen indicator */}
          <div className="lg:hidden flex items-center gap-2 text-sm text-accent-300">
            {(() => {
              const Icon =
                SCREENS.find((s) => s.id === currentScreen)?.icon || Zap;
              return <Icon size={16} />;
            })()}
            <span className="font-medium">
              {SCREENS.find((s) => s.id === currentScreen)?.label}
            </span>
            <span className="text-navy-500 text-xs">
              ({currentIndex + 1}/{SCREENS.length})
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-navy-800">
        <div
          className="h-full bg-gradient-to-r from-accent-500 to-cyber-purple transition-all duration-700 ease-out progress-bar-glow"
          style={{
            width: `${((currentIndex + 1) / SCREENS.length) * 100}%`,
          }}
        />
      </div>
    </nav>
  );
}
