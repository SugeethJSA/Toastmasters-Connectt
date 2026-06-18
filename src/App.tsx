import React, { useState, useEffect, useRef } from "react";
import { 
  Tv, Layers, Users, Star, ClipboardCheck, Settings, ShieldCheck, 
  Wifi, WifiOff, Award, Lock, Unlock, TrendingUp, LogOut, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import { 
  Meeting, TimelineItem, TimerLog, AhCounterLog, GrammarianUse, 
  TableTopicsPrompt, EvaluationItem, SAAPoll, MeetingSegment 
} from "./types";

import { 
  INITIAL_MEETING, INITIAL_TIMER_LOGS, INITIAL_AH_LOGS, INITIAL_GRAMMAR_LOGS, 
  INITIAL_EVALUATIONS, INITIAL_POLLS, PAST_MEETINGS_ARCHIVE 
} from "./mockData";

import { StageView } from "./components/StageView";
import { TMODMaster } from "./components/TMODMaster";
import { RolePlayers } from "./components/RolePlayers";
import { Evaluations } from "./components/Evaluations";
import { Archive } from "./components/Archive";
import { Governance } from "./components/Governance";
import { ClubPerformance } from "./components/ClubPerformance";
import { AccessControl } from "./components/AccessControl";
import { Members } from "./components/Members";
import { MeetingAuthorization } from "./components/MeetingAuthorization";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { VotePage } from "./pages/VotePage";
import { StagePage } from "./pages/StagePage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useTimerSync } from "./hooks/useTimerSync";

const API_BASE = import.meta.env.VITE_API_URL || "";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState<"stage" | "stage_fullscreen" | "tmod" | "roleplayers" | "evaluations" | "archive" | "governance" | "performance" | "permissions" | "members">("stage");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [showAuthorization, setShowAuthorization] = useState<boolean>(false);

  const [meeting, setMeeting] = useState<Meeting>(INITIAL_MEETING);
  const loadedFromServer = useRef(false);
  const [activeTimelineItem, setActiveTimelineItem] = useState<TimelineItem | null>(
    INITIAL_MEETING.timeline.find(item => item.role === "Prepared Speaker 1") || null
  );

  const { liveTimerState, setLiveTimerState, sendTimerControl, stageTopic, sendTopicControl, sendSpotlightControl } = useTimerSync((spotlight) => {
    if (spotlight) {
      setActiveTimelineItem({
        id: spotlight.id,
        role: spotlight.role,
        player: spotlight.player,
        segment: spotlight.segment as any,
        time: spotlight.time || "",
        durationMin: spotlight.durationMin || 0,
        completed: spotlight.completed || false,
        title: spotlight.title,
        photoUrl: spotlight.photoUrl,
        quote: spotlight.quote,
      });
    }
  });

  const [timerLogs, setTimerLogs] = useState<TimerLog[]>(INITIAL_TIMER_LOGS);
  const [ahLogs, setAhLogs] = useState<AhCounterLog[]>(INITIAL_AH_LOGS);
  const [grammarianLogs, setGrammarianLogs] = useState<GrammarianUse[]>(INITIAL_GRAMMAR_LOGS);
  const [topicsPrompts, setTopicsPrompts] = useState<TableTopicsPrompt[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(INITIAL_EVALUATIONS);
  const [polls, setPolls] = useState<SAAPoll[]>(INITIAL_POLLS);
  const [pastMeetings, setPastMeetings] = useState<any[]>(PAST_MEETINGS_ARCHIVE);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(data => { if (data.status === "ok") setApiOnline(true); else setApiOnline(false); })
      .catch(() => setApiOnline(false));

    fetch(`${API_BASE}/api/meetings/active`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.meeting) {
          loadedFromServer.current = true;
          setMeeting(data.meeting);
          const activeItem = data.meeting.activeTimelineItemId 
            ? data.meeting.timeline.find((item: any) => item.id === data.meeting.activeTimelineItemId)
            : data.meeting.timeline.find((item: any) => item.segment === "PREPARED_SPEECH");
          if (activeItem) setActiveTimelineItem(activeItem);
        }
        loadedFromServer.current = true;
      })
      .catch(() => { loadedFromServer.current = true; });
  }, []);

  useEffect(() => {
    if (meeting && loadedFromServer.current) {
      const persistState = async () => {
        try {
          await fetch(`${API_BASE}/api/meetings/sync`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify(meeting)
          });
        } catch (err) {}
      };
      const debounceTimer = setTimeout(persistState, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [meeting]);

  const handleUpdateTimeline = (newTimeline: TimelineItem[]) => {
    setMeeting(prev => ({ ...prev, timeline: newTimeline }));
  };

  const handleSetSpotlight = (item: TimelineItem | null) => {
    const nextId = item ? item.id : undefined;
    setActiveTimelineItem(item);
    setMeeting(prev => ({ ...prev, activeTimelineItemId: nextId }));
    if (item) {
      let minS = 300, yelS = 360, maxS = 420;
      if (item.segment === "PREPARED_SPEECH") { minS = 300; yelS = 360; maxS = 420; }
      else if (item.segment === "TABLE_TOPICS") { minS = 60; yelS = 90; maxS = 120; }
      else if (item.segment === "EVALUATION") { minS = 120; yelS = 150; maxS = 180; }
      setLiveTimerState({ isRunning: false, seconds: 0, signal: "NONE", speaker: item.player, role: item.role, minSeconds: minS, yellowSeconds: yelS, maxSeconds: maxS });
      sendSpotlightControl({ id: item.id, role: item.role, player: item.player, segment: item.segment as string, time: item.time, durationMin: item.durationMin, title: item.title, completed: item.completed, photoUrl: item.photoUrl, quote: item.quote });
    } else {
      sendSpotlightControl(null);
    }
  };

  const handleAddTimerLog = (log: TimerLog) => setTimerLogs(prev => [log, ...prev]);
  const handleAddEvaluation = (item: EvaluationItem) => setEvaluations(prev => [item, ...prev]);
  const handleAddPastMeeting = (newPastMeeting: any) => setPastMeetings(prev => [newPastMeeting, ...prev]);
  const handleUpdatePastMeeting = (id: string, updated: any) => setPastMeetings(prev => prev.map(m => m.id === id ? updated : m));

  const handleApproveCurrentMOM = () => {
    const summary = `Sophrosyne VIT Area F4 District 120 Meeting #${meeting.number} (Date: ${meeting.date}) has been sealed under official club governance parameters.\n\nMeeting Theme: "${meeting.theme}"\nWord of the Day: "${meeting.wordOfDay}"\nPhrase of the Day: "${meeting.phraseOfDay}"\n\nSummary of Logs Executed:\n- Timer Tracks Complete: Recorded ${timerLogs.length} verified timers.\n- Ah-Counter click counts: Formally added ${ahLogs.length} speaker checklists.\n- Grammarian: ${grammarianLogs.length} speeches checked for excellent phrasing syntax.\n\nSealed and certified by ${user?.name || "President"} on ${new Date().toLocaleDateString()}.`;
    const record = { id: "meet-" + meeting.number, number: meeting.number, date: meeting.date, theme: meeting.theme, wordOfDay: meeting.wordOfDay, phraseOfDay: meeting.phraseOfDay, editorialSummary: summary, approved: true, approvedBy: (user?.name || "President") + " (President)" };
    setPastMeetings(prev => prev.some(m => m.id === record.id) ? prev.map(m => m.id === record.id ? record : m) : [record, ...prev]);
    alert("Meeting #" + meeting.number + " has been sealed!");
    setCurrentView("archive");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleToggleFullScreen = () => {
    if (currentView === "stage") {
      setCurrentView("stage_fullscreen");
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      setCurrentView("stage");
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const views: { key: string; label: string; icon: any; group?: string }[] = [
    { key: "stage", label: "Stage View", icon: Tv },
    { key: "tmod", label: "TMOD Cockpit", icon: Layers, group: "Assembly Views" },
    { key: "roleplayers", label: "Role Players", icon: Users },
    { key: "evaluations", label: "Evaluations", icon: Star },
    { key: "archive", label: "Archive & MOM", icon: ClipboardCheck },
    { key: "members", label: "Club Roster", icon: Users, group: "Admin" },
    { key: "performance", label: "Club Performance", icon: TrendingUp, group: "Admin" },
    { key: "permissions", label: "Access Control", icon: ShieldCheck, group: "Admin" },
    { key: "governance", label: "Ballot Controls", icon: Settings },
  ];

  const hasAccess = (key: string) => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "officer") return true;

    const name = user.name;
    const isSpeaker = meeting.timeline.some(t => t.segment === "PREPARED_SPEECH" && t.player === name);
    const isEvaluator = meeting.timeline.some(t => t.segment === "EVALUATION" && t.player === name);
    const isTableTopicsSpeaker = meeting.timeline.some(t => t.segment === "TABLE_TOPICS" && t.player === name);

    switch (key) {
      case "stage":
      case "archive":
        return true; // Public/Member views
      case "tmod":
        return meeting.toastmasterOfTheDay === name;
      case "roleplayers":
        return [meeting.timer, meeting.ahCounter, meeting.grammarian, meeting.tableTopicsMaster].includes(name) || isSpeaker || isTableTopicsSpeaker;
      case "evaluations":
        return meeting.generalEvaluator === name || isEvaluator || isSpeaker || isTableTopicsSpeaker;
      case "governance":
        return meeting.sergeantAtArms === name || meeting.toastmasterOfTheDay === name;
      case "performance":
      case "members":
        return true;
      case "permissions":
        return meeting.toastmasterOfTheDay === name;
      default:
        return false;
    }
  };

  const allowedViews = views.filter(v => hasAccess(v.key));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-55/40 text-slate-800 font-sans">
      {currentView !== "stage_fullscreen" && (
      <aside className="w-72 bg-[#002a44] text-white flex flex-col justify-between p-4.5 border-r border-tm-blue/20 shrink-0 select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-[#053a5c] px-4 py-3 rounded-xl border border-white/5">
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-tm-yellow rounded-bl-lg" />
            <div className="w-10 h-10 rounded-full bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
              <img src="/toastmasters-logo.svg" alt="Toastmasters" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xs tracking-wider text-white">TOASTMASTERS</h1>
              <p className="text-[10px] text-tm-yellow uppercase tracking-widest font-semibold leading-none mt-1">Pro Platform</p>
            </div>
          </div>

          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono">
              <span className="font-semibold text-tm-yellow uppercase tracking-widest">Meeting {meeting.number}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[8px] ${meeting.status === "IN_PROGRESS" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                {meeting.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-white mt-1.5 truncate font-display">"{meeting.theme}"</p>
            {meeting.name && <p className="text-[10px] text-slate-400 truncate mt-0.5">{meeting.name}</p>}
            <span className="text-[10px] text-slate-400 block">{meeting.date}</span>
            {meeting.meetingLink && (
              <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-tm-blue hover:text-tm-yellow underline block mt-0.5 truncate">
                Meeting Link ↗
              </a>
            )}
          </div>

          <nav className="space-y-1 font-sans text-xs font-medium">
            <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2.5 pb-1">Views</p>
            {allowedViews.filter(v => !v.group).map(v => (
              <button key={v.key} onClick={() => setCurrentView(v.key as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${currentView === v.key && !showAuthorization ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"}`}>
                <div className="flex items-center gap-2.5"><v.icon className="w-4 h-4 shrink-0 text-slate-300" /><span>{v.label}</span></div>
              </button>
            ))}
            {allowedViews.filter(v => v.group).length > 0 && (
              <>
                <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2.5 pt-4 pb-1">Admin</p>
                {allowedViews.filter(v => v.group).map(v => (
              <button key={v.key} onClick={() => {
                if (v.key === "stage") { navigate("/stage"); return; }
                setCurrentView(v.key as any);
              }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-l-lg transition-all duration-200 cursor-pointer ${currentView === v.key && !showAuthorization ? "bg-white/10 text-white font-bold border-r-4 border-[#F2DF74]" : "text-slate-300 hover:bg-white/5 hover:text-white border-r-4 border-transparent hover:border-[#F2DF74]/50"}`}>
                    <v.icon className="w-4 h-4 shrink-0 text-slate-300" /><span>{v.label}</span>
                  </button>
                ))}
              </>
            )}
          </nav>

          <div className="px-2 pb-1 pt-1.5 shrink-0">
            {meeting.status === "SCHEDULED" ? (
              <button onClick={() => setShowAuthorization(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-display uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow select-none">
                <Unlock className="w-3.5 h-3.5 shrink-0" /><span>Start Meeting</span>
              </button>
            ) : (
              <button onClick={() => { if (confirm("Reset meeting?")) { setMeeting(prev => ({ ...prev, status: "SCHEDULED" })); setShowAuthorization(false); } }} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-tm-maroon hover:opacity-90 text-white font-bold font-display uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow select-none">
                <Lock className="w-3.5 h-3.5 shrink-0 text-tm-yellow" /><span>Reset Meeting</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/5 font-sans">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-tm-yellow/20 flex items-center justify-center text-tm-yellow font-bold text-xs">
              {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="text-[10px]">
              <p className="text-white font-semibold truncate max-w-[160px]">{user?.name || "User"}</p>
              <p className="text-slate-400 font-medium capitalize">{user?.role || "Member"}</p>
            </div>
            <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-white p-1" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono px-2 py-1.5 bg-black/25 rounded-md text-slate-400">
            <span>API:</span>
            {apiOnline === true ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><Wifi className="w-3 h-3" /> ONLINE</span>
            ) : apiOnline === false ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold"><WifiOff className="w-3 h-3" /> OFFLINE</span>
            ) : (
              <span className="text-slate-500">...</span>
            )}
          </div>
        </div>
      </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
        {currentView !== "stage_fullscreen" && (
        <header className="h-14 bg-white border-b border-slate-100 px-6.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-xs font-sans">
            <span className="text-slate-400">View:</span>
            <span className="font-bold text-slate-700 capitalize flex items-center gap-1">{currentView}</span>
          </div>
          <div className="flex items-center gap-4.5">
            {liveTimerState.isRunning && (
              <div className="flex items-center gap-2.5 bg-tm-maroon text-white font-mono text-[11px] px-3 py-1.5 rounded-lg border border-tm-maroon/20 shadow-sm">
                <span className="w-1.5 h-1.5 bg-tm-yellow rounded-full animate-ping" />
                <span className="font-semibold">{liveTimerState.speaker}</span>
                <span className="font-bold text-tm-yellow bg-black/20 px-1 rounded">
                  {Math.floor(liveTimerState.seconds / 60).toString().padStart(2, "0")}:{(liveTimerState.seconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/55 px-3 py-1.5 rounded-lg text-xs text-slate-600">
              <Award className="w-4 h-4 text-tm-maroon shrink-0" /><span>Pathways Portal</span>
            </div>
          </div>
        </header>
        )}

        <div className={`flex-1 overflow-y-auto ${currentView === "stage_fullscreen" ? "p-0 bg-tm-dark" : "p-6 md:p-8"}`}>
          <AnimatePresence mode="wait">
            <motion.div key={showAuthorization ? "auth" : currentView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: "easeInOut" }} className="h-full">
              {showAuthorization ? (
                <MeetingAuthorization meeting={meeting} onAuthorizeAndStart={() => { setMeeting(prev => ({ ...prev, status: "IN_PROGRESS" })); setShowAuthorization(false); navigate("/stage"); }} onCancel={() => setShowAuthorization(false)} />
              ) : (
                <>
                  {(currentView === "stage" || currentView === "stage_fullscreen") && <StageView meeting={meeting} setMeeting={setMeeting} activeTimelineItem={activeTimelineItem} liveTimerState={liveTimerState} setLiveTimerState={setLiveTimerState} sendTimerControl={sendTimerControl} stageTopic={stageTopic} sendTopicControl={sendTopicControl} onToggleFullScreen={handleToggleFullScreen} isFullScreen={currentView === "stage_fullscreen"} />}
                  {currentView === "tmod" && hasAccess("tmod") && <TMODMaster meeting={meeting} setMeeting={setMeeting} activeTimelineItem={activeTimelineItem} onUpdateTimeline={handleUpdateTimeline} onSetSpotlight={handleSetSpotlight} liveTimerState={liveTimerState} setLiveTimerState={setLiveTimerState} sendTimerControl={sendTimerControl} />}
                  {currentView === "roleplayers" && hasAccess("roleplayers") && <RolePlayers meeting={meeting} currentUser={user} timerLogs={timerLogs} ahLogs={ahLogs} grammarianLogs={grammarianLogs} topicsPrompts={topicsPrompts} onAddTimerLog={handleAddTimerLog} onUpdateAhLogs={setAhLogs} onUpdateGrammarianLogs={setGrammarianLogs} onUpdateTopicsPrompts={setTopicsPrompts} liveTimerState={liveTimerState} setLiveTimerState={setLiveTimerState} sendTimerControl={sendTimerControl} stageTopic={stageTopic} sendTopicControl={sendTopicControl} />}
                  {currentView === "evaluations" && hasAccess("evaluations") && <Evaluations meeting={meeting} evaluations={evaluations} onAddEvaluation={handleAddEvaluation} />}
                  {currentView === "archive" && hasAccess("archive") && <Archive meeting={meeting} timerLogs={timerLogs} ahLogs={ahLogs} grammarianLogs={grammarianLogs} pastMeetings={pastMeetings} onAddPastMeeting={handleAddPastMeeting} onUpdatePastMeeting={handleUpdatePastMeeting} />}
                  {currentView === "governance" && hasAccess("governance") && <Governance meeting={meeting} polls={polls} onUpdatePolls={setPolls} onApproveCurrentMOM={handleApproveCurrentMOM} />}
                  {currentView === "performance" && hasAccess("performance") && <ClubPerformance />}
                  {currentView === "members" && hasAccess("members") && <Members meeting={meeting} setMeeting={setMeeting} />}
                  {currentView === "permissions" && hasAccess("permissions") && <AccessControl meeting={meeting} setMeeting={setMeeting} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/40">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F2DF74] border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/stage" element={<ProtectedRoute><StagePage /></ProtectedRoute>} />
      <Route path="/vote/:meetCode" element={<VotePage />} />
      <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}