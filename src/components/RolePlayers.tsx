import React, { useState, useEffect, useRef } from "react";
import { TimerLog, AhCounterLog, FillerCount, GrammarianUse, TableTopicsPrompt, MeetingSegment, Meeting } from "../types";
import { 
  Play, Pause, RotateCcw, Save, Plus, Minus, UserCheck, Sparkles, ChevronRight,
  Shuffle, HelpCircle, FilePlus, MessageSquare, Award, Volume2, LayoutGrid, Loader2
} from "lucide-react";

interface RolePlayersProps {
  meeting: Meeting;
  currentUser: { name: string; role: string } | null;
  timerLogs: TimerLog[];
  ahLogs: AhCounterLog[];
  grammarianLogs: GrammarianUse[];
  topicsPrompts: TableTopicsPrompt[];
  
  onAddTimerLog: (log: TimerLog) => void;
  onUpdateAhLogs: (logs: AhCounterLog[]) => void;
  onUpdateGrammarianLogs: (logs: GrammarianUse[]) => void;
  onUpdateTopicsPrompts: (prompts: TableTopicsPrompt[]) => void;
  
  // Connect timer to main stage state
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
}

export const RolePlayers: React.FC<RolePlayersProps> = ({
  meeting,
  currentUser,
  timerLogs,
  ahLogs,
  grammarianLogs,
  topicsPrompts,
  onAddTimerLog,
  onUpdateAhLogs,
  onUpdateGrammarianLogs,
  onUpdateTopicsPrompts,
  liveTimerState,
  setLiveTimerState,
  sendTimerControl,
  stageTopic,
  sendTopicControl
}) => {
  const name = currentUser?.name || "";
  const isAssignedTimer = meeting.timer === name;
  const isAssignedAh = meeting.ahCounter === name;
  const isAssignedGrammarian = meeting.grammarian === name;
  const isAssignedTopics = meeting.tableTopicsMaster === name;
  const isAssignedSpeaker = meeting.timeline.some(t => t.segment === "PREPARED_SPEECH" && t.player === name);
  const isAdminOrOfficer = currentUser?.role === "admin" || currentUser?.role === "officer";

  const tabs: { key: "timer" | "ah" | "grammarian" | "topics"; label: string; icon: string }[] = [];
  if (isAdminOrOfficer || isAssignedTimer || isAssignedSpeaker) tabs.push({ key: "timer", label: "Timer Player Desk", icon: "⏱️" });
  if (isAdminOrOfficer || isAssignedAh) tabs.push({ key: "ah", label: "Ah-Counter Clickers", icon: "👥" });
  if (isAdminOrOfficer || isAssignedGrammarian) tabs.push({ key: "grammarian", label: "Grammarian Tracker", icon: "✍️" });
  if (isAdminOrOfficer || isAssignedTopics) tabs.push({ key: "topics", label: "Impromptu Topics Deck", icon: "🎯" });

  const firstSpeaker = meeting.timeline.find(t => t.player)?.player || meeting.timer || "";

  const [activeTab, setActiveTab] = useState<"timer" | "ah" | "grammarian" | "topics">(tabs[0]?.key || "timer");

  // --- TIMER STATE CONTROL ---
  const [timerSpeaker, setTimerSpeaker] = useState(meeting.timer || firstSpeaker);
  const [timerRole, setTimerRole] = useState("Prepared Speaker");
  const [timerSegment, setTimerSegment] = useState<MeetingSegment>(MeetingSegment.PREPARED_SPEECH);
  const [minMin, setMinMin] = useState(5); // green card limit minutes
  const [targetMin, setTargetMin] = useState(6); // yellow card limit minutes 
  const [maxMin, setMaxMin] = useState(7); // red card limit minutes

  // Auto-sync parent constraints whenever the local segments edit state changes
  useEffect(() => {
    setLiveTimerState(prev => ({
      ...prev,
      minSeconds: minMin * 60,
      yellowSeconds: targetMin * 60,
      maxSeconds: maxMin * 60
    }));
  }, [minMin, targetMin, maxMin]);

  // Handle segment preset timings change
  const handleTimerSegmentChange = (seg: MeetingSegment) => {
    setTimerSegment(seg);
    if (seg === MeetingSegment.PREPARED_SPEECH) {
      setTimerRole("Prepared Speaker");
      setMinMin(5); setTargetMin(6); setMaxMin(7);
    } else if (seg === MeetingSegment.TABLE_TOPICS) {
      setTimerRole("Table Topics Speaker");
      setMinMin(1); setTargetMin(1.5); setMaxMin(2);
    } else if (seg === MeetingSegment.EVALUATION) {
      setTimerRole("Evaluator");
      setMinMin(2); setTargetMin(2.5); setMaxMin(3);
    } else {
      setTimerRole("Business Presenter");
      setMinMin(4); setTargetMin(5); setMaxMin(6);
    }
  };

  const startTimer = () => {
    setLiveTimerState(prev => ({
      ...prev,
      isRunning: true,
      speaker: timerSpeaker,
      role: timerRole,
      minSeconds: minMin * 60,
      yellowSeconds: targetMin * 60,
      maxSeconds: maxMin * 60
    }));
    sendTimerControl("start", { speaker: timerSpeaker, role: timerRole, minSeconds: minMin * 60, yellowSeconds: targetMin * 60, maxSeconds: maxMin * 60 });
  };

  const pauseTimer = () => {
    setLiveTimerState(prev => ({ ...prev, isRunning: false }));
    sendTimerControl("pause");
  };

  const resetTimer = () => {
    setLiveTimerState(prev => ({
      ...prev,
      isRunning: false,
      seconds: 0,
      signal: "NONE",
      speaker: timerSpeaker,
      role: timerRole,
      minSeconds: minMin * 60,
      yellowSeconds: targetMin * 60,
      maxSeconds: maxMin * 60
    }));
    sendTimerControl("reset", { speaker: timerSpeaker, role: timerRole, minSeconds: minMin * 60, yellowSeconds: targetMin * 60, maxSeconds: maxMin * 60 });
  };

  const formatTimerString = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleRecordTimer = () => {
    const newLog: TimerLog = {
      id: "log-" + Date.now(),
      speaker: liveTimerState.speaker || timerSpeaker,
      role: liveTimerState.role || timerRole,
      segment: timerSegment,
      timeString: formatTimerString(liveTimerState.seconds),
      seconds: liveTimerState.seconds,
      signal: liveTimerState.signal,
      minSeconds: minMin * 60,
      maxSeconds: maxMin * 60,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onAddTimerLog(newLog);
    resetTimer();
  };

  // --- AH-COUNTER STATE & INCREMENTERS ---
  const handleAhCounterIncrement = (speaker: string, type: keyof FillerCount, delta: number) => {
    const existingLog = ahLogs.find(log => log.speaker === speaker);
    if (!existingLog) {
      // Create new
      const newFillerLog: AhCounterLog = {
        id: "ah-" + Date.now(),
        speaker,
        role: "Speaker/Evaluator",
        counts: { ah: 0, um: 0, er: 0, well: 0, so: 0, repeats: 0, [type]: Math.max(0, delta) }
      };
      onUpdateAhLogs([...ahLogs, newFillerLog]);
    } else {
      const updated = ahLogs.map(log => {
        if (log.speaker === speaker) {
          return {
            ...log,
            counts: {
              ...log.counts,
              [type]: Math.max(0, log.counts[type] + delta)
            }
          };
        }
        return log;
      });
      onUpdateAhLogs(updated);
    }
  };

  const [newAhNotes, setNewAhNotes] = useState("");
  const [selectedAhSpeaker, setSelectedAhSpeaker] = useState(firstSpeaker);
  const handleSaveAhNotes = () => {
    const existingLog = ahLogs.find(log => log.speaker === selectedAhSpeaker);
    if (existingLog) {
      const updated = ahLogs.map(log => {
        if (log.speaker === selectedAhSpeaker) {
          return { ...log, notes: newAhNotes };
        }
        return log;
      });
      onUpdateAhLogs(updated);
      setNewAhNotes("");
    }
  };

  // --- GRAMMARIAN COCKPIT STATE ---
  const [grammarianSelectedSpeaker, setGrammarianSelectedSpeaker] = useState(firstSpeaker);
  const [elegantWordForm, setElegantWordForm] = useState("");
  const [grammarianMistakeForm, setGrammarianMistakeForm] = useState("");

  const handleUpdateGrammarianStats = (type: "wod" | "pod", delta: number) => {
    const existing = grammarianLogs.find(log => log.speaker === grammarianSelectedSpeaker);
    if (!existing) {
      const newGrammarLog: GrammarianUse = {
        speaker: grammarianSelectedSpeaker,
        role: "Speaker",
        wodUsedCount: type === "wod" ? Math.max(0, delta) : 0,
        podUsedCount: type === "pod" ? Math.max(0, delta) : 0,
        elegantWordsLog: [],
        fillerMistakesLog: []
      };
      onUpdateGrammarianLogs([...grammarianLogs, newGrammarLog]);
    } else {
      const updated = grammarianLogs.map(log => {
        if (log.speaker === grammarianSelectedSpeaker) {
          return {
            ...log,
            wodUsedCount: type === "wod" ? Math.max(0, log.wodUsedCount + delta) : log.wodUsedCount,
            podUsedCount: type === "pod" ? Math.max(0, log.podUsedCount + delta) : log.podUsedCount
          };
        }
        return log;
      });
      onUpdateGrammarianLogs(updated);
    }
  };

  const handleAddElegantPhrasing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elegantWordForm.trim()) return;

    const existing = grammarianLogs.find(log => log.speaker === grammarianSelectedSpeaker);
    if (!existing) {
      const newGrammarLog: GrammarianUse = {
        speaker: grammarianSelectedSpeaker,
        role: "Speaker",
        wodUsedCount: 0,
        podUsedCount: 0,
        elegantWordsLog: [elegantWordForm],
        fillerMistakesLog: []
      };
      onUpdateGrammarianLogs([...grammarianLogs, newGrammarLog]);
    } else {
      const updated = grammarianLogs.map(log => {
        if (log.speaker === grammarianSelectedSpeaker) {
          return {
            ...log,
            elegantWordsLog: [...log.elegantWordsLog, elegantWordForm]
          };
        }
        return log;
      });
      onUpdateGrammarianLogs(updated);
    }
    setElegantWordForm("");
  };

  const handleAddGrammarSlipup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grammarianMistakeForm.trim()) return;

    const existing = grammarianLogs.find(log => log.speaker === grammarianSelectedSpeaker);
    if (!existing) {
      const newGrammarLog: GrammarianUse = {
        speaker: grammarianSelectedSpeaker,
        role: "Speaker",
        wodUsedCount: 0,
        podUsedCount: 0,
        elegantWordsLog: [],
        fillerMistakesLog: [grammarianMistakeForm]
      };
      onUpdateGrammarianLogs([...grammarianLogs, newGrammarLog]);
    } else {
      const updated = grammarianLogs.map(log => {
        if (log.speaker === grammarianSelectedSpeaker) {
          return {
            ...log,
            fillerMistakesLog: [...log.fillerMistakesLog, grammarianMistakeForm]
          };
        }
        return log;
      });
      onUpdateGrammarianLogs(updated);
    }
    setGrammarianMistakeForm("");
  };


  // --- TABLE TOPICS MASTER & AI GENERATOR ---
  const [aiPromptsCount, setAiPromptsCount] = useState(5);
  const [aiPromptsLoading, setAiPromptsLoading] = useState(false);
  const [shufflingIdx, setShufflingIdx] = useState<number | null>(null);

  const handleCallAIPrompts = async () => {
    setAiPromptsLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/api/gemini/generate-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          theme: meeting.theme,
          count: aiPromptsCount
        })
      });
      const data = await res.json();
      if (data.prompts && data.prompts.length > 0) {
        onUpdateTopicsPrompts([...topicsPrompts, ...data.prompts]);
      } else if (data.text) {
        // Fallback parser for raw output format
        alert("Received text format from Gemini. Parsed to table topics logs. Details: " + data.text);
      }
    } catch (err: any) {
      console.error(err);
      alert("AI Prompts generation failed. Falling back to simulated prompt card additions. Error: " + err.message);
    } finally {
      setAiPromptsLoading(false);
    }
  };

  const handleShufflePrompt = () => {
    if (topicsPrompts.length === 0) return;
    setShufflingIdx(0);
    let count = 0;
    const interval = setInterval(() => {
      setShufflingIdx(Math.floor(Math.random() * topicsPrompts.length));
      count++;
      if (count > 8) {
        clearInterval(interval);
      }
    }, 150);
  };

  const handleTogglePromptStart = (id: string) => {
    const p = topicsPrompts.find(t => t.id === id);
    const updated = topicsPrompts.map(p => {
      if (p.id === id) {
        return { ...p, started: !p.started };
      }
      return p;
    });
    onUpdateTopicsPrompts(updated);
    if (p && !p.started) {
      sendTopicControl("show", { id: p.id, prompt: p.prompt, theme: p.theme, assignedSpeaker: p.assignedSpeaker });
    } else if (p?.started) {
      sendTopicControl("hide");
    }
  };

  const handleDeletePrompt = (id: string) => {
    onUpdateTopicsPrompts(topicsPrompts.filter(p => p.id !== id));
    if (stageTopic?.id === id) {
      sendTopicControl("hide");
    }
  };

  const handleAssignSpeaker = (id: string, speakerName: string) => {
    const updated = topicsPrompts.map(p => {
      if (p.id === id) {
        return { ...p, assignedSpeaker: speakerName };
      }
      return p;
    });
    onUpdateTopicsPrompts(updated);
  };

  const handleCreatePromptCustom = (text: string) => {
    if (!text.trim()) return;
    const newTopic: TableTopicsPrompt = {
      id: "prompt-" + Date.now(),
      prompt: text,
      theme: meeting.theme,
      started: false
    };
    onUpdateTopicsPrompts([newTopic, ...topicsPrompts]);
  };

  const [customTopicInput, setCustomTopicInput] = useState("");

  // Dynamically build participant list from meeting data + registered users
  const [registeredUsers, setRegisteredUsers] = useState<{ name: string; email: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const API_BASE = import.meta.env.VITE_API_URL || "";
    fetch(`${API_BASE}/api/users`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.users) setRegisteredUsers(data.users.map((u: any) => ({ name: u.name, email: u.email })));
      })
      .catch(() => {})
    return () => controller.abort();
  }, []);

  const registeredNames = registeredUsers.map(u => u.name);

  // All unique participants (for context, not directly used in dropdowns)
  const allParticipants = Array.from(new Set([
    ...registeredNames,
    ...meeting.timeline.map(t => t.player),
    meeting.toastmasterOfTheDay,
    meeting.timer,
    meeting.ahCounter,
    meeting.grammarian,
    meeting.tableTopicsMaster,
    meeting.generalEvaluator,
    ...meeting.guestList.map(g => `${g} (Guest)`),
  ])).filter(Boolean);

  // Simply use all participants for the dropdowns so any registered user can be selected!
  const timerParticipants = allParticipants;
  const speakerParticipants = allParticipants;
  const topicsParticipants = allParticipants;

  return (
    <div id="role-players-integrated-dashboard" className="space-y-6">
      
      {/* Role Tabs Nav Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/40">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold font-display tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-[#004165] text-white shadow"
                : "text-slate-600 hover:bg-white/50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB COCKPIT */}
      <div className="font-sans">
        
        {/* TAB 1: TIMER COCKPIT */}
        {activeTab === "timer" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
            {/* Stopwatch Panel */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800">Timer Stopwatch Console</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Controls physical lighting system projected on Stage View.</p>
                </div>
                {liveTimerState.isRunning && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded border border-emerald-200 animate-pulse">
                    Live Broadcast Active
                  </span>
                )}
              </div>

              {/* Presets and Speaker Selection Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold">Allocated Speaker</label>
                  <select
                    value={timerSpeaker}
                    onChange={(e) => setTimerSpeaker(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {timerParticipants.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold">Speech Timing Segment Category</label>
                  <select
                    value={timerSegment}
                    onChange={(e) => handleTimerSegmentChange(e.target.value as MeetingSegment)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value={MeetingSegment.PREPARED_SPEECH}>Prepared Speech Preset (5-7 mins)</option>
                    <option value={MeetingSegment.TABLE_TOPICS}>Table Topics Preset (1-2 mins)</option>
                    <option value={MeetingSegment.EVALUATION}>Evaluations Preset (2-3 mins)</option>
                    <option value={MeetingSegment.BUSINESS}>Business Presenter (4-6 mins)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic stopwatch clock */}
              <div className="bg-slate-900 rounded-2xl py-12 text-center relative overflow-hidden border border-slate-800 shadow-inner">
                {/* Visual light backing depending on active signal */}
                {liveTimerState.signal === "GREEN" && <div className="absolute inset-0 bg-emerald-500/10" />}
                {liveTimerState.signal === "YELLOW" && <div className="absolute inset-0 bg-amber-500/10" />}
                {liveTimerState.signal === "RED" && <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />}

                <span className="text-6xl md:text-7xl font-bold font-mono text-white tracking-wide relative z-10">
                  {formatTimerString(liveTimerState.seconds)}
                </span>

                <div className="flex justify-center gap-3 mt-6 relative z-10">
                  {!liveTimerState.isRunning ? (
                    <button
                      onClick={startTimer}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold font-display uppercase tracking-widest flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Start
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-semibold font-display uppercase tracking-widest flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-slate-900" /> Pause
                    </button>
                  )}

                  <button
                    onClick={resetTimer}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-xs font-semibold font-display uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>

                  <button
                    onClick={handleRecordTimer}
                    disabled={liveTimerState.seconds === 0}
                    className="px-5 py-2 bg-tm-blue hover:bg-tm-dark text-white rounded-lg text-xs font-semibold font-display uppercase tracking-widest flex items-center gap-1.5 shadow disabled:opacity-40 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Log Record
                  </button>
                </div>

                <div className="flex justify-center gap-6 mt-6 font-mono text-[10px] text-slate-400 font-bold relative z-10">
                  <span>🟢 GREEN Limit: {minMin}:00</span>
                  <span>🟡 YELLOW Limit: {targetMin}:00</span>
                  <span>🔴 RED Limit: {maxMin}:00</span>
                </div>
              </div>
            </div>

            {/* Timer log list */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-2">
                <FilePlus className="w-4.5 h-4.5 text-tm-maroon" /> Logged Timing Records
              </h3>

              <div className="divide-y divide-slate-100 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {timerLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No official timing records compiled yet.</p>
                ) : (
                  timerLogs.map((log) => (
                    <div key={log.id} className="pt-3 text-xs flex items-center justify-between gap-3 font-sans">
                      <div>
                        <p className="font-semibold text-slate-800">{log.speaker}</p>
                        <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">{log.role} • {log.timestamp}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-700 font-mono text-sm">{log.timeString}</span>
                        <span className={`block text-[9px] font-mono uppercase font-bold mt-0.5 ${
                          log.signal === "GREEN" ? "text-emerald-500" :
                          log.signal === "YELLOW" ? "text-amber-500" :
                          log.signal === "RED" ? "text-rose-500" :
                          "text-slate-400"
                        }`}>
                          {log.signal || "NONE"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AH-COUNTER CLICKERS */}
        {activeTab === "ah" && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Filler Words Increment Cockpit</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick-tap counters to log unrequested repetitive sounds per participant.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-sans">
                  <span className="text-slate-500 font-medium">Add Quick Notes for:</span>
                  <select
                    value={selectedAhSpeaker}
                    onChange={(e) => setSelectedAhSpeaker(e.target.value)}
                    className="px-2 py-1.5 rounded border border-slate-200 font-sans"
                  >
                    {speakerParticipants.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Notes (e.g. Excellent pause control)"
                  value={newAhNotes}
                  onChange={(e) => setNewAhNotes(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 outline-none font-sans"
                />
                <button
                  type="button"
                  onClick={handleSaveAhNotes}
                  className="px-3.5 py-1.5 bg-tm-blue hover:bg-tm-dark text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 font-display font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Speaker</th>
                    <th className="p-4 text-center">Ah / Uh</th>
                    <th className="p-4 text-center">Um / Mm</th>
                    <th className="p-4 text-center">Er / Eh</th>
                    <th className="p-4 text-center">Well</th>
                    <th className="p-4 text-center">So</th>
                    <th className="p-4 text-center">Repeats</th>
                    <th className="p-4">Notes Attached</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {speakerParticipants.map((speaker, idx) => {
                    const log = ahLogs.find(l => l.speaker === speaker) || {
                      counts: { ah: 0, um: 0, er: 0, well: 0, so: 0, repeats: 0 },
                      notes: ""
                    };
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="p-4 font-semibold text-slate-800">{speaker}</td>
                        
                        {/* Ah */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAhCounterIncrement(speaker, "ah", -1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">-</button>
                            <span className="font-mono w-5 text-center font-bold text-slate-700">{log.counts.ah}</span>
                            <button onClick={() => handleAhCounterIncrement(speaker, "ah", 1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">+</button>
                          </div>
                        </td>

                        {/* Um */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAhCounterIncrement(speaker, "um", -1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">-</button>
                            <span className="font-mono w-5 text-center font-bold text-slate-700">{log.counts.um}</span>
                            <button onClick={() => handleAhCounterIncrement(speaker, "um", 1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">+</button>
                          </div>
                        </td>

                        {/* Er */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAhCounterIncrement(speaker, "er", -1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">-</button>
                            <span className="font-mono w-5 text-center font-bold text-slate-700">{log.counts.er}</span>
                            <button onClick={() => handleAhCounterIncrement(speaker, "er", 1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">+</button>
                          </div>
                        </td>

                        {/* Well */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAhCounterIncrement(speaker, "well", -1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">-</button>
                            <span className="font-mono w-5 text-center font-bold text-slate-700">{log.counts.well}</span>
                            <button onClick={() => handleAhCounterIncrement(speaker, "well", 1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">+</button>
                          </div>
                        </td>

                        {/* So */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAhCounterIncrement(speaker, "so", -1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">-</button>
                            <span className="font-mono w-5 text-center font-bold text-slate-700">{log.counts.so}</span>
                            <button onClick={() => handleAhCounterIncrement(speaker, "so", 1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">+</button>
                          </div>
                        </td>

                        {/* Repeats */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAhCounterIncrement(speaker, "repeats", -1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">-</button>
                            <span className="font-mono w-5 text-center font-bold text-slate-700">{log.counts.repeats}</span>
                            <button onClick={() => handleAhCounterIncrement(speaker, "repeats", 1)} className="w-6 h-6 hover:bg-slate-100 border rounded flex items-center justify-center font-bold font-mono text-slate-500 cursor-pointer">+</button>
                          </div>
                        </td>

                        <td className="p-4 max-w-[200px] truncate text-slate-400 font-sans italic">
                          {log.notes || "Add quick notes above..."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GRAMMARIAN TRACKER */}
        {activeTab === "grammarian" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in text-xs font-sans">
            {/* Input logs panel */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800">Grammarian Language Logging</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Track Word of the Day usage logs, grammatical slips, and excellent quotes.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Active Speaker:</span>
                  <select
                    value={grammarianSelectedSpeaker}
                    onChange={(e) => setGrammarianSelectedSpeaker(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {speakerParticipants.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Word of Day clickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/45 shadow-sm">
                  <div>
                    <h4 className="font-semibold text-slate-700">Word of the Day: <strong className="text-tm-blue">{meeting.wordOfDay}</strong></h4>
                    <p className="text-[10px] text-slate-400 italic">Increments correct uses</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateGrammarianStats("wod", -1)} className="w-7 h-7 bg-slate-50 border rounded flex items-center justify-center text-lg font-bold hover:bg-slate-100 cursor-pointer">-</button>
                    <span className="font-mono text-base font-extrabold text-tm-blue w-6 text-center">
                      {grammarianLogs.find(l => l.speaker === grammarianSelectedSpeaker)?.wodUsedCount || 0}
                    </span>
                    <button onClick={() => handleUpdateGrammarianStats("wod", 1)} className="w-7 h-7 bg-slate-50 border rounded flex items-center justify-center text-lg font-bold hover:bg-slate-100 cursor-pointer">+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/45 shadow-sm">
                  <div>
                    <h4 className="font-semibold text-slate-700">Phrase of Day: <strong className="text-tm-maroon">"{meeting.phraseOfDay}"</strong></h4>
                    <p className="text-[10px] text-slate-400 italic">Increments correct uses</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateGrammarianStats("pod", -1)} className="w-7 h-7 bg-slate-50 border rounded flex items-center justify-center text-lg font-bold hover:bg-slate-100 cursor-pointer">-</button>
                    <span className="font-mono text-base font-extrabold text-tm-maroon w-6 text-center">
                      {grammarianLogs.find(l => l.speaker === grammarianSelectedSpeaker)?.podUsedCount || 0}
                    </span>
                    <button onClick={() => handleUpdateGrammarianStats("pod", 1)} className="w-7 h-7 bg-slate-50 border rounded flex items-center justify-center text-lg font-bold hover:bg-slate-100 cursor-pointer">+</button>
                  </div>
                </div>
              </div>

              {/* Forms to log phrases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Elegant Phrasing Form */}
                <form onSubmit={handleAddElegantPhrasing} className="space-y-2">
                  <h4 className="font-semibold font-display text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" /> Log Elegant / Colorful quotes
                  </h4>
                  <input
                    type="text"
                    value={elegantWordForm}
                    onChange={(e) => setElegantWordForm(e.target.value)}
                    placeholder="e.g. 'fossilized remnants of early tech structures'..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                  />
                  <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 cursor-pointer">
                    Commit Elegant Phrase Log
                  </button>
                </form>

                {/* Incorrect Phrasings Form */}
                <form onSubmit={handleAddGrammarSlipup} className="space-y-2">
                  <h4 className="font-semibold font-display text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-rose-600" /> Log Grammatical Slipups
                  </h4>
                  <input
                    type="text"
                    value={grammarianMistakeForm}
                    onChange={(e) => setGrammarianMistakeForm(e.target.value)}
                    placeholder="e.g. 'I didn't remembered the meeting date'..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-rose-500 bg-white"
                  />
                  <button type="submit" className="w-full py-2 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700 cursor-pointer">
                    Commit Grammatical Slipup
                  </button>
                </form>
              </div>
            </div>

            {/* Live Grammatical Logs report feed */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-2">
                <Volume2 className="w-4.5 h-4.5 text-tm-maroon" /> Live Grammarian Feed
              </h3>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {grammarianLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No language logs registered yet.</p>
                ) : (
                  grammarianLogs.map((log, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-800 text-xs">{log.speaker}</strong>
                        <div className="flex gap-2 text-[10px] font-mono">
                          <span className="bg-tm-blue/10 text-tm-blue font-bold px-1.5 py-0.5 rounded">WOD: {log.wodUsedCount}</span>
                          <span className="bg-tm-maroon/10 text-tm-maroon font-bold px-1.5 py-0.5 rounded">POD: {log.podUsedCount}</span>
                        </div>
                      </div>

                      {log.elegantWordsLog.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">🌟 Elegant Phrasing:</p>
                          <ul className="list-disc list-inside space-y-1 pl-1 mt-1 text-slate-600 italic">
                            {log.elegantWordsLog.map((word, w) => (
                              <li key={w}>"{word}"</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {log.fillerMistakesLog.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">⚠️ Recommended Corrections:</p>
                          <ul className="list-disc list-inside space-y-1 pl-1 mt-1 text-slate-600">
                            {log.fillerMistakesLog.map((word, w) => (
                              <li key={w}>"{word}"</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TABLE TOPICS IMPROMPTU DECK */}
        {activeTab === "topics" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in text-xs font-sans">
            
            {/* Active Deck & Generator */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800">Impromptu Topics Randomizer & AI Assistant</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Shuffle topic card decks, allocate participants, or generate fresh prompt arrays via AI.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShufflePrompt}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 font-semibold rounded-lg font-display uppercase tracking-wider cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" /> Shuffle Prompt
                  </button>

                  <button
                    onClick={handleCallAIPrompts}
                    disabled={aiPromptsLoading}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-tm-blue to-tm-dark text-white font-bold rounded-lg font-display uppercase tracking-wider shadow cursor-pointer disabled:opacity-40"
                  >
                    {aiPromptsLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-tm-yellow animate-bounce" />
                        <span>AI Generate fresh topics</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Shuffled Highlight Card */}
              {shufflingIdx !== null && topicsPrompts[shufflingIdx] && (
                <div className="bg-gradient-to-br from-tm-blue to-tm-dark text-white rounded-2xl p-6 text-center border-4 border-tm-yellow/40 shadow-lg space-y-3">
                  <div className="flex justify-center items-center gap-1">
                    <Award className="w-5 h-5 text-tm-yellow" />
                    <span className="font-display tracking-widest text-tm-yellow font-bold uppercase">Shuffled Drawn Card</span>
                  </div>
                  <blockquote className="text-lg md:text-xl font-display font-medium leading-relaxed italic">
                    "{topicsPrompts[shufflingIdx].prompt}"
                  </blockquote>
                  <p className="text-[10px] font-mono tracking-wider text-slate-300 uppercase mt-4">
                    Assigned Theme Focus: "{topicsPrompts[shufflingIdx].theme}"
                  </p>
                </div>
              )}

              {/* Create Custom Prompt Form */}
              <div className="flex gap-2 bg-slate-50 p-4 border border-slate-100 rounded-xl items-center">
                <input
                  type="text"
                  placeholder="Draft your own bespoke Table Topics card..."
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue font-sans"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleCreatePromptCustom(customTopicInput);
                    setCustomTopicInput("");
                  }}
                  className="px-4.5 py-2 bg-tm-maroon text-white font-semibold font-display tracking-widest uppercase rounded-lg hover:opacity-90 cursor-pointer shrink-0 text-[10px]"
                >
                  Create Card
                </button>
              </div>

              {/* List Prompts Registry */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 font-display">Active Prompt Deck Registry</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topicsPrompts.map((p) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-3 font-sans relative hover:border-slate-300 transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-slate-200/70 text-slate-600 font-mono font-bold px-2 py-0.5 rounded uppercase">
                          Topic Prompt Card
                        </span>
                        <p className="text-xs font-semibold leading-relaxed text-slate-700">"{p.prompt}"</p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/50 flex flex-wrap justify-between items-center gap-2">
                        {p.assignedSpeaker ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-tm-blue font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-tm-blue" />
                            <span>Assigned: {p.assignedSpeaker}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Assign:</span>
                            <select
                              onChange={(e) => handleAssignSpeaker(p.id, e.target.value)}
                              className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white font-sans text-slate-600"
                              defaultValue=""
                            >
                              <option value="" disabled>Select Participant</option>
                              {topicsParticipants.map((member, m) => (
                                <option key={m} value={member}>{member}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTogglePromptStart(p.id)}
                          className={`text-[9px] py-1 px-2 rounded-md font-bold uppercase transition-colors cursor-pointer ${
                            p.started 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-slate-200/80 text-slate-600 hover:bg-slate-350"
                          }`}
                        >
                          {p.started ? "On Stage" : "Draw to Stage"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePrompt(p.id)}
                          className="text-[10px] text-red-400 hover:text-red-600 ml-1 cursor-pointer font-bold"
                          title="Delete prompt"
                        >&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Impromptu tips sidebar */}
            <div className="bg-amber-50/70 border border-amber-200/40 rounded-xl p-6 text-xs text-amber-950 leading-relaxed space-y-4 shadow-sm h-fit">
              <h3 className="font-semibold text-sm font-display text-amber-950 flex items-center gap-1.5">
                <LayoutGrid className="w-4.5 h-4.5 text-amber-800" /> Educator Impromptu Tips
              </h3>
              <p className="font-sans">The Table Topics segment develops the critical skill of thinking and speaking on your feet. Follow these simple guidelines during prompting:</p>
              
              <ul className="space-y-3.5 pl-1.5 font-sans">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <strong>Pave the Path:</strong> Give guests accessible prompts and congratulate them for courage regardless of execution boundaries.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <strong>Structure:</strong> Encourage a 3-part speech: Hook (attention grabber), Body (personal narrative), and Conclusion (call to action).
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <strong>Word/Phrase of Day:</strong> Integrate "Metanoia" or "Pave the Path" to obtain bonus points in the Grammarian Log results tab.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
