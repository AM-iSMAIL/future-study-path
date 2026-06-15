import { useState } from 'react';
import {
  Zap,
  BookOpen,
  Clock,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Eye,
  Share2,
  GraduationCap,
  Hash,
} from 'lucide-react';

export default function TeacherSetup({ onNext, onClassData }) {
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState(['', '', '', '', '', '']);
  const [duration, setDuration] = useState(10);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTopicChange = (index, value) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreate = () => {
    const code = generateCode();
    setSessionCode(code);

    const sessionData = {
      sessionCode: code,
      title: title.trim(),
      topics: topics.map((t) => t.trim()),
      duration,
    };

    onClassData(sessionData);
    setSessionCreated(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValid =
    title.trim().length > 0 &&
    topics.every((t) => t.trim().length > 0);

  // ─── Post-creation: show session code ───────────────────
  if (sessionCreated) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="orb orb-green w-80 h-80 -top-24 -right-16" />
        <div className="orb orb-purple w-72 h-72 -bottom-20 -left-12" />

        <div className="w-full max-w-lg relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-gradient-to-br from-cyber-green/20 to-accent-500/20 border border-cyber-green/20">
              <Check size={30} className="text-cyber-green" />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Session{' '}
              <span className="bg-gradient-to-r from-cyber-green to-accent-400 bg-clip-text text-transparent">
                Created!
              </span>
            </h1>
            <p className="text-slate-400">
              Share the code below with your students
            </p>
          </div>

          {/* Session Code Card */}
          <div className="glass p-8 text-center mb-6 animate-slide-up gradient-border">
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-4">
              Session Code
            </p>
            <div
              className="text-5xl sm:text-6xl font-bold tracking-[0.35em] text-white mb-5 glow-text"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {sessionCode}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer border-none bg-accent-500/15 text-accent-300 hover:bg-accent-500/25"
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy Code
                </>
              )}
            </button>
          </div>

          {/* Session Summary */}
          <div className="glass-light p-5 mb-6 animate-slide-up">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Sparkles size={14} className="text-accent-400" />
              Session Details
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Title</span>
                <span className="text-white font-medium">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Topics</span>
                <span className="text-white font-medium">6 topics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration per topic</span>
                <span className="text-white font-medium">{duration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total duration</span>
                <span className="text-accent-400 font-bold">{duration * 6} min</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 animate-slide-up">
            <button
              type="button"
              onClick={onNext}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              <Eye size={18} />
              View as Teacher
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="btn-secondary w-full flex items-center justify-center gap-2.5 text-base"
            >
              <Share2 size={17} />
              <span>
                Share Join Link:{' '}
                <span className="font-mono font-bold text-accent-300 tracking-wider">
                  {sessionCode}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Creation form ──────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
      {/* Decorative orbs */}
      <div className="orb orb-blue w-72 h-72 -top-20 -left-20" />
      <div className="orb orb-purple w-96 h-96 -bottom-32 -right-20" />

      <div className="w-full max-w-lg relative z-10 stagger">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-medium mb-5">
            <Sparkles size={14} />
            <span>AI-Powered Classroom</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Create Your{' '}
            <span className="bg-gradient-to-r from-accent-400 to-cyber-purple bg-clip-text text-transparent">
              Session
            </span>
          </h1>
          <p className="text-slate-400 text-base">
            Set up your topics and invite students to join
          </p>
        </div>

        {/* Form Card */}
        <div className="glass p-6 sm:p-8 animate-slide-up">
          <div className="space-y-6">
            {/* Quick Demo Preload */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTitle("Introduction to Machine Learning");
                  setTopics([
                    "Neural Networks",
                    "Supervised Learning",
                    "Unsupervised Learning",
                    "Decision Trees",
                    "Overfitting",
                    "Model Evaluation"
                  ]);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accent-500/10 border border-accent-500/25 hover:bg-accent-500/20 text-accent-300 transition-all duration-200 cursor-pointer flex items-center gap-1.5 border-none"
              >
                <Sparkles size={13} className="text-accent-400" />
                Load Demo
              </button>
            </div>

            {/* Session Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <GraduationCap size={14} className="text-accent-400" />
                Session Title
              </label>
              <input
                type="text"
                className="input-dark"
                placeholder="e.g. AP Physics — Forces & Motion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* 6 Topic Inputs */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <BookOpen size={14} className="text-cyber-purple" />
                Topics (6 required)
              </label>
              <div className="space-y-2.5">
                {topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-navy-700 text-slate-400 shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      className="input-dark"
                      placeholder={`Topic ${idx + 1}`}
                      value={topic}
                      onChange={(e) => handleTopicChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Duration per topic */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Clock size={14} className="text-cyber-green" />
                Duration per Topic (minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-navy-700
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-accent-500
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,118,255,0.5)]
                    [&::-webkit-slider-thumb]:cursor-pointer
                  "
                />
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-700 min-w-[72px] justify-center">
                  <span className="text-white font-bold font-mono text-sm">
                    {duration}
                  </span>
                  <span className="text-slate-500 text-xs">min</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Total session time:{' '}
                <span className="text-accent-400 font-semibold">
                  {duration * 6} minutes
                </span>
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!isValid}
            className={`
              btn-primary w-full mt-8 flex items-center justify-center gap-2
              text-base
              ${!isValid ? 'opacity-40 cursor-not-allowed !transform-none' : ''}
            `}
          >
            <Zap size={18} />
            Create Session
            <ChevronRight size={18} />
          </button>

          {/* Validation hint */}
          {!isValid && (title.length > 0 || topics.some((t) => t.length > 0)) && (
            <p className="text-xs text-slate-500 text-center mt-3">
              Fill in the session title and all 6 topics to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
