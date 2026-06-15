import { useState } from 'react';
import {
  LogIn,
  Hash,
  User,
  ArrowRight,
  Sparkles,
  GraduationCap,
  IdCard,
  ShieldCheck,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export default function StudentJoin({
  onNext,
  classData,
  sessionLocked,
  onStudentJoin,
  onRejoin,
}) {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Rejoin state
  const [rejoinId, setRejoinId] = useState('');
  const [rejoinError, setRejoinError] = useState('');
  const [rejoinSuccess, setRejoinSuccess] = useState(false);

  const clearError = () => setError('');

  const handleJoin = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!studentId.trim()) {
      setError('Please enter your Student ID.');
      return;
    }
    if (!code.trim()) {
      setError('Please enter the session code.');
      return;
    }
    if (classData && code.toUpperCase() !== classData.sessionCode) {
      setError('Invalid session code. Please check with your teacher.');
      return;
    }

    onStudentJoin({
      fullName: fullName.trim(),
      studentId: studentId.trim(),
    });
    onNext();
  };

  const handleRejoin = () => {
    if (!rejoinId.trim()) {
      setRejoinError('Please enter your Student ID.');
      return;
    }
    const found = onRejoin(rejoinId.trim());
    if (found) {
      setRejoinSuccess(true);
      setTimeout(() => onNext(), 1200);
    } else {
      setRejoinError('No session token found for this Student ID. Contact your teacher.');
    }
  };

  // ─── Locked Session: Rejoin UI ──────────────────────────
  if (sessionLocked) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="orb orb-purple w-72 h-72 -top-16 -right-16" />
        <div className="orb orb-blue w-64 h-64 -bottom-16 -left-10" />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-error/10 border border-error/20">
              <Lock size={28} className="text-error" />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Session{' '}
              <span className="text-error">Locked</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              This session is no longer accepting new students.
              If you joined earlier, enter your Student ID to rejoin.
            </p>
          </div>

          {/* Rejoin Card */}
          <div className="glass p-6 sm:p-8 animate-slide-up">
            {rejoinSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-success/15 border border-success/25">
                  <ShieldCheck size={26} className="text-success" />
                </div>
                <p className="text-success font-semibold text-lg mb-1">
                  Session Restored!
                </p>
                <p className="text-slate-400 text-sm">
                  Redirecting you back to class…
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-warning/8 border border-warning/15 mb-6">
                  <AlertTriangle size={15} className="text-warning shrink-0" />
                  <p className="text-xs text-warning/90 leading-relaxed">
                    Only students who previously joined can rejoin using their
                    original Student ID.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <IdCard size={14} className="text-accent-400" />
                    Student ID
                  </label>
                  <input
                    type="text"
                    className="input-dark"
                    placeholder="Enter your Student ID"
                    value={rejoinId}
                    onChange={(e) => {
                      setRejoinId(e.target.value);
                      setRejoinError('');
                    }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRejoin()}
                  />
                </div>

                {rejoinError && (
                  <div className="flex items-center gap-2 text-error text-sm bg-error/10 px-4 py-2.5 rounded-lg border border-error/20 mt-4">
                    <span>⚠</span>
                    <span>{rejoinError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRejoin}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-base"
                >
                  <ShieldCheck size={18} />
                  Rejoin Session
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Normal Join UI ─────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      <div className="orb orb-green w-64 h-64 top-10 -right-10" />
      <div className="orb orb-blue w-80 h-80 -bottom-20 -left-16" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-gradient-to-br from-cyber-green/20 to-accent-500/20 border border-cyber-green/20">
            <GraduationCap size={28} className="text-cyber-green" />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Join{' '}
            <span className="bg-gradient-to-r from-cyber-green to-accent-400 bg-clip-text text-transparent">
              Session
            </span>
          </h1>
          <p className="text-slate-400">
            Enter your details and the code from your teacher
          </p>
        </div>

        {/* Session info banner */}
        {classData && (
          <div className="glass-light p-4 mb-6 flex items-center gap-3 animate-slide-up">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent-500/15">
              <Sparkles size={18} className="text-accent-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">
                {classData.title}
              </p>
              <p className="text-xs text-slate-400">
                Code:{' '}
                <span className="text-accent-400 font-mono font-bold tracking-wider">
                  {classData.sessionCode}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="glass p-6 sm:p-8 animate-slide-up">
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <User size={14} className="text-cyber-green" />
                Full Name
              </label>
              <input
                type="text"
                className="input-dark"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearError();
                }}
                autoFocus
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <IdCard size={14} className="text-cyber-purple" />
                Student ID
              </label>
              <input
                type="text"
                className="input-dark"
                placeholder="e.g. STU-2024-0042"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  clearError();
                }}
              />
            </div>

            {/* Session Code */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Hash size={14} className="text-accent-400" />
                Session Code
              </label>
              <input
                type="text"
                className="input-dark tracking-[0.3em] text-center uppercase font-mono font-bold text-lg"
                placeholder="XK92PL"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  clearError();
                }}
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-error text-sm bg-error/10 px-4 py-2.5 rounded-lg border border-error/20">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Join Button */}
          <button
            type="button"
            onClick={handleJoin}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-2 text-base"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
            }}
          >
            <LogIn size={18} />
            Join Session
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Token note */}
        <p className="text-[11px] text-slate-600 text-center mt-4 px-6 leading-relaxed">
          A unique session token will be generated using your Student ID.
          Keep your Student ID handy in case you need to rejoin.
        </p>
      </div>
    </div>
  );
}
