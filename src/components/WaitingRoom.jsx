import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Wifi,
  Clock,
  CheckCircle2,
  Lock,
  Rocket,
  Timer,
  Shield,
} from 'lucide-react';

const FAKE_STUDENTS = [
  { name: 'Priya Sharma', id: 'STU-2024-0108' },
  { name: 'Alex Chen', id: 'STU-2024-0073' },
];

const TOTAL_SECONDS = 5 * 60; // 5 minutes

export default function WaitingRoom({ onNext, classData, studentInfo, onSessionLock }) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [locked, setLocked] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  // Build student list: current student + 2 fake students
  const studentList = [
    ...(studentInfo
      ? [{ name: studentInfo.fullName, id: studentInfo.studentId, isSelf: true }]
      : []),
    ...FAKE_STUDENTS.map((s) => ({ ...s, isSelf: false })),
  ];

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Lock session when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && !locked) {
      setLocked(true);
      onSessionLock();

      // Transition to classroom after 3 seconds
      setTimeout(() => {
        setTransitioning(true);
      }, 500);

      setTimeout(() => {
        onNext();
      }, 3000);
    }
  }, [secondsLeft, locked, onSessionLock, onNext]);

  // Format time
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;

  // Timer color
  const timerColor =
    secondsLeft > 180
      ? 'text-cyber-green'
      : secondsLeft > 60
      ? 'text-warning'
      : 'text-error';

  const ringColor =
    secondsLeft > 180
      ? 'stroke-cyber-green'
      : secondsLeft > 60
      ? 'stroke-warning'
      : 'stroke-error';

  // ─── Locked + transitioning ─────────────────────────────
  if (locked) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="orb orb-green w-80 h-80 top-0 left-1/2 -translate-x-1/2" />

        <div className="w-full max-w-lg relative z-10 text-center">
          <div className="animate-slide-up">
            <div
              className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center border transition-all duration-700 ${
                transitioning
                  ? 'bg-accent-500/15 border-accent-500/25'
                  : 'bg-error/10 border-error/20'
              }`}
            >
              {transitioning ? (
                <Rocket size={34} className="text-accent-400 animate-float" />
              ) : (
                <Lock size={34} className="text-error" />
              )}
            </div>

            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {transitioning ? (
                <>
                  Class is{' '}
                  <span className="bg-gradient-to-r from-accent-400 to-cyber-green bg-clip-text text-transparent">
                    Starting…
                  </span>
                </>
              ) : (
                <>
                  Session is Now{' '}
                  <span className="text-error">Locked</span>
                </>
              )}
            </h1>

            <p className="text-slate-400 text-base mb-8">
              {transitioning
                ? 'Preparing your classroom experience'
                : 'No new students can join. Class is starting…'}
            </p>

            {/* Loading bar */}
            <div className="max-w-xs mx-auto">
              <div className="h-1.5 rounded-full bg-navy-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyber-green transition-all duration-[3000ms] ease-linear"
                  style={{ width: transitioning ? '100%' : '30%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {studentList.length} students connected
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal waiting room ────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="orb orb-purple w-96 h-96 top-0 left-1/2 -translate-x-1/2" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-500/10 border border-accent-500/20 mb-5 pulse-ring text-accent-400">
            <Wifi size={32} className="text-accent-400 animate-float" />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Waiting Room
          </h1>
          <p className="text-slate-400">
            Waiting for session to begin…
          </p>
        </div>

        {/* Timer Card */}
        <div className="glass p-6 sm:p-8 text-center mb-6 animate-slide-up">
          <div className="flex flex-col items-center">
            {/* Circular timer */}
            <div className="relative w-36 h-36 mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="6"
                  className="stroke-navy-700"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={`${ringColor} transition-all duration-1000 ease-linear`}
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (progress / 100)}`}
                />
              </svg>
              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-3xl font-bold font-mono ${timerColor} transition-colors duration-500`}
                >
                  {timeStr}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                  remaining
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Timer size={13} />
                <span>Session locks when timer reaches zero</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const text = "Welcome to ClassAI. Testing audio synthesis for the upcoming lecture. Audio is working perfectly.";
                    const utterance = new SpeechSynthesisUtterance(text);
                    const voices = window.speechSynthesis.getVoices();
                    const engVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                    if (engVoice) utterance.voice = engVoice;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-accent-500/10 hover:bg-accent-500/20 text-accent-300 border-none cursor-pointer flex items-center gap-1.5 transition-all duration-200"
              >
                🔊 Test Voice
              </button>
            </div>
          </div>
        </div>

        {/* Session Info Bar */}
        {classData && (
          <div className="glass-light p-4 flex flex-wrap items-center justify-center gap-6 mb-6 animate-slide-up text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Session:</span>
              <span className="text-white font-semibold">
                {classData.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Code:</span>
              <span className="text-accent-400 font-mono font-bold tracking-wider">
                {classData.sessionCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-cyber-green" />
              <span className="text-slate-300">
                {classData.duration * 6} min total
              </span>
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="glass p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users size={16} className="text-accent-400" />
              Students Joined
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-accent-400 font-bold">
                {studentList.length}
              </span>
              <span className="text-slate-500">connected</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {studentList.map((student, idx) => (
              <div
                key={student.id}
                className="glass-light p-3.5 flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: `hsl(${(idx * 97 + 180) % 360}, 55%, 45%)`,
                  }}
                >
                  {student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {student.name}
                    {student.isSelf && (
                      <span className="ml-2 text-[10px] font-semibold text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {student.id}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1 text-[11px] text-cyber-green shrink-0">
                  <CheckCircle2 size={12} />
                  <span>Connected</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 animate-slide-up">
          <Shield size={12} />
          <span>
            Session token:{' '}
            <span className="font-mono text-slate-500">
              {studentInfo?.sessionToken
                ? studentInfo.sessionToken.slice(0, 20) + '…'
                : '—'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
