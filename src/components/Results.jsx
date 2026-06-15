import {
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Flame,
  RotateCcw,
  Sparkles,
  BarChart3,
  Award,
  BookOpen,
} from 'lucide-react';

export default function Results({
  classData,
  quizResults,
  strikeCount = 0,
  sessionTokens = [],
  onRestart,
}) {
  const getStudentStats = (tok) => {
    const scores = tok.scores || [null, null, null, null, null, null];
    const totalScore = scores.reduce((sum, s) => sum + (s || 0), 0);
    const validQuizzes = scores.filter((s) => s !== null && s > 0).length;
    const strikes = tok.strikeCount || 0;

    // Present = attended at least 4 of 6 quizzes with score > 0
    // Absent = 3 or more strikes
    const isPresent = validQuizzes >= 4 && strikes < 3;
    const status = isPresent ? 'Present' : 'Absent';

    return {
      totalScore,
      isPresent,
      status,
      strikes,
      scores,
    };
  };

  const studentRows = sessionTokens.map((tok) => {
    const stats = getStudentStats(tok);
    return {
      ...tok,
      ...stats,
    };
  });

  const presentCount = studentRows.filter((r) => r.isPresent).length;
  const absentCount = studentRows.filter((r) => !r.isPresent).length;

  // Calculate average class score out of 18 (6 quizzes * 3 marks max)
  const averageClassScore =
    studentRows.length > 0
      ? (
          studentRows.reduce((sum, r) => sum + r.totalScore, 0) /
          studentRows.length
        ).toFixed(1)
      : '0.0';

  const downloadReport = () => {
    const csvHeaders = [
      'Student Name',
      'Student ID',
      'Quiz 1',
      'Quiz 2',
      'Quiz 3',
      'Quiz 4',
      'Quiz 5',
      'Quiz 6',
      'Total Score',
      'Strikes',
      'Attendance Status',
    ];

    const csvRows = studentRows.map((r) => [
      r.fullName,
      r.studentId,
      r.scores[0] !== null ? r.scores[0] : '-',
      r.scores[1] !== null ? r.scores[1] : '-',
      r.scores[2] !== null ? r.scores[2] : '-',
      r.scores[3] !== null ? r.scores[3] : '-',
      r.scores[4] !== null ? r.scores[4] : '-',
      r.scores[5] !== null ? r.scores[5] : '-',
      r.totalScore,
      r.strikes,
      r.status,
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${classData?.title || 'ClassAI'}_Attendance_Report_${
        classData?.sessionCode || 'Code'
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 px-4 sm:px-6 py-8 relative overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="orb orb-green w-80 h-80 -top-20 right-0" />
      <div className="orb orb-purple w-64 h-64 bottom-0 -left-10" />

      <div className="relative z-10 stagger space-y-8">
        {/* Header */}
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-medium mb-4">
            <Award size={14} />
            <span>Educator Panel — Final Summary</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {classData?.title || 'ClassAI Session'}
          </h1>
          <p className="text-slate-400 text-sm font-mono">
            Session Code: {classData?.sessionCode} • 6 Topics Complete
          </p>
        </div>

        {/* Educator Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <div className="glass p-5 flex items-center justify-between border-l-4 border-l-success">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                Students Present
              </span>
              <span className="text-3xl font-extrabold text-white font-display mt-1 block">
                {presentCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="glass p-5 flex items-center justify-between border-l-4 border-l-error">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                Students Absent
              </span>
              <span className="text-3xl font-extrabold text-white font-display mt-1 block">
                {absentCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error">
              <XCircle size={22} />
            </div>
          </div>

          <div className="glass p-5 flex items-center justify-between border-l-4 border-l-accent-500">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                Class Average
              </span>
              <span className="text-3xl font-extrabold text-white font-display mt-1 block font-mono">
                {averageClassScore} <span className="text-xs text-slate-400 font-sans">/ 18</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400">
              <BarChart3 size={22} />
            </div>
          </div>
        </div>

        {/* Attendance & Score Breakdown Table */}
        <div className="glass p-6 animate-slide-up border border-white/5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-cyber-purple" />
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide">
                Attendance & Performance Log
              </h2>
            </div>
            
            {/* Status Summary Banner */}
            <div className="text-xs text-slate-400 font-mono bg-navy-950 border border-white/5 px-3 py-1.5 rounded-lg">
              Class Summary: <span className="text-success font-bold">{presentCount} Present</span>,{' '}
              <span className="text-error font-bold">{absentCount} Absent</span>
            </div>
          </div>

          {/* Table Container (Swipeable on mobile) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono bg-white/2">
                  <th className="py-3.5 px-4 rounded-tl-xl">Student Name</th>
                  <th className="py-3.5 px-3">Student ID</th>
                  <th className="py-3.5 px-2 text-center">Q1</th>
                  <th className="py-3.5 px-2 text-center">Q2</th>
                  <th className="py-3.5 px-2 text-center">Q3</th>
                  <th className="py-3.5 px-2 text-center">Q4</th>
                  <th className="py-3.5 px-2 text-center">Q5</th>
                  <th className="py-3.5 px-2 text-center">Q6</th>
                  <th className="py-3.5 px-3 text-center">Total</th>
                  <th className="py-3.5 px-4 text-center rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {studentRows.map((row, idx) => {
                  const isUser = tok => tok.studentId === row.studentId && tok.sessionToken && !tok.sessionToken.includes('_mock');
                  const isActiveUser = isUser(row);
                  
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-white/2 transition-colors duration-150 ${
                        isActiveUser ? 'bg-accent-500/5' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-4 px-4 font-semibold text-white truncate max-w-[150px]">
                        <div className="flex items-center gap-1.5">
                          {row.fullName}
                          {isActiveUser && (
                            <span className="bg-accent-500/10 border border-accent-500/20 text-accent-400 text-[8px] px-1 py-0.5 rounded font-mono font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-4 px-3 font-mono text-xs text-slate-400">
                        {row.studentId}
                      </td>

                      {/* Quiz Scores */}
                      {row.scores.map((score, sIdx) => {
                        let scoreColor = 'text-slate-500';
                        if (score !== null) {
                          scoreColor =
                            score === 3
                              ? 'text-cyber-green font-bold'
                              : score > 0
                              ? 'text-slate-200'
                              : 'text-error font-bold';
                        }
                        return (
                          <td
                            key={sIdx}
                            className={`py-4 px-2 text-center font-mono text-xs ${scoreColor}`}
                          >
                            {score !== null ? score : '-'}
                          </td>
                        );
                      })}

                      {/* Total Score */}
                      <td className="py-4 px-3 text-center font-mono font-bold text-white">
                        {row.totalScore} <span className="text-[10px] text-slate-500 font-normal">/18</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                            row.isPresent
                              ? 'bg-success/15 border-success/30 text-success'
                              : 'bg-error/15 border-error/30 text-error animate-pulse'
                          }`}
                        >
                          {row.isPresent ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <Flame size={11} className="fill-error" />
                          )}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {studentRows.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm font-medium">
              No students recorded in this session.
            </div>
          )}
        </div>

        {/* Dashboard Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 animate-slide-up">
          <button
            type="button"
            onClick={downloadReport}
            disabled={studentRows.length === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-base !py-4 shadow-lg glow-accent disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed border-none"
          >
            <Download size={18} />
            Download Report (CSV)
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-base !py-4"
          >
            <RotateCcw size={18} />
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}
