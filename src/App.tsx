import React, { useState, useEffect } from "react";
import { 
  Tv, Layers, Users, Star, ClipboardCheck, Settings, ShieldCheck, 
  Sparkles, Wifi, WifiOff, Clock, Award, HelpCircle, Lock, Unlock, TrendingUp, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
import { 
  Meeting, TimelineItem, TimerLog, AhCounterLog, GrammarianUse, 
  TableTopicsPrompt, EvaluationItem, SAAPoll, MeetingSegment 
} from "./types";

// Mock Data
import { 
  INITIAL_MEETING, INITIAL_TIMER_LOGS, INITIAL_AH_LOGS, INITIAL_GRAMMAR_LOGS, 
  INITIAL_TOPICS, INITIAL_EVALUATIONS, INITIAL_POLLS, PAST_MEETINGS_ARCHIVE 
} from "./mockData";

// Components
import { StageView } from "./components/StageView";
import { TMODMaster } from "./components/TMODMaster";
import { RolePlayers } from "./components/RolePlayers";
import { Evaluations } from "./components/Evaluations";
import { Archive } from "./components/Archive";
import { Governance } from "./components/Governance";
import { ClubPerformance } from "./components/ClubPerformance";
import { AccessControl } from "./components/AccessControl";
import { MeetingAuthorization } from "./components/MeetingAuthorization";

export default function App() {
  const [currentView, setCurrentView] = useState<"stage" | "tmod" | "roleplayers" | "evaluations" | "archive" | "governance" | "performance" | "permissions">("stage");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [showAuthorization, setShowAuthorization] = useState<boolean>(false);

  // --- COMPREHENSIVE REACTIVE CLOUD STATES (LOCAL SYNC) ---
  const [meeting, setMeeting] = useState<Meeting>(INITIAL_MEETING);
  const [activeTimelineItem, setActiveTimelineItem] = useState<TimelineItem | null>(
    INITIAL_MEETING.timeline.find(item => item.role === "Prepared Speaker 1") || null
  );

  // System-wide Shared Timer Clock State
  const [liveTimerState, setLiveTimerState] = useState<{
    isRunning: boolean;
    seconds: number;
    signal: "NONE" | "GREEN" | "YELLOW" | "RED";
    speaker: string;
    role: string;
    minSeconds: number;
    yellowSeconds: number;
    maxSeconds: number;
  }>({
    isRunning: false,
    seconds: 0,
    signal: "NONE",
    speaker: "Audrey Chen",
    role: "Prepared Speaker 1",
    minSeconds: 300,
    yellowSeconds: 360,
    maxSeconds: 420
  });

  // Global Clock Tick Engine for Shared Timer Connectivity
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (liveTimerState.isRunning) {
      interval = setInterval(() => {
        setLiveTimerState(prev => {
          const nextSecs = prev.seconds + 1;
          let nextSignal: "NONE" | "GREEN" | "YELLOW" | "RED" = "NONE";
          if (nextSecs >= prev.maxSeconds) {
            nextSignal = "RED";
          } else if (nextSecs >= prev.yellowSeconds) {
            nextSignal = "YELLOW";
          } else if (nextSecs >= prev.minSeconds) {
            nextSignal = "GREEN";
          }
          return {
            ...prev,
            seconds: nextSecs,
            signal: nextSignal
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveTimerState.isRunning]);

  const [timerLogs, setTimerLogs] = useState<TimerLog[]>(INITIAL_TIMER_LOGS);
  const [ahLogs, setAhLogs] = useState<AhCounterLog[]>(INITIAL_AH_LOGS);
  const [grammarianLogs, setGrammarianLogs] = useState<GrammarianUse[]>(INITIAL_GRAMMAR_LOGS);
  const [topicsPrompts, setTopicsPrompts] = useState<TableTopicsPrompt[]>(INITIAL_TOPICS);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(INITIAL_EVALUATIONS);
  const [polls, setPolls] = useState<SAAPoll[]>(INITIAL_POLLS);
  const [pastMeetings, setPastMeetings] = useState<any[]>(PAST_MEETINGS_ARCHIVE);

  // --- API CONNECTION & DURABLE DATABASE SYNC ---
  useEffect(() => {
    // Check general server connectivity
    fetch("/api/health")
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      })
      .catch(() => {
        setApiOnline(false);
      });

    // Rehydrate state from MongoDB Atlas/Server cache
    fetch("/api/meetings/active")
      .then(res => res.json())
      .then(data => {
        if (data.meeting) {
          setMeeting(data.meeting);
          // Highlight first prepared speech initially on startup
          const firstTopic = data.meeting.timeline.find((item: any) => item.segment === "PREPARED_SPEECH");
          if (firstTopic) {
            setActiveTimelineItem(firstTopic);
          }
          console.log("Successfully loaded meeting dataset from database.");
        } else {
          // Seeding empty database cache
          fetch("/api/meetings/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(INITIAL_MEETING)
          })
          .then(() => console.log("Seeding default meeting structure completed."))
          .catch(() => {});
        }
      })
      .catch(err => {
        console.warn("Storage syncing offline, local state engine active:", err);
      });
  }, []);

  // Automatically save and sync changes to database with debouncing
  useEffect(() => {
    if (meeting) {
      const persistState = async () => {
        try {
          await fetch("/api/meetings/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meeting)
          });
        } catch (err) {
          // Silent local fallback
        }
      };
      const debounceTimer = setTimeout(persistState, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [meeting]);

  // --- STATE MUTATORS WITH SHARED DISCIPLINE ---
  const handleUpdateTimeline = (newTimeline: TimelineItem[]) => {
    setMeeting(prev => ({
      ...prev,
      timeline: newTimeline
    }));
  };

  const handleSetSpotlight = (item: TimelineItem | null) => {
    setActiveTimelineItem(item);
    if (item) {
      // Auto-configure physical timer metrics for spotlighted participant based on segment
      let minS = 300; // default 5 min
      let yelS = 360; // default 6 min
      let maxS = 420; // default 7 min
      
      if (item.segment === "PREPARED_SPEECH") {
        minS = 300; yelS = 360; maxS = 420;
      } else if (item.segment === "TABLE_TOPICS") {
        minS = 60; yelS = 90; maxS = 120;
      } else if (item.segment === "EVALUATION") {
        minS = 120; yelS = 150; maxS = 180;
      } else {
        // Business limit e.g. 10, 12, 15 min or default 5,6,7 min
        minS = 300; yelS = 360; maxS = 420;
      }

      setLiveTimerState({
        isRunning: false,
        seconds: 0,
        signal: "NONE",
        speaker: item.player,
        role: item.role,
        minSeconds: minS,
        yellowSeconds: yelS,
        maxSeconds: maxS
      });
      // Slide switch to Stage projection so user visually tracks spotlight trigger
      setCurrentView("stage");
    }
  };

  const handleAddTimerLog = (log: TimerLog) => {
    setTimerLogs(prev => [log, ...prev]);
  };

  const handleAddEvaluation = (item: EvaluationItem) => {
    setEvaluations(prev => [item, ...prev]);
  };

  const handleAddPastMeeting = (newPastMeeting: any) => {
    setPastMeetings(prev => [newPastMeeting, ...prev]);
  };

  const handleUpdatePastMeeting = (id: string, updated: any) => {
    setPastMeetings(prev => prev.map(m => m.id === id ? updated : m));
  };

  // Convert in-progress meeting to official historical text record and seal it
  const handleApproveCurrentMOM = () => {
    const defaultSecMOMSummary = `Friday Club Meeting #${meeting.number} (Date: ${meeting.date}) has been sealed under official club governance parameters.

Meeting Theme: "${meeting.theme}"
Word of the Day: "${meeting.wordOfDay}" was used correctly.
Phrase of the Day: "${meeting.phraseOfDay}" was used correctly.

Summary of Logs Executed:
- Timer Tracks Complete: Recorded ${timerLogs.length} verified timers.
- Ah-Counter click counts: Formally added ${ahLogs.length} speaker checklists.
- Grammarian: ${grammarianLogs.length} speeches checked for excellent phrasing syntax.

SAA Ballot Voting Results validated:
- Best Speaker: David Vance
- Best Table Topics Speaker: Bob Henderson (Guest)
- Best Advisor / Evaluator: Helen Ramirez

Sealed and certified by President David Vance on June 17, 2026.`;

    const newMOMRecord = {
      id: "meet-" + meeting.number,
      number: meeting.number,
      date: meeting.date,
      theme: meeting.theme,
      wordOfDay: meeting.wordOfDay,
      phraseOfDay: meeting.phraseOfDay,
      editorialSummary: defaultSecMOMSummary,
      approved: true,
      approvedBy: "David Vance (President)"
    };

    setPastMeetings(prev => {
      // check if already exists
      if (prev.some(m => m.id === newMOMRecord.id)) {
        return prev.map(m => m.id === newMOMRecord.id ? newMOMRecord : m);
      }
      return [newMOMRecord, ...prev];
    });

    alert("Friday Meeting #" + meeting.number + " has been successfully sealed and consolidated into the Minutes of Meeting ledger database!");
    setCurrentView("archive");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-55/40 text-slate-800 font-sans">
      
      {/* 1. SIDEBAR NAVIGATION CONSOLE */}
      <aside className="w-72 bg-[#002a44] text-white flex flex-col justify-between p-4.5 border-r border-tm-blue/20 shrink-0 select-none">
        
        {/* Header Branding section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-[#053a5c] px-4 py-3 rounded-xl border border-white/5 relative overflow-hidden">
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-tm-yellow rounded-bl-lg" />
            <div className="w-10 h-10 rounded-full bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/25/Toastmasters_International_logo.svg" 
                alt="Toastmasters International Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-xs tracking-wider text-white">
                TOASTMASTERS
              </h1>
              <p className="text-[10px] text-tm-yellow uppercase tracking-widest font-semibold leading-none mt-1">
                Pro Platform
              </p>
            </div>
          </div>

          {/* Meeting Badge Status Info block */}
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono">
              <span className="font-semibold text-tm-yellow uppercase tracking-widest">Meeting {meeting.number}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[8px] ${
                meeting.status === "IN_PROGRESS" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {meeting.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-white mt-1.5 truncate font-display">
              "{meeting.theme}"
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              📅 {meeting.date}
            </span>
          </div>

          {/* Nav Links menu */}
          <nav className="space-y-1 font-sans text-xs font-medium">
            <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2.5 pb-1">Assembly Views</p>
            
            <button
              onClick={() => setCurrentView("stage")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "stage" 
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tv className="w-4 h-4 shrink-0 text-slate-300" />
                <span>📺 Stage projection View</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              onClick={() => setCurrentView("tmod")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "tmod" 
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0 text-slate-300" />
              <span>👑 TMOD Cockpit & Agenda</span>
            </button>

            <button
              onClick={() => setCurrentView("roleplayers")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "roleplayers" 
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-slate-300" />
              <span>👥 Educational Role Players</span>
            </button>

            <button
              onClick={() => setCurrentView("evaluations")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "evaluations" 
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <Star className="w-4 h-4 shrink-0 text-slate-300" />
              <span>📝 Pathways Peers Evaluation</span>
            </button>

            <button
              onClick={() => setCurrentView("archive")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "archive" 
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0 text-slate-300" />
              <span>📁 Archive Ledger & MOM</span>
            </button>

            <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2.5 pt-4 pb-1">Governance & Admin</p>

            <button
              onClick={() => setCurrentView("performance")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "performance" && !showAuthorization
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-slate-300" />
              <span>📈 Club Performance</span>
            </button>

            <button
              onClick={() => setCurrentView("permissions")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "permissions" && !showAuthorization
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-slate-300" />
              <span>🛡️ Member Permissions Logic</span>
            </button>

            <button
              onClick={() => setCurrentView("governance")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${
                currentView === "governance" && !showAuthorization
                  ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" 
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-300" />
              <span>⚙️ SAA Ballot controls</span>
            </button>
          </nav>

          <div className="px-2 pb-1 pt-1.5 shrink-0">
            {meeting.status === "SCHEDULED" ? (
              <button
                onClick={() => setShowAuthorization(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-display uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow select-none"
              >
                <Unlock className="w-3.5 h-3.5 shrink-0" />
                <span>Start Meeting</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to stop/reset the live meeting to scheduled state?")) {
                    setMeeting(prev => ({ ...prev, status: "SCHEDULED" }));
                    setShowAuthorization(false);
                    alert("Meeting reset to SCHEDULED state successfully.");
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-tm-maroon hover:opacity-90 text-white font-bold font-display uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow select-none"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 text-tm-yellow" />
                <span>Reset Meeting</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom profile info & API health status indicators */}
        <div className="space-y-3 pt-4 border-t border-white/5 font-sans">
          <div className="flex items-center gap-2.5 px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tm-yellow shrink-0" />
            <div className="text-[10px]">
              <p className="text-white font-semibold">Friday Club #124</p>
              <p className="text-slate-400 font-medium">Bylaws Authorized</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono px-2 py-1.5 bg-black/25 rounded-md text-slate-400">
            <span>Intelligent Services:</span>
            {apiOnline === true ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Wifi className="w-3 h-3 text-emerald-400" /> ONLINE
              </span>
            ) : apiOnline === false ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <WifiOff className="w-3 h-3 text-amber-400" /> SIMULATOR fallback
              </span>
            ) : (
              <span className="text-slate-500">Checking...</span>
            )}
          </div>
        </div>

      </aside>

      {/* 2. PRIMARY CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
        
        {/* Top bar header */}
        <header className="h-14 bg-white border-b border-slate-100 px-6.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-xs font-sans">
            <span className="text-slate-400">Section Location:</span>
            <span className="font-bold text-slate-700 capitalize flex items-center gap-1">
              {currentView} view Mode
            </span>
          </div>

          {/* Quick timer notification preview to ensure timer state persists across views! */}
          <div className="flex items-center gap-4.5">
            {liveTimerState.isRunning && (
              <div className="flex items-center gap-2.5 bg-tm-maroon text-white font-mono text-[11px] px-3 py-1.5 rounded-lg border border-tm-maroon/20 animate-fade-in shadow-sm pl-2">
                <span className="w-1.5 h-1.5 bg-tm-yellow rounded-full animate-ping" />
                <span className="font-semibold">{liveTimerState.speaker} is speaking</span>
                <span className="font-bold text-tm-yellow bg-black/20 px-1 rounded">
                  {Math.floor(liveTimerState.seconds / 60).toString().padStart(2, "0")}:{(liveTimerState.seconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/55 px-3 py-1.5 rounded-lg text-xs text-slate-600">
              <Award className="w-4 h-4 text-tm-maroon shrink-0" />
              <span>Pathways Portal</span>
            </div>
          </div>
        </header>

        {/* Main Content scrollable area container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={showAuthorization ? "auth" : currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="h-full"
            >
              {showAuthorization ? (
                <MeetingAuthorization 
                  meeting={meeting} 
                  onAuthorizeAndStart={() => {
                    setMeeting(prev => ({ ...prev, status: "IN_PROGRESS" }));
                    setShowAuthorization(false);
                    setCurrentView("stage");
                    alert("Assembly authorized and active! Automated live dashboard initialized.");
                  }}
                  onCancel={() => setShowAuthorization(false)}
                />
              ) : (
                <>
                  {currentView === "stage" && (
                    <StageView 
                      meeting={meeting} 
                      activeTimelineItem={activeTimelineItem} 
                      liveTimerState={liveTimerState} 
                      setLiveTimerState={setLiveTimerState}
                    />
                  )}

                  {currentView === "tmod" && (
                    <TMODMaster 
                      meeting={meeting} 
                      activeTimelineItem={activeTimelineItem}
                      onUpdateTimeline={handleUpdateTimeline} 
                      onSetSpotlight={handleSetSpotlight} 
                      liveTimerState={liveTimerState}
                      setLiveTimerState={setLiveTimerState}
                    />
                  )}

                  {currentView === "roleplayers" && (
                    <RolePlayers 
                      meeting={meeting} 
                      timerLogs={timerLogs} 
                      ahLogs={ahLogs} 
                      grammarianLogs={grammarianLogs} 
                      topicsPrompts={topicsPrompts} 
                      onAddTimerLog={handleAddTimerLog} 
                      onUpdateAhLogs={setAhLogs} 
                      onUpdateGrammarianLogs={setGrammarianLogs} 
                      onUpdateTopicsPrompts={setTopicsPrompts} 
                      liveTimerState={liveTimerState} 
                      setLiveTimerState={setLiveTimerState} 
                    />
                  )}

                  {currentView === "evaluations" && (
                    <Evaluations 
                      evaluations={evaluations} 
                      onAddEvaluation={handleAddEvaluation} 
                    />
                  )}

                  {currentView === "archive" && (
                    <Archive 
                      meeting={meeting} 
                      timerLogs={timerLogs} 
                      ahLogs={ahLogs} 
                      grammarianLogs={grammarianLogs} 
                      pastMeetings={pastMeetings} 
                      onAddPastMeeting={handleAddPastMeeting} 
                      onUpdatePastMeeting={handleUpdatePastMeeting} 
                    />
                  )}

                  {currentView === "governance" && (
                    <Governance 
                      meeting={meeting} 
                      polls={polls} 
                      onUpdatePolls={setPolls} 
                      onApproveCurrentMOM={handleApproveCurrentMOM} 
                    />
                  )}

                  {currentView === "performance" && (
                    <ClubPerformance />
                  )}

                  {currentView === "permissions" && (
                    <AccessControl />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
