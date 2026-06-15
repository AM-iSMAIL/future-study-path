import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Key,
  Check,
  ChevronRight,
  BookOpen,
  Clock,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Image,
} from 'lucide-react';

// Fallback high-quality lecture generator if Gemini API key is missing or fails
const getFallbackLecture = (topic) => {
  return [
    `Welcome to our session on "${topic}". In undergraduate studies, understanding the foundational principles of this subject is essential for analyzing more complex systems. Today, we will explore the core concepts step-by-step to build a robust mental model.`,
    `First, let's look at the primary definitions and mechanics. "${topic}" operates under key rules and parameters that describe how variables interact. By breaking down the active forces or parameters, we can predict behaviors and calculate outcomes under various constraints.`,
    `Next, we observe how this concept applies in real-world environments. Theoretical models often assume ideal conditions, but in practice, factors like resistance, external variables, or systemic errors affect the system. Understanding these variances is crucial for practical engineering and research.`,
    `Finally, let's synthesize these ideas. By connecting the mathematical foundations with empirical observations, we can solve complex analytical problems. As we transition to the topic evaluation, keep in mind how these relationships apply to different scenarios.`
  ];
};

// Robust paragraph parser for Gemini response text
const parseParagraphs = (rawText) => {
  // Try splitting by double newlines first
  let parts = rawText
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  
  if (parts.length < 4) {
    // Try single newlines
    parts = rawText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  
  // Strip common markdown blockquote signs, asterisks, etc.
  parts = parts.map(p => p.replace(/^>\s*/, '').replace(/\*\*?/g, '').trim());

  // Pad to 4 elements if short
  while (parts.length < 4) {
    parts.push("Continuing with our analysis of the topic dynamics and related engineering structures.");
  }
  
  return parts.slice(0, 4);
};

// Smart keyword extraction utility
const extractKeywords = (name) => {
  const stopwords = new Set([
    'of', 'and', 'the', 'in', 'a', 'to', 'for', 'on', 'is', 'at', 'by', 'with',
    'about', 'from', 'an', 'law', 'laws', 'theory', 'concept', 'introduction',
    'topic', 'topics', 'basic', 'basics', 'advanced', 'principles', 'understanding'
  ]);
  
  const clean = name.toLowerCase().replace(/[^\w\s]/g, '');
  const words = clean.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
  
  const keywords = [];
  for (const w of words) {
    if (keywords.length < 2 && !keywords.includes(w)) {
      keywords.push(w);
    }
  }
  
  // fallback if less than 2
  const fallbackWords = name.split(/\s+/).filter(w => w.length > 1);
  for (const w of fallbackWords) {
    const lw = w.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (keywords.length < 2 && !keywords.includes(lw) && lw.length > 1 && !stopwords.has(lw)) {
      keywords.push(lw);
    }
  }
  
  while (keywords.length < 2) {
    keywords.push(keywords.length === 0 ? 'science' : 'education');
  }
  
  return keywords;
};

export default function Classroom({
  onNext,
  classData,
  apiKey,
  onSaveApiKey,
  unsplashClientId,
  onSaveUnsplashClientId,
  currentTopicIndex = 0,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
  
  // Keywords & Unsplash Image state
  const [keywords, setKeywords] = useState([]);
  const [unsplashImages, setUnsplashImages] = useState([null, null]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  
  // Playback state
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [startedTeaching, setStartedTeaching] = useState(false);
  
  // Topic timer state
  const [timeLeft, setTimeLeft] = useState((classData?.duration || 10) * 60);
  
  // Key configuration panel
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [unsplashInput, setUnsplashInput] = useState(unsplashClientId || '');
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Topic transition sequence
  const [topicComplete, setTopicComplete] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(3);
  
  const utteranceRef = useRef(null);

  const topicName = classData?.topics?.[currentTopicIndex] || 'Selected Topic';
  const totalTopics = classData?.topics?.length || 6;

  // 1. Fetch lecture content from Gemini or use fallback
  useEffect(() => {
    let active = true;
    const fetchContent = async (canRetry = true) => {
      setLoading(true);
      setError(null);
      
      const promptText = `You are an AI teacher. Teach the following topic to undergraduate students in simple, clear language. Break it into 4 short paragraphs. Each paragraph should be one clear concept. Topic: ${topicName}. Return only the teaching content, no extra text.`;

      if (!apiKey) {
        setTimeout(() => {
          if (active) {
            setParagraphs(getFallbackLecture(topicName));
            setLoading(false);
          }
        }, 1200);
        return;
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: promptText,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Gemini API returned status ${response.status}. Please check your key.`
          );
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          throw new Error("Received empty content from Gemini API.");
        }

        if (active) {
          const parsed = parseParagraphs(text);
          setParagraphs(parsed);
          setLoading(false);
        }
      } catch (err) {
        console.error("Gemini load failed:", err);
        if (canRetry && active) {
          console.log("Retrying Gemini query once...");
          setTimeout(() => {
            if (active) {
              fetchContent(false);
            }
          }, 1000);
        } else {
          if (active) {
            setError(err.message || "Failed to contact Gemini API.");
            setParagraphs(getFallbackLecture(topicName));
            setLoading(false);
          }
        }
      }
    };

    fetchContent(true);

    return () => {
      active = false;
      window.speechSynthesis?.cancel();
    };
  }, [currentTopicIndex, apiKey, topicName]);

  // 2. Extract keywords and fetch images from Unsplash on start of topic
  useEffect(() => {
    const extracted = extractKeywords(topicName);
    setKeywords(extracted);
    
    let active = true;
    const fetchImages = async () => {
      setUnsplashLoading(true);
      const newImages = [null, null];
      
      if (!unsplashClientId) {
        if (active) {
          setUnsplashImages(newImages);
          setUnsplashLoading(false);
        }
        return;
      }
      
      // Parallel fetches for both extracted keywords
      await Promise.all(
        extracted.map(async (keyword, idx) => {
          try {
            const res = await fetch(
              `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
                keyword
              )}&per_page=1&client_id=${unsplashClientId}`
            );
            if (!res.ok) {
              throw new Error(`Unsplash status ${res.status}`);
            }
            const data = await res.json();
            const url = data?.results?.[0]?.urls?.regular;
            if (url) {
              newImages[idx] = url;
            }
          } catch (err) {
            console.warn(`Unsplash fetch failed for keyword "${keyword}":`, err);
            // newImages[idx] remains null (fallback placeholder box displays keyword)
          }
        })
      );
      
      if (active) {
        setUnsplashImages(newImages);
        setUnsplashLoading(false);
      }
    };
    
    fetchImages();
    return () => {
      active = false;
    };
  }, [topicName, unsplashClientId]);

  // 3. Count down current topic duration timer
  useEffect(() => {
    if (loading || topicComplete) return;
    if (timeLeft <= 0) {
      handleTopicComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, topicComplete]);

  // 4. Count down auto-transition after teaching completes
  useEffect(() => {
    if (!topicComplete) return;
    if (transitionCountdown <= 0) {
      onNext();
      return;
    }
    const timer = setTimeout(() => {
      setTransitionCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [topicComplete, transitionCountdown, onNext]);

  // 5. TTS speech controls
  const speakParagraph = (index) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any active speech
    window.speechSynthesis.cancel();

    if (index >= paragraphs.length) {
      // Completed all paragraphs for this topic
      handleTopicComplete();
      return;
    }

    setCurrentParagraphIndex(index);
    setStartedTeaching(true);
    setIsPlaying(true);

    if (isMuted) return; // Speech is synthesized, but muted locally

    const utterance = new SpeechSynthesisUtterance(paragraphs[index]);
    utteranceRef.current = utterance;

    // Pick an English voice
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    if (engVoice) {
      utterance.voice = engVoice;
    }

    utterance.rate = 0.95; // Slightly slower, academic pacing

    utterance.onend = () => {
      // Auto-advance to next paragraph
      speakParagraph(index + 1);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e);
      if (e.error !== 'interrupted') {
        // Skip ahead to avoid hanging tab
        setTimeout(() => {
          speakParagraph(index + 1);
        }, 3000);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (!startedTeaching) {
        speakParagraph(currentParagraphIndex);
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      speakParagraph(currentParagraphIndex);
    }
  };

  const handleNextParagraph = () => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      speakParagraph(currentParagraphIndex + 1);
    } else {
      handleTopicComplete();
    }
  };

  const handlePrevParagraph = () => {
    if (currentParagraphIndex > 0) {
      speakParagraph(currentParagraphIndex - 1);
    }
  };

  const handleReplayParagraph = () => {
    speakParagraph(currentParagraphIndex);
  };

  const handleTopicComplete = () => {
    window.speechSynthesis?.cancel();
    setTopicComplete(true);
    setIsPlaying(false);
  };

  // Helper formatting for class timer MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle saving API key in Classroom component
  const saveSettings = () => {
    onSaveApiKey(keyInput.trim());
    onSaveUnsplashClientId(unsplashInput.trim());
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowKeyPanel(false);
    }, 1200);
  };

  // Render dynamic photo illustration from Unsplash or placeholder
  const renderWhiteboardImage = () => {
    const activeIndex = currentParagraphIndex % 2;
    const keyword = keywords[activeIndex] || 'Concept';
    const imageUrl = unsplashImages[activeIndex];
    
    // Changing the key forces React to trigger the smooth fade-in animation
    const elementKey = `${currentParagraphIndex}_${imageUrl || 'placeholder'}`;

    if (unsplashLoading) {
      return (
        <div key={elementKey} className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 animate-pulse">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-1" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">{keyword}</span>
        </div>
      );
    }

    if (!imageUrl) {
      // Fallback grey box with keyword text inside
      return (
        <div key={elementKey} className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 animate-fade-in px-4 text-center">
          <Image className="w-6 h-6 mb-1 opacity-30 text-slate-500" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 block truncate max-w-full">
            {keyword}
          </span>
          <span className="text-[8px] text-slate-400 mt-0.5">Image Placeholder</span>
        </div>
      );
    }

    return (
      <img
        key={elementKey}
        src={imageUrl}
        alt={keyword}
        className="w-full h-full object-cover animate-fade-in"
        onError={() => {
          // If Unsplash URL fails to load, trigger fallback placeholder
          setUnsplashImages((prev) => {
            const updated = [...prev];
            updated[activeIndex] = null;
            return updated;
          });
        }}
      />
    );
  };

  // Dynamic schematic vector blueprints to display on the whiteboard
  const renderWhiteboardSchematic = () => {
    const indexKey = currentTopicIndex % 6;
    switch (indexKey) {
      case 0:
        return (
          <svg viewBox="0 0 400 160" className="w-full h-full stroke-accent-500 fill-none" strokeWidth="1.5">
            <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120 M 40 0 L 40 160 M 80 0 L 80 160 M 120 0 L 120 160 M 160 0 L 160 160 M 200 0 L 200 160 M 240 0 L 240 160 M 280 0 L 280 160 M 320 0 L 320 160 M 360 0 L 360 160" stroke="#f1f5f9" strokeWidth="0.5" />
            <line x1="200" y1="10" x2="200" y2="150" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1="80" x2="380" y2="80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="200" cy="80" r="10" className="fill-slate-100 text-slate-400" strokeWidth="1.5" />
            <line x1="200" y1="80" x2="280" y2="40" className="stroke-cyber-pink animate-pulse" strokeWidth="2" />
            <polygon points="280,40 272,39 277,47" className="fill-cyber-pink" />
            <text x="290" y="38" className="fill-cyber-pink font-mono text-[9px] font-bold">F1 = m·a</text>
            <line x1="200" y1="80" x2="120" y2="105" className="stroke-accent-500" strokeWidth="1.5" />
            <polygon points="120,105 129,103 124,111" className="fill-accent-500" />
            <text x="75" y="118" className="fill-accent-500 font-mono text-[9px] font-bold">Friction (F2)</text>
            <line x1="200" y1="80" x2="200" y2="140" className="stroke-cyber-purple" strokeWidth="1.5" />
            <polygon points="200,140 196,132 204,132" className="fill-cyber-purple" />
            <text x="210" y="135" className="fill-cyber-purple font-mono text-[9px] font-bold">Gravity (Fg)</text>
            <text x="220" y="73" className="fill-slate-400 font-mono text-[8px]">Angle θ = 30°</text>
          </svg>
        );
      case 1:
        return (
          <svg viewBox="0 0 400 160" className="w-full h-full stroke-cyber-purple fill-none" strokeWidth="1.5">
            <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120 M 40 0 L 40 160 M 80 0 L 80 160 M 120 0 L 120 160 M 160 0 L 160 160 M 200 0 L 200 160 M 240 0 L 240 160 M 280 0 L 280 160 M 320 0 L 320 160 M 360 0 L 360 160" stroke="#f1f5f9" strokeWidth="0.5" />
            <line x1="20" y1="80" x2="380" y2="80" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M 20 80 Q 110 10 200 80 T 380 80" className="stroke-accent-500" strokeWidth="2" />
            <path d="M 20 80 Q 65 45 110 80 T 200 80 T 290 80 T 380 80" className="stroke-cyber-pink" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="110" cy="80" r="3" className="fill-slate-400" />
            <circle cx="200" cy="80" r="3" className="fill-slate-400" />
            <circle cx="290" cy="80" r="3" className="fill-slate-400" />
            <text x="35" y="40" className="fill-accent-500 font-mono text-[9px] font-bold">Fundamental (f)</text>
            <text x="220" y="40" className="fill-cyber-pink font-mono text-[9px] font-bold">2nd Harmonic (2f)</text>
          </svg>
        );
      case 2:
        return (
          <svg viewBox="0 0 400 160" className="w-full h-full stroke-cyber-green fill-none" strokeWidth="1.5">
            <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120" stroke="#f1f5f9" strokeWidth="0.5" />
            <line x1="80" y1="80" x2="200" y2="40" stroke="#cbd5e1" />
            <line x1="80" y1="80" x2="200" y2="120" stroke="#cbd5e1" />
            <line x1="200" y1="40" x2="320" y2="80" stroke="#cbd5e1" />
            <line x1="200" y1="120" x2="320" y2="80" stroke="#cbd5e1" />
            <line x1="80" y1="80" x2="320" y2="80" stroke="#e2e8f0" strokeWidth="1.5" />
            <circle cx="80" cy="80" r="8" className="fill-accent-50 text-accent-500 animate-pulse" strokeWidth="2" />
            <text x="65" y="65" className="fill-accent-500 font-mono text-[9px] font-bold">Input A</text>
            <circle cx="200" cy="40" r="8" className="fill-cyber-purple/10 text-cyber-purple" strokeWidth="2" />
            <text x="185" y="25" className="fill-cyber-purple font-mono text-[9px] font-bold">Node B</text>
            <circle cx="200" cy="120" r="8" className="fill-cyber-pink/10 text-cyber-pink" strokeWidth="2" />
            <text x="185" y="140" className="fill-cyber-pink font-mono text-[9px] font-bold">Node C</text>
            <circle cx="320" cy="80" r="8" className="fill-cyber-green/10 text-cyber-green" strokeWidth="2" />
            <text x="310" y="65" className="fill-cyber-green font-mono text-[9px] font-bold">Output Y</text>
          </svg>
        );
      case 3:
        return (
          <svg viewBox="0 0 400 160" className="w-full h-full stroke-cyber-orange fill-none" strokeWidth="1.5">
            <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120" stroke="#f1f5f9" strokeWidth="0.5" />
            <rect x="130" y="30" width="140" height="100" stroke="#94a3b8" strokeWidth="2" rx="3" />
            <line x1="200" y1="31" x2="200" y2="129" stroke="#cbd5e1" strokeWidth="3" />
            <line x1="160" y1="80" x2="240" y2="80" className="stroke-accent-500" strokeWidth="2" />
            <polygon points="240,80 232,76 232,84" className="fill-accent-500" />
            <polygon points="160,80 168,76 168,84" className="fill-accent-500" />
            <circle cx="150" cy="50" r="2.5" className="fill-cyber-pink text-none" />
            <circle cx="160" cy="100" r="2.5" className="fill-cyber-pink text-none" />
            <circle cx="180" cy="70" r="2.5" className="fill-cyber-pink text-none" />
            <circle cx="220" cy="60" r="2.5" className="fill-cyber-orange text-none" />
            <circle cx="240" cy="90" r="2.5" className="fill-cyber-orange text-none" />
            <circle cx="250" cy="50" r="2.5" className="fill-cyber-orange text-none" />
            <text x="140" y="24" className="fill-slate-500 font-mono text-[8px]">Gas State 1</text>
            <text x="210" y="24" className="fill-slate-500 font-mono text-[8px]">Gas State 2</text>
          </svg>
        );
      case 4:
        return (
          <svg viewBox="0 0 400 160" className="w-full h-full stroke-accent-500 fill-none" strokeWidth="1.5">
            <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120" stroke="#f1f5f9" strokeWidth="0.5" />
            <polygon points="200,30 150,130 250,130" stroke="#94a3b8" strokeWidth="1.5" className="fill-slate-100/10" />
            <line x1="60" y1="100" x2="175" y2="78" stroke="#64748b" strokeWidth="2" />
            <line x1="175" y1="78" x2="225" y2="90" stroke="#ef4444" strokeWidth="1.2" />
            <line x1="225" y1="90" x2="340" y2="110" stroke="#ef4444" strokeWidth="1.2" />
            <line x1="175" y1="78" x2="222" y2="94" stroke="#10b981" strokeWidth="1.2" />
            <line x1="222" y1="94" x2="340" y2="124" stroke="#10b981" strokeWidth="1.2" />
            <line x1="175" y1="78" x2="220" y2="98" stroke="#3b76ff" strokeWidth="1.2" />
            <line x1="220" y1="98" x2="340" y2="138" stroke="#3b76ff" strokeWidth="1.2" />
            <text x="70" y="115" className="fill-slate-500 font-mono text-[8px]">Incident Light</text>
            <text x="240" y="70" className="fill-slate-500 font-mono text-[8px] font-bold">Dispersion Prism</text>
          </svg>
        );
      case 5:
        return (
          <svg viewBox="0 0 400 160" className="w-full h-full stroke-accent-400 fill-none" strokeWidth="1.5">
            <path d="M 0 40 L 400 40 M 0 80 L 400 80 M 0 120 L 400 120" stroke="#f1f5f9" strokeWidth="0.5" />
            <path d="M 60 80 Q 155 80 200 115 T 340 80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="200" cy="80" r="16" className="fill-slate-100/90 stroke-slate-400 animate-pulse" strokeWidth="2" />
            <circle cx="200" cy="80" r="4" className="fill-accent-500" />
            <ellipse cx="200" cy="80" rx="50" ry="15" stroke="#94a3b8" strokeDasharray="3 3" transform="rotate(-10 200 80)" />
            <circle cx="240" cy="73" r="3.5" className="fill-cyber-pink" />
            <text x="215" y="58" className="fill-slate-500 font-mono text-[8px] font-bold">Mass M</text>
            <text x="115" y="135" className="fill-slate-400 font-mono text-[8px]">Gravitational Well</text>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="orb orb-blue w-80 h-80 -top-20 -left-20" />
      <div className="orb orb-purple w-80 h-80 bottom-0 -right-20" />

      {/* Classroom Header / Nav */}
      <div className="glass-light border-b border-white/5 px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-sm font-semibold text-white tracking-wide">
            {classData?.title || 'ClassAI Room'}
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs font-mono font-medium text-accent-300">
            Session: {classData?.sessionCode}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Collapsible Key configuration panel */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowKeyPanel(!showKeyPanel)}
              className={`p-2 rounded-lg transition-all duration-300 cursor-pointer flex items-center gap-1.5 border-none text-xs font-medium ${
                apiKey 
                  ? 'bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20' 
                  : 'bg-warning/10 text-warning hover:bg-warning/20'
              }`}
            >
              <Key size={14} />
              <span className="hidden sm:inline">
                {apiKey ? 'API Connected' : 'Offline Mode (Setup Key)'}
              </span>
            </button>
            
            {showKeyPanel && (
              <div className="absolute right-0 mt-2 w-80 p-4 rounded-xl glass border border-white/10 shadow-2xl z-50 animate-slide-up">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5 font-display">
                  <Sparkles size={14} className="text-accent-400" />
                  ClassAI API Settings
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Enter your keys to query live lectures and fetch relevant topic images.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      className="input-dark !py-2 !text-xs"
                      placeholder="AIzaSy..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                      Unsplash Client ID
                    </label>
                    <input
                      type="password"
                      className="input-dark !py-2 !text-xs"
                      placeholder="Unsplash Access Key"
                      value={unsplashInput}
                      onChange={(e) => setUnsplashInput(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowKeyPanel(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-400 hover:text-white border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveSettings}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-500 hover:bg-accent-600 text-white border-none cursor-pointer flex items-center gap-1"
                    >
                      {settingsSaved ? <Check size={12} /> : null}
                      {settingsSaved ? 'Saved!' : 'Save Keys'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex flex-col md:flex-row px-4 sm:px-6 py-6 gap-6 relative z-10 overflow-hidden">
        {/* Left Side (70% width): Whiteboard */}
        <div className="flex-1 md:flex-[7] flex flex-col justify-between">
          <div className="bg-white text-slate-900 border-2 border-slate-200 shadow-2xl rounded-2xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 h-[500px] md:h-[530px]">
            {/* Whiteboard Grid lines overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-accent-500 animate-spin mb-4" />
                <h2 className="text-slate-800 font-bold text-lg animate-pulse">
                  AI is loading...
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 font-mono">
                  {apiKey ? 'Contacting Live Gemini API' : 'Generating offline curriculum'}
                </p>
              </div>
            ) : topicComplete ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 animate-slide-up">
                <div className="w-20 h-20 rounded-full bg-cyber-green/10 flex items-center justify-center border border-cyber-green/20 mb-6">
                  <Check size={40} className="text-success" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                  Topic Complete!
                </h1>
                <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                  Excellent work listening to this topic. Transitioning to evaluation quiz dynamically.
                </p>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 font-mono">
                  <Clock size={14} className="text-accent-500 animate-spin" />
                  SWITCHING IN {transitionCountdown} SECONDS...
                </div>
              </div>
            ) : !startedTeaching ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 animate-slide-up px-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-6">
                  <BookOpen size={30} className="text-accent-500" />
                </div>
                <span className="text-xs font-bold text-accent-500 uppercase tracking-widest mb-1.5 font-mono">
                  Topic {currentTopicIndex + 1} of {totalTopics}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
                  {topicName}
                </h2>
                <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">
                  The AI teacher has formulated a 4-paragraph teaching content for this topic. Click begin to play audio narration and trace formulas on the blackboard.
                </p>
                <button
                  type="button"
                  onClick={() => speakParagraph(0)}
                  className="btn-primary flex items-center justify-center gap-2 text-base !px-8 !py-3.5 glow-accent"
                >
                  <Play size={18} fill="white" />
                  Begin Lesson
                </button>
                {!apiKey && (
                  <p className="text-[10px] text-warning flex items-center gap-1 mt-4">
                    <AlertTriangle size={10} />
                    Running in offline mode. Setup Gemini Key in header for live API responses.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between relative z-10">
                {/* Whiteboard Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold font-mono">
                    <Lightbulb size={13} className="text-accent-500" />
                    LECTURE MODULE
                  </div>
                  <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] font-mono">
                    PARAGRAPH {currentParagraphIndex + 1} / 4
                  </span>
                </div>

                {/* Whiteboard content area (text + side assets) */}
                <div className="flex-1 py-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center overflow-y-auto">
                  {/* Text (7 of 12 columns) */}
                  <div className="md:col-span-7 flex flex-col justify-center h-full">
                    <p className="text-slate-800 text-base sm:text-lg md:text-xl font-medium leading-relaxed font-display tracking-wide border-l-4 border-accent-500 pl-4 py-2 transition-all duration-300">
                      {paragraphs[currentParagraphIndex]}
                    </p>
                  </div>
                  
                  {/* Visual and Schematic Side Panel (5 of 12 columns) */}
                  <div className="md:col-span-5 w-full flex flex-col gap-3 h-full justify-center">
                    
                    {/* SVG Schematic */}
                    <div className="flex-1 flex flex-col items-center justify-center border border-slate-200/60 bg-slate-50/50 rounded-xl p-2.5 shadow-inner">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5 block">
                        Visual Schematic
                      </span>
                      <div className="w-full flex items-center justify-center h-20 md:h-24">
                        {renderWhiteboardSchematic()}
                      </div>
                    </div>

                    {/* Unsplash Image Card */}
                    <div className="flex-1 flex flex-col items-center justify-center border border-slate-200/60 bg-slate-50/50 rounded-xl p-2.5 shadow-inner relative overflow-hidden">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5 block z-10">
                        Topic Illustration
                      </span>
                      
                      {/* Image render or placeholder */}
                      <div className="w-full flex-1 flex items-center justify-center relative rounded-lg overflow-hidden h-20 md:h-24 z-10">
                        {renderWhiteboardImage()}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Controls and Audio waveform feedback */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  {/* Waveform indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${isPlaying ? 'bg-accent-50' : 'bg-slate-100'}`}>
                      {isPlaying ? (
                        <div className="flex items-center gap-0.5 h-4 px-1">
                          <div className="w-0.5 h-3 bg-accent-500 rounded-full animate-pulse [animation-duration:0.6s]" />
                          <div className="w-0.5 h-4 bg-cyber-purple rounded-full animate-pulse [animation-duration:0.4s]" />
                          <div className="w-0.5 h-2.5 bg-accent-400 rounded-full animate-pulse [animation-duration:0.7s]" />
                          <div className="w-0.5 h-4 bg-cyber-pink rounded-full animate-pulse [animation-duration:0.5s]" />
                        </div>
                      ) : (
                        <VolumeX size={14} className="text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      {isPlaying ? 'AI Voice Active' : 'Speaker Paused'}
                    </span>
                  </div>

                  {/* Playback action items */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevParagraph}
                      disabled={currentParagraphIndex === 0}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-all duration-200 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                      title="Previous Paragraph"
                    >
                      <SkipForward size={14} className="rotate-180" />
                    </button>

                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-500 text-white hover:scale-105 transition-all duration-200 shadow-md border-none cursor-pointer"
                      title={isPlaying ? 'Pause Speech' : 'Play Speech'}
                    >
                      {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" className="ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleReplayParagraph}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                      title="Replay Paragraph"
                    >
                      <RotateCcw size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextParagraph}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                      title="Skip Paragraph"
                    >
                      <SkipForward size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={handleMuteToggle}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                        isMuted 
                          ? 'border-error/20 bg-error/5 text-error hover:bg-error/10' 
                          : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                      }`}
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aluminum dry-erase marker board tray */}
            <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-300 border-t border-slate-400 flex justify-center items-center shadow-inner select-none pointer-events-none">
              <div className="w-12 h-2 bg-blue-600 rounded-sm mx-1 shadow-sm opacity-90" />
              <div className="w-12 h-2 bg-red-600 rounded-sm mx-1 shadow-sm opacity-90" />
              <div className="w-12 h-2 bg-slate-800 rounded-sm mx-1 shadow-sm opacity-90" />
              <div className="w-10 h-3 bg-slate-100 border border-slate-400 rounded-sm mx-4 shadow-sm flex items-center justify-center text-[5px] text-slate-400 font-bold tracking-tighter">ERASER</div>
            </div>
          </div>
        </div>

        {/* Right Side (30% width): Topic Syllabus List */}
        <div className="w-full md:w-80 flex flex-col">
          <div className="glass p-5 flex-1 flex flex-col justify-between h-[500px] md:h-[530px]">
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2 pb-4 border-b border-white/5 mb-4">
                <BookOpen size={16} className="text-cyber-purple" />
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                  Class Syllabus
                </h3>
              </div>

              {/* Scrollable list of syllabus items */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                {classData?.topics?.map((topic, idx) => {
                  const isActive = idx === currentTopicIndex;
                  const isCompleted = idx < currentTopicIndex;
                  
                  let cardStyle = 'border-white/5 bg-white/2';
                  let statusText = 'Upcoming';
                  let statusColor = 'text-slate-500 border-slate-800';
                  
                  if (isActive) {
                    cardStyle = 'border-accent-500/40 bg-accent-500/5 glow-accent';
                    statusText = 'Currently Teaching';
                    statusColor = 'text-accent-400 border-accent-500/20 bg-accent-500/10 animate-pulse';
                  } else if (isCompleted) {
                    cardStyle = 'border-cyber-green/10 bg-cyber-green/2 opacity-70';
                    statusText = 'Completed';
                    statusColor = 'text-cyber-green border-cyber-green/20 bg-cyber-green/10';
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-300 ${cardStyle}`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                        isActive 
                          ? 'bg-accent-500 text-white' 
                          : isCompleted 
                          ? 'bg-cyber-green/20 text-cyber-green' 
                          : 'bg-navy-800 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight truncate ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                          {topic}
                        </p>
                        <span className={`inline-block border px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono mt-1.5 ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status and countdown bar */}
      <div className="glass-light border-t border-white/5 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <BookOpen size={14} className="text-accent-400" />
          <span>Topic {currentTopicIndex + 1} of {totalTopics}:</span>
          <span className="text-white font-semibold">{topicName}</span>
        </div>
        
        {/* Countdown Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold shadow-inner ${
              timeLeft < 60 
                ? 'bg-error/20 text-error animate-pulse' 
                : 'bg-navy-900 border border-white/5 text-cyber-green'
            }`}>
              <Clock size={14} />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono hidden sm:inline">
              Topic Countdown
            </span>
          </div>

          <button
            type="button"
            onClick={handleTopicComplete}
            disabled={loading || topicComplete}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            Skip to Quiz
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
