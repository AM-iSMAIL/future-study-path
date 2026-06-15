import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TeacherSetup from './components/TeacherSetup';
import StudentJoin from './components/StudentJoin';
import WaitingRoom from './components/WaitingRoom';
import Classroom from './components/Classroom';
import Quiz from './components/Quiz';
import Results from './components/Results';
import { Flame } from 'lucide-react';

const INITIAL_TOKENS = [
  {
    studentId: 'STU-2026-0811',
    fullName: 'Priya Sharma',
    sessionToken: 'STU-2026-0811_mock',
    strikeCount: 0,
    scores: [null, null, null, null, null, null]
  },
  {
    studentId: 'STU-2026-1049',
    fullName: 'Alex Carter',
    sessionToken: 'STU-2026-1049_mock',
    strikeCount: 0,
    scores: [null, null, null, null, null, null]
  }
];

function App() {
  const [currentScreen, setCurrentScreen] = useState('teacher-setup');
  const [classData, setClassData] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [sessionTokens, setSessionTokens] = useState(INITIAL_TOKENS);
  const [sessionLocked, setSessionLocked] = useState(false);
  
  // Topic Coordination, API Key, and Strikes tracking
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('classai_gemini_api_key') || '');
  const [unsplashClientId, setUnsplashClientId] = useState(() => localStorage.getItem('classai_unsplash_client_id') || '');
  const [strikeCount, setStrikeCount] = useState(0);
  const [accumulatedQuizResults, setAccumulatedQuizResults] = useState({
    score: 0,
    total: 0,
    answers: []
  });

  const navigate = (screen) => setCurrentScreen(screen);

  const handleStudentJoin = (info) => {
    const token = info.studentId + '_' + Date.now();
    const enrichedInfo = { 
      ...info, 
      sessionToken: token,
      strikeCount: 0,
      scores: [null, null, null, null, null, null]
    };
    setStudentInfo(enrichedInfo);
    setSessionTokens((prev) => [...prev, enrichedInfo]);
  };

  const handleRejoin = (studentId) => {
    const found = sessionTokens.find((t) => t.studentId === studentId);
    if (found) {
      setStudentInfo(found);
      setStrikeCount(found.strikeCount || 0); // Restore their strikes
      return true;
    }
    return false;
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('classai_gemini_api_key', newKey);
  };

  const handleSaveUnsplashClientId = (newId) => {
    setUnsplashClientId(newId);
    localStorage.setItem('classai_unsplash_client_id', newId);
  };

  const handleQuizResults = (results) => {
    const isStrike = results.score === 0;
    const newStrikeVal = isStrike ? strikeCount + 1 : strikeCount;

    // 1. Update active student info
    setStudentInfo((prev) => {
      if (!prev) return null;
      const nextScores = [...(prev.scores || [null, null, null, null, null, null])];
      nextScores[currentTopicIndex] = results.score;
      return {
        ...prev,
        strikeCount: newStrikeVal,
        scores: nextScores
      };
    });

    setStrikeCount(newStrikeVal);

    // 2. Simulate mock student scores for this quiz
    const priyaScore = Math.floor(Math.random() * 2) + 2; // Priya: 2 or 3
    const alexScore = Math.floor(Math.random() * 4);      // Alex: 0, 1, 2, or 3

    // 3. Keep database (sessionTokens) synced
    setSessionTokens((prev) =>
      prev.map((tok) => {
        // Active student
        if (studentInfo && tok.studentId === studentInfo.studentId) {
          const nextScores = [...(tok.scores || [null, null, null, null, null, null])];
          nextScores[currentTopicIndex] = results.score;
          return {
            ...tok,
            strikeCount: newStrikeVal,
            scores: nextScores
          };
        }
        // Mock Priya
        if (tok.studentId === 'STU-2026-0811') {
          const nextScores = [...(tok.scores || [null, null, null, null, null, null])];
          nextScores[currentTopicIndex] = priyaScore;
          const isPriyaStrike = priyaScore === 0;
          return {
            ...tok,
            scores: nextScores,
            strikeCount: isPriyaStrike ? tok.strikeCount + 1 : tok.strikeCount
          };
        }
        // Mock Alex
        if (tok.studentId === 'STU-2026-1049') {
          const nextScores = [...(tok.scores || [null, null, null, null, null, null])];
          nextScores[currentTopicIndex] = alexScore;
          const isAlexStrike = alexScore === 0;
          return {
            ...tok,
            scores: nextScores,
            strikeCount: isAlexStrike ? tok.strikeCount + 1 : tok.strikeCount
          };
        }
        return tok;
      })
    );

    // 4. Update overall statistics
    setAccumulatedQuizResults((prev) => ({
      score: prev.score + results.score,
      total: prev.total + results.total,
      answers: [...prev.answers, ...results.answers],
    }));
  };

  const handleQuizNext = () => {
    const totalTopics = classData?.topics?.length || 6;
    if (currentTopicIndex < totalTopics - 1) {
      setCurrentTopicIndex((prev) => prev + 1);
      setCurrentScreen('classroom');
    } else {
      setCurrentScreen('results');
    }
  };

  const handleRestart = () => {
    setCurrentScreen('teacher-setup');
    setClassData(null);
    setStudentInfo(null);
    setSessionTokens(INITIAL_TOKENS);
    setSessionLocked(false);
    setCurrentTopicIndex(0);
    setStrikeCount(0);
    setAccumulatedQuizResults({
      score: 0,
      total: 0,
      answers: []
    });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'teacher-setup':
        return (
          <TeacherSetup
            onNext={() => navigate('student-join')}
            onClassData={setClassData}
          />
        );
      case 'student-join':
        return (
          <StudentJoin
            onNext={() => {
              if (sessionLocked) {
                // If session is locked mid-class, drop student back into the classroom
                setCurrentScreen('classroom');
              } else {
                setCurrentScreen('waiting-room');
              }
            }}
            classData={classData}
            sessionLocked={sessionLocked}
            onStudentJoin={handleStudentJoin}
            onRejoin={handleRejoin}
          />
        );
      case 'waiting-room':
        return (
          <WaitingRoom
            onNext={() => navigate('classroom')}
            classData={classData}
            studentInfo={studentInfo}
            onSessionLock={() => setSessionLocked(true)}
          />
        );
      case 'classroom':
        return (
          <Classroom
            key={currentTopicIndex}
            currentTopicIndex={currentTopicIndex}
            classData={classData}
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            unsplashClientId={unsplashClientId}
            onSaveUnsplashClientId={handleSaveUnsplashClientId}
            onNext={() => navigate('quiz')}
          />
        );
      case 'quiz':
        return (
          <Quiz
            key={currentTopicIndex}
            currentTopicIndex={currentTopicIndex}
            topicName={classData?.topics?.[currentTopicIndex] || 'Selected Topic'}
            apiKey={apiKey}
            onNext={handleQuizNext}
            onQuizResults={handleQuizResults}
          />
        );
      case 'results':
        return (
          <Results
            classData={classData}
            quizResults={accumulatedQuizResults}
            strikeCount={strikeCount}
            sessionTokens={sessionTokens}
            onRestart={handleRestart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Animated background grid */}
      <div className="bg-grid" />

      {/* Main app */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          currentScreen={currentScreen} 
          onNavigate={navigate} 
          studentInfo={studentInfo}
          strikeCount={strikeCount}
          classData={classData}
        />
        <main className="flex-1 flex flex-col relative">
          <div key={currentScreen} className="flex-1 flex flex-col animate-fade-in">
            {renderScreen()}
          </div>
        </main>
      </div>

      {/* Persistent strikes absent modal overlay */}
      {studentInfo && studentInfo.strikeCount >= 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass p-8 max-w-sm w-full text-center relative z-10 animate-slide-up border border-error/20">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-error/15 border border-error/25">
              <Flame size={26} className="text-error fill-error animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-display">
              Absent Notice
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              You have been marked absent. Your session has ended.
            </p>
            <button
              type="button"
              onClick={() => {
                // Remove student details and return to login screen
                setStudentInfo(null);
                setCurrentScreen('student-join');
              }}
              className="btn-primary w-full bg-gradient-to-r from-error to-cyber-pink hover:scale-105 border-none cursor-pointer font-bold text-sm py-2.5 rounded-xl shadow-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
