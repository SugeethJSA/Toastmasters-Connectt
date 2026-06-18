import React from "react";
import { TimelineItem, Meeting, MeetingSegment } from "../types";
import { 
  Play, Pause, RotateCcw, Tv, Sparkles, Volume2, Award, FileText, Quote, User, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StageViewProps {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
  activeTimelineItem: TimelineItem | null;
  liveTimerState: {
    isRunning: boolean;
    seconds: number;
    signal: "NONE" | "GREEN" | "YELLOW" | "RED";
    speaker: string;
    role: string;
    minSeconds: number;
    yellowSeconds: number;
    maxSeconds: number;
  };
  setLiveTimerState: React.Dispatch<React.SetStateAction<{
    isRunning: boolean;
    seconds: number;
    signal: "NONE" | "GREEN" | "YELLOW" | "RED";
    speaker: string;
    role: string;
    minSeconds: number;
    yellowSeconds: number;
    maxSeconds: number;
  }>>;
  sendTimerControl: (action: "start" | "pause" | "reset" | "config", overrides?: any) => void;
  stageTopic: { id: string; prompt: string; theme: string; assignedSpeaker?: string } | null;
  sendTopicControl: (action: "show" | "hide" | "clear", topicData?: any) => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
}

export const StageView: React.FC<StageViewProps> = ({
  meeting,
  setMeeting,
  activeTimelineItem,
  liveTimerState,
  setLiveTimerState,
  sendTimerControl,
  stageTopic,
  sendTopicControl,
  onToggleFullScreen,
  isFullScreen
}) => {
  // Determine speaker details
  const displaySpeaker = liveTimerState.isRunning
    ? liveTimerState.speaker
    : activeTimelineItem
    ? activeTimelineItem.player
    : "Stage Empty";

  const displayRole = liveTimerState.isRunning
    ? liveTimerState.role
    : activeTimelineItem
    ? activeTimelineItem.role
    : "No active presenter";

  const displayTitle = liveTimerState.isRunning
    ? `Active Track: ${liveTimerState.role}`
    : activeTimelineItem?.title || `Meeting #${meeting.number}`;

  const displaySegment = activeTimelineItem
    ? activeTimelineItem.segment.replace("_", " ")
    : "Introductory Sessions";

  // Toggle timer card visibility (persisted in localStorage)
  const [showTimer, setShowTimer] = React.useState(() => localStorage.getItem("stageShowTimer") !== "false");
  // Guest management
  const [newGuest, setNewGuest] = React.useState("");

  // Unified Users State for Photo Sync
  const [registeredUsers, setRegisteredUsers] = React.useState<any[]>([]);
  React.useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "";
    const fetchUsers = () => {
      fetch(`${API_BASE}/api/users`)
        .then(r => r.json())
        .then(d => { if (d.users) setRegisteredUsers(d.users); })
        .catch(() => {});
    };
    
    fetchUsers();
    const intervalId = setInterval(fetchUsers, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const matchedUser = activeTimelineItem ? registeredUsers.find(u => u.name === activeTimelineItem.player) : null;

  // Format time (mm:ss)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Retrive speaker quote and photo with unified profile fallback
  const photoUrl = activeTimelineItem?.photoUrl || matchedUser?.photoUrl || undefined;
  const speakerQuote = activeTimelineItem?.quote || "Paving the path of communication and transformative leadership.";

  // Map signal to background color classes for the stage card
  const getSignalBgColor = () => {
    switch (liveTimerState.signal) {
      case "GREEN": 
        return "bg-emerald-600 text-white border-emerald-500 shadow-emerald-200";
      case "YELLOW":
        return "bg-amber-500 text-slate-900 border-amber-400 shadow-amber-100";
      case "RED":
        return "bg-rose-600 text-white border-rose-500 shadow-rose-200 animate-pulse";
      default:
        return "bg-[#002a44] text-white border-tm-blue/40";
    }
  };

  // Remote Timer controls
  const handleRemoteStart = () => {
    setLiveTimerState(prev => ({
      ...prev,
      isRunning: true,
      speaker: displaySpeaker,
      role: displayRole
    }));
    sendTimerControl("start", { speaker: displaySpeaker, role: displayRole, minSeconds: liveTimerState.minSeconds, yellowSeconds: liveTimerState.yellowSeconds, maxSeconds: liveTimerState.maxSeconds });
  };

  const handleRemotePause = () => {
    setLiveTimerState(prev => ({ ...prev, isRunning: false }));
    sendTimerControl("pause");
  };

  const handleRemoteReset = () => {
    setLiveTimerState(prev => ({
      ...prev,
      isRunning: false,
      seconds: 0,
      signal: "NONE"
    }));
    sendTimerControl("reset");
  };

  return (
    <div className={`space-y-6 ${isFullScreen ? 'min-h-screen bg-tm-dark p-8 overflow-y-auto' : ''}`} id="stage-view-section">
      {/* Applause Overlay */}
      <AnimatePresence>
        {meeting.status === "COMPLETED" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none overflow-hidden"
          >
            <div className="absolute inset-0 flex justify-center items-start pt-10">
              {Array.from({length: 30}).map((_, i) => (
                <motion.div key={i} initial={{ y: -50, x: Math.random() * window.innerWidth, opacity: 1 }} animate={{ y: window.innerHeight, opacity: 0, rotate: 360 }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() }} className="absolute text-4xl">
                  {['🎉', '🎊', '👏', '✨', '💐'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} className="text-center bg-white/10 p-12 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-lg">
              <div className="text-7xl mb-6 animate-bounce">👏👏</div>
              <h2 className="text-5xl font-display font-extrabold text-white drop-shadow-lg tracking-tight">Session Concluded!</h2>
              <p className="text-xl text-white/90 mt-4 font-sans font-medium">Thank you for joining today's meeting.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upper Brand Info Panel */}
      <div className={`flex flex-col sm:flex-row justify-between items-start bg-white rounded-xl p-6 border border-slate-100 shadow-sm gap-4 ${isFullScreen ? 'opacity-90' : ''}`}>
        <div className="flex items-start gap-4 min-w-0">
          <img src="/toastmasters-logo.svg" alt="Toastmasters" className="w-16 h-16 shrink-0 mt-1" />
          <div className="min-w-0">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-tm-blue/10 text-tm-blue tracking-widest uppercase">
              Meeting #{meeting.number}
            </span>
            <h2 className="text-2xl font-bold font-display text-tm-dark mt-2">
              {meeting.theme}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 font-sans">
              TMOD: <span className="font-semibold text-slate-700">{meeting.toastmasterOfTheDay}</span>
            </p>
            {meeting.meetingLink && (
              <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-tm-blue hover:underline mt-1 inline-block">
                Join Meeting ↗
              </a>
            )}
          </div>
        </div>

          <div className="flex items-start gap-6 shrink-0">
            <div className="text-right text-xs text-slate-500 font-sans leading-relaxed">
              <p><strong>Club:</strong> Sophrosyne VIT</p>
              <p><strong>Area:</strong> F4 &nbsp;•&nbsp; <strong>District:</strong> 120</p>
              <p className="mt-1">📅 {meeting.date}</p>
              {meeting.name && <p className="text-slate-400 mt-1">{meeting.name}</p>}
            </div>
            <div className="flex items-start gap-2">
              <button
                onClick={() => setShowTimer(p => { const next = !p; localStorage.setItem("stageShowTimer", String(next)); return next; })}
                className={`shrink-0 w-10 h-10 flex items-center justify-center border rounded-lg transition-colors cursor-pointer ${
                  showTimer
                    ? "bg-tm-blue/10 border-tm-blue/30 text-tm-blue"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
                title={showTimer ? "Hide Timer" : "Show Timer"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
              {onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg hover:bg-tm-blue hover:text-white text-slate-500 transition-colors cursor-pointer"
                  title={isFullScreen ? "Exit Fullscreen" : "Go Fullscreen"}
                >
                  <Tv className="w-5 h-5" />
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Main Projection Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Speaker Spotlight & Display */}
        <div className="lg:col-span-2 bg-[#004165] rounded-2xl overflow-hidden border border-tm-blue/20 shadow-lg flex flex-col justify-between relative min-h-[460px]">
          {/* Subtle background TM ribbon styling */}
          <div className="absolute inset-0 bg-gradient-to-tr from-tm-dark/95 via-tm-blue/80 to-transparent pointer-events-none opacity-90" />
          {/* Summer FM accent */}
          <div className="absolute top-4 right-4 text-yellow-300/20 text-2xl select-none pointer-events-none">📻 ☀️ 🎵</div>

          {/* Top Stage Bar with Active Section Name */}
          <div className="relative z-10 p-6 flex justify-between items-center bg-black/25 backdrop-blur-sm border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-xs font-mono font-semibold text-white/90 tracking-wider uppercase">
                <span className="mr-1.5">📻</span> ON STAGE • SPOTLIGHT ACTIVE
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-tm-yellow uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded border border-white/10">
                📁 {displaySegment}
              </span>
            </div>
          </div>

          {/* Core Spotlight Layout: Photo, Name, Speech Info & Quote */}
          <div className="relative z-10 p-8 my-auto flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* 1. Portrait Photo */}
            <div className="shrink-0 relative">
              {photoUrl ? (
                <div className="relative group">
                  <img 
                    src={photoUrl} 
                    alt={displaySpeaker} 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-[#F2DF74] bg-white/10 shadow-lg text-white"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-tm-maroon text-white rounded text-[8px] font-bold border border-white/30">
                    LIVE 📻
                  </span>
                </div>
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-tm-blue border-4 border-white/15 shadow-lg flex flex-col items-center justify-center text-white relative">
                  <User className="w-8 h-8 md:w-10 h-10 opacity-60" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest mt-1">Speaker</span>
                </div>
              )}
            </div>

            {/* 2. Speaker details & quote */}
            <div className="text-center md:text-left flex-1 space-y-3.5">
              <div>
                <p className="text-xs font-mono text-[#F2DF74] uppercase tracking-widest font-bold">
                  {displayRole}
                </p>
                <div className="w-10 h-0.5 bg-tm-maroon mt-1.5 mb-2 rounded-full" />
                <h1 className="text-3xl md:text-4xl font-extrabold font-display text-white mt-1 tracking-tight drop-shadow-md">
                  {displaySpeaker}
                </h1>
                <p className="text-xs font-mono text-slate-300 mt-1 uppercase tracking-wider">
                  SPEECH TITLE: <span className="text-white italic">"{displayTitle}"</span>
                </p>
              </div>

              {/* Quote if needed */}
              <div className="relative bg-black/20 p-4 rounded-xl border border-white/5 max-w-xl mx-auto md:mx-0">
                <Quote className="absolute -top-2.5 -left-2 w-5 h-5 text-tm-maroon transform rotate-180 opacity-60" />
                <span className="absolute bottom-2 right-2 text-[10px] opacity-30 select-none">📻</span>
                <p className="text-sm text-slate-200 font-sans font-light italic pl-3 pr-2 select-none leading-relaxed">
                  "{speakerQuote}"
                </p>
              </div>
            </div>
          </div>

          {/* Table Topic Prompt Overlay */}
          <AnimatePresence>
            {stageTopic && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="relative z-10 px-8 pb-6"
              >
                <div className="bg-white/10 backdrop-blur-md border border-[#F2DF74]/30 rounded-xl p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-tm-maroon animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[#F2DF74] uppercase tracking-widest">TABLE TOPICS PROMPT</span>
                    <span className="w-2 h-2 rounded-full bg-tm-maroon animate-pulse" />
                  </div>
                  <p className="text-lg md:text-xl font-display font-bold text-white leading-relaxed drop-shadow-md">
                    "{stageTopic.prompt}"
                  </p>
                  {stageTopic.assignedSpeaker && (
                    <p className="text-sm text-[#F2DF74] font-mono mt-2">
                      Assigned to: <span className="text-white font-semibold">{stageTopic.assignedSpeaker}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-white/60 font-mono mt-2 uppercase tracking-wider">
                    Theme: {stageTopic.theme}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Stage Status */}
          <div className="relative z-10 p-6 bg-black/35 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t border-white/5 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-tm-yellow/20 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-[#F2DF74]" />
              </span>
              <div>
                <p className="text-[10px] text-white/60 font-mono tracking-wider uppercase">☀️ Stage Guidance Active</p>
                <p className="text-xs text-white/95 font-medium font-sans">
                  Time tracker synchronized. Digital ledger is locked for authentication purposes.
                </p>
              </div>
            </div>
            {liveTimerState.isRunning && (
              <div className="text-center sm:text-right">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 font-mono px-2.5 py-1 rounded uppercase font-bold tracking-widest animate-pulse">
                  Timer Sync'd
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Timer Signal Card or WOD/POD Card when timer hidden */}
        {showTimer ? (
        <div className={`rounded-2xl border-2 p-6 flex flex-col justify-between shadow-md transition-all duration-500 ${getSignalBgColor()}`}>
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="font-display font-bold text-md">Timer Signal Card</h3>
              <span className="text-[10px] font-mono bg-white/15 text-white border border-white/15 px-2 py-0.5 rounded uppercase font-semibold">
                {liveTimerState.isRunning ? "Tracking" : "Idle"}
              </span>
            </div>

            {/* Huge live counter */}
            <div className="text-center py-6">
              <span className="text-6xl md:text-7xl font-extrabold font-mono tracking-tighter drop-shadow-sm block">
                {formatTime(liveTimerState.seconds)}
              </span>
              <p className="text-[10px] font-mono font-medium tracking-widest uppercase mt-3 opacity-90">
                Elapsed Speaking Time
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Real-time remote start/stop triggers */}
            <div className="bg-slate-950/20 rounded-xl p-3 border border-white/10 space-y-2">
              <p className="text-[9px] text-white/70 font-mono font-bold uppercase tracking-widest text-center">
                📡 Remote Timer Controls
              </p>
              <div className="grid grid-cols-3 gap-2">
                {liveTimerState.isRunning ? (
                  <button
                    onClick={handleRemotePause}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer border border-amber-300/30 gap-1"
                  >
                    <Pause className="w-4 h-4 text-slate-950" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRemoteStart}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer border border-emerald-400/30 gap-1 font-sans"
                  >
                    <Play className="w-4 h-4 text-white" />
                    <span>Start</span>
                  </button>
                )}
                
                <button
                  onClick={handleRemoteReset}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-black/30 hover:bg-black/45 text-white text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer border border-white/10 gap-1"
                  title="Reset global clock back to 00:00"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span>Reset</span>
                </button>

                <div className="flex flex-col items-center justify-center text-center p-1 font-mono text-[9px] text-white/85 border border-white/5 rounded-lg bg-black/10">
                  <span className="block font-bold">Limit:</span>
                  <span className="block italic">{(liveTimerState.maxSeconds / 60)}:00</span>
                </div>
              </div>
            </div>

            {/* Visual Lights Representation */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className={`py-1.5 rounded-lg text-[9px] font-mono border font-bold ${
                  liveTimerState.signal === "GREEN"
                    ? "bg-emerald-500 text-white border-white/20 shadow-md"
                    : "bg-black/25 text-white/30 border-transparent"
                }`}
              >
                🟢 GREEN ({(liveTimerState.minSeconds / 60)}m)
              </div>
              <div
                className={`py-1.5 rounded-lg text-[9px] font-mono border font-bold ${
                  liveTimerState.signal === "YELLOW"
                    ? "bg-amber-400 text-slate-950 border-white/20 shadow-md"
                    : "bg-black/25 text-white/30 border-transparent"
                }`}
              >
                🟡 YELLOW ({(liveTimerState.yellowSeconds / 60)}m)
              </div>
              <div
                className={`py-1.5 rounded-lg text-[9px] font-mono border font-bold ${
                  liveTimerState.signal === "RED"
                    ? "bg-rose-500 text-white border-white/20 shadow-md"
                    : "bg-black/25 text-white/30 border-transparent"
                }`}
              >
                🔴 RED ({(liveTimerState.maxSeconds / 60)}m)
              </div>
            </div>

            {/* Informational Guidelines based on segment */}
            <div className="bg-black/25 rounded-xl p-3 text-xs border border-white/5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-white/65 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-white/70 font-mono uppercase tracking-wider leading-none">
                  Active Limits:
                </p>
                {activeTimelineItem?.segment === "PREPARED_SPEECH" ? (
                  <p className="text-[11px] opacity-90 leading-normal font-sans">
                    Speech rules apply: Green light starts at 5 mins, Yellow at 6, Red at 7. 30-second grace window is allowed for final wrap-up.
                  </p>
                ) : activeTimelineItem?.segment === "TABLE_TOPICS" ? (
                  <p className="text-[11px] opacity-90 leading-normal font-sans">
                    Table Topics rules apply: Green starts at 1 min, Yellow at 1.5, Red at 2. Try to maintain impromptu fluency!
                  </p>
                ) : (
                  <p className="text-[11px] opacity-90 leading-normal font-sans">
                    Evaluation limits apply: Green at 2 mins, Yellow at 2.5, Red at 3. Provide encouraging and helpful suggestions!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : (
        <div className="rounded-2xl bg-white/90 backdrop-blur-md p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-tm-maroon" />
            <span className="text-xs font-mono font-bold text-tm-maroon uppercase tracking-widest">Summer FM • Daily Education</span>
          </div>
          <div className="bg-tm-blue/5 rounded-lg p-4 border border-tm-blue/10">
            <p className="text-[11px] font-mono font-bold text-tm-blue uppercase tracking-wider mb-1">Word of the Day</p>
            <p className="text-xl font-bold text-slate-800">{meeting.wordOfDay}</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{meeting.wordOfDayDefinition}</p>
          </div>
          <div className="bg-tm-maroon/5 rounded-lg p-4 border border-tm-maroon/10">
            <p className="text-[11px] font-mono font-bold text-tm-maroon uppercase tracking-wider mb-1">Phrase of the Day</p>
            <p className="text-xl font-bold text-slate-800">"{meeting.phraseOfDay}"</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{meeting.phraseOfDayMeaning}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200/40">
            <p className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">Meeting Theme</p>
            <p className="text-lg font-bold text-slate-800">"{meeting.theme}"</p>
          </div>
        </div>
        )}
      </div>

      {/* Crawling Marquee educational banner at bottom (only when timer visible) */}
      {showTimer && (
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-md rounded-xl py-3 px-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 bg-tm-maroon text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-tm-maroon/20 font-display uppercase tracking-wider z-15 shadow-sm">
          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          <span>Summer FM • Daily Education</span>
        </div>
        <div className="w-full overflow-hidden whitespace-nowrap py-1 relative">
          <div className="inline-block animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] text-sm text-slate-700 cursor-help space-x-12">
            <span>
              🌟 <strong className="font-display text-tm-blue font-semibold uppercase tracking-wider">Word of the Day:</strong>{" "}
              <span className="font-bold underline text-slate-800">{meeting.wordOfDay}</span> — {meeting.wordOfDayDefinition}
            </span>
            <span>
              🔖 <strong className="font-display text-tm-maroon font-semibold uppercase tracking-wider">Phrase of the Day:</strong>{" "}
              <span className="font-bold underline text-slate-800">"{meeting.phraseOfDay}"</span> — {meeting.phraseOfDayMeaning}
            </span>
            <span>
              🏆 <strong className="font-display text-slate-600 font-semibold uppercase tracking-wider">Today's Meeting Theme:</strong>{" "}
              <span className="italic">"{meeting.theme}"</span> — Let’s challenge ourselves to pave the path!
            </span>
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translate3d(100%, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
        `}</style>
      </div>
      )}

      {/* Attendance & Immediate Guest List Tracker */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-display font-bold text-sm text-slate-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-tm-maroon" /> Active Assembly Guest Registry
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2.5 py-1 rounded-full font-semibold">
            {meeting.guestList.length} Registered Guests
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5 mt-4">
          {meeting.guestList.map((guest, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/60 px-3.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100/70 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-tm-maroon animate-pulse" />
              <span className="font-medium">{guest}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-250 border border-slate-200/50 px-1 hover:bg-slate-300">
                Guest
              </span>
              <button
                type="button"
                onClick={() => setMeeting(prev => ({ ...prev, guestList: prev.guestList.filter((_, i) => i !== idx) }))}
                className="text-red-400 hover:text-red-600 ml-1 cursor-pointer"
                title="Remove guest"
              >&times;</button>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newGuest}
              onChange={e => setNewGuest(e.target.value)}
              placeholder="Add guest name..."
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white w-36 outline-none focus:border-tm-maroon"
            />
            <button
              type="button"
              onClick={() => {
                const trimmed = newGuest.trim();
                if (trimmed) {
                  setMeeting(prev => ({ ...prev, guestList: [...prev.guestList, trimmed] }));
                  setNewGuest("");
                }
              }}
              className="text-xs bg-tm-maroon text-white px-2.5 py-1.5 rounded-lg hover:bg-tm-maroon/90 transition-colors font-medium cursor-pointer"
            >Add</button>
          </div>
          <div className="text-xs text-slate-400 italic flex items-center pl-1 font-sans">
            Guests are fully eligible to join Table Topics segment and ballot box polls!
          </div>
        </div>
      </div>
    </div>
  );
};
