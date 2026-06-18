import React, { useState } from "react";
import { TimelineItem, Meeting, MeetingSegment } from "../types";
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Check, Play, Pause, RotateCcw, FileText, Upload, Sparkles, 
  HelpCircle, ChevronRight, CornerDownRight, RefreshCw, Loader2, Image, Quote, Edit3
} from "lucide-react";

interface TMODMasterProps {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
  activeTimelineItem: TimelineItem | null;
  onUpdateTimeline: (newTimeline: TimelineItem[]) => void;
  onSetSpotlight: (item: TimelineItem | null) => void;
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
}

export const TMODMaster: React.FC<TMODMasterProps> = ({
  meeting,
  setMeeting,
  activeTimelineItem,
  onUpdateTimeline,
  onSetSpotlight,
  liveTimerState,
  setLiveTimerState,
  sendTimerControl,
}) => {
  // Local form state for adding a new timeline slot
  const [formTime, setFormTime] = useState("19:30");
  const [formDuration, setFormDuration] = useState(7);
  const [formRole, setFormRole] = useState("Prepared Speaker");
  const [formPlayer, setFormPlayer] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formSegment, setFormSegment] = useState<MeetingSegment>(MeetingSegment.PREPARED_SPEECH);

  // Meeting info editing state
  const [info, setInfo] = useState({
    name: meeting.name || "",
    number: meeting.number,
    date: meeting.date,
    theme: meeting.theme,
    meetingLink: meeting.meetingLink || "",
    toastmasterOfTheDay: meeting.toastmasterOfTheDay,
  });

  const [vocab, setVocab] = useState({
    wordOfDay: meeting.wordOfDay,
    wordOfDayDefinition: meeting.wordOfDayDefinition,
    phraseOfDay: meeting.phraseOfDay,
    phraseOfDayMeaning: meeting.phraseOfDayMeaning,
  });

  const handleSaveInfo = () => {
    setMeeting(prev => ({ ...prev, ...info }));
  };

  const handleSaveVocab = () => {
    setMeeting(prev => ({ ...prev, ...vocab }));
  };

  // AI Script assistant parameters
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiContentType, setAiContentType] = useState("Meeting Segment Introduction");
  const [aiTitle, setAiTitle] = useState("Building Resilience");
  const [aiDraftText, setAiDraftText] = useState("");
  const [aiRole, setAiRole] = useState("Toastmaster of the Day");
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // File Upload State Mock
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; role: string }[]>([
    { name: "Slowing_Down_Audrey_Chen.pdf", size: "2.4 MB", role: "Speaker 1" },
    { name: "LLM_Tech_Impact_David_Vance.pptx", size: "12.1 MB", role: "Speaker 2" }
  ]);
  const [dragOver, setDragOver] = useState(false);

  // Unified Users State for Photo Sync
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  React.useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "";
    fetch(`${API_BASE}/api/users`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.users) setRegisteredUsers(d.users); })
      .catch(() => {});
  }, []);

  const matchedUser = activeTimelineItem ? registeredUsers.find(u => u.name === activeTimelineItem.player) : null;
  const displayPhotoUrl = activeTimelineItem?.photoUrl || matchedUser?.photoUrl || "";

  // Reorder agenda timeline items
  const handleMove = (index: number, direction: "up" | "down") => {
    const list = [...meeting.timeline];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    onUpdateTimeline(list);
  };

  // Add new agenda item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlayer.trim()) return;

    const newItem: TimelineItem = {
      id: "time-" + Date.now(),
      time: formTime,
      durationMin: Number(formDuration),
      role: formRole,
      player: formPlayer,
      title: formTitle ? formTitle : undefined,
      segment: formSegment,
      completed: false,
      photoUrl: formPhotoUrl ? formPhotoUrl : undefined
    };

    onUpdateTimeline([...meeting.timeline, newItem]);
    
    // Reset form fields with incremented time estimate
    setFormPlayer("");
    setFormTitle("");
    setFormPhotoUrl("");
    const [hours, mins] = formTime.split(":").map(Number);
    let nextMins = mins + Number(formDuration);
    let nextHours = hours;
    if (nextMins >= 60) {
      nextHours = (hours + Math.floor(nextMins / 60)) % 24;
      nextMins = nextMins % 60;
    }
    setFormTime(`${nextHours.toString().padStart(2, "0")}:${nextMins.toString().padStart(2, "0")}`);
  };

  const handleDeleteItem = (id: string) => {
    const list = meeting.timeline.filter(item => item.id !== id);
    onUpdateTimeline(list);
    // If the deleted item was in spotlight, clear spotlight too
    if (activeTimelineItem?.id === id) {
      onSetSpotlight(null);
    }
  };

  const toggleCompleted = (id: string) => {
    const list = meeting.timeline.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    onUpdateTimeline(list);
  };

  // Simulate Drag and Drop File Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: `${sizeMB} MB`,
          role: "Speaker " + (prev.length + 1)
        }
      ]);
    }
  };

  // call server-side Gemini assist route
  const handleCallSpeechAssist = async () => {
    setAiLoading(true);
    setAiOutput("");
    try {
      const res = await fetch("/api/gemini/assist-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: aiContentType,
          title: aiTitle,
          draftText: aiDraftText,
          targetRole: aiRole
        })
      });
      const data = await res.json();
      if (data.error) {
        setAiOutput("Error: " + data.error);
      } else {
        setAiOutput(data.text);
      }
    } catch (err: any) {
      setAiOutput("API Connection issue. Check server logs. Details: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div id="tmod-builder-cockpit" className="space-y-6">
      {/* Title & Setup header */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">
            TMOD Cockpit & Meeting Agenda Builder
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Refine structural timing arrays, reorder slot hierarchy, project active speakers and tap AI script assistants.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMeeting(prev => ({ ...prev, status: "COMPLETED" }))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all font-display uppercase tracking-widest cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Conclude Session & Applause</span>
          </button>
        <button
          onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-tm-maroon to-tm-lightmaroon text-white text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all font-display uppercase tracking-widest cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-tm-yellow animate-spin" />
          <span>{aiAssistantOpen ? "Close AI Script Assist" : "AI Speech Script Assist"}</span>
        </button>
        </div>
      </div>

      {/* Grid: Main Agenda Builder vs Side panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Col Span 2): Main Agenda Table & Builder */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Timeline Builder List */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-display font-semibold text-sm text-slate-700">
                Segment Timeline Array ({meeting.timeline.length} Scheduled Slots)
              </h3>
              <p className="text-[10px] bg-tm-blue/15 text-tm-blue font-mono font-bold px-2 py-0.5 rounded-full uppercase leading-none">
                Interactive Drag/Ordering
              </p>
            </div>

            <div className="divide-y divide-slate-100 font-sans">
              {meeting.timeline.map((item, index) => {
                const isSpotlighted = activeTimelineItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSpotlighted ? "bg-tm-blue/5 border-l-4 border-tm-blue" : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Time & Segment details */}
                    <div className="flex gap-4 items-center shrink-0">
                      <div className="text-center bg-slate-50 border border-slate-200/60 rounded px-2.5 py-1.5 min-w-[56px] shadow-sm">
                        <span className="text-xs font-mono font-bold text-tm-blue">{item.time}</span>
                        <span className="text-[10px] block text-slate-400 font-mono font-medium">{item.durationMin}m</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            item.segment === MeetingSegment.PREPARED_SPEECH ? "bg-emerald-100 text-emerald-800" :
                            item.segment === MeetingSegment.TABLE_TOPICS ? "bg-amber-100 text-amber-800" :
                            item.segment === MeetingSegment.EVALUATION ? "bg-indigo-100 text-indigo-800" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {item.segment.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.role}</p>
                      </div>
                    </div>

                    {/* Member & Topic details */}
                  <div className="flex-1 min-w-[150px] flex items-center gap-3">
                    {item.photoUrl || registeredUsers.find(u => u.name === item.player)?.photoUrl ? (
                      <img 
                        src={item.photoUrl || registeredUsers.find(u => u.name === item.player)?.photoUrl} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-tm-blue/10 text-tm-blue flex items-center justify-center font-bold text-sm shrink-0 border-2 border-tm-blue/20">
                        {item.player.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.player}</p>
                      {item.title && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 capitalize">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="italic">"{item.title}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Quick controls: Spotlight, Complete, Move (up/down), Delete */}
                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      
                      {/* Set Spotlight */}
                      <button
                        onClick={() => onSetSpotlight(isSpotlighted ? null : item)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSpotlighted 
                            ? "bg-tm-blue text-white border-tm-blue shadow-sm" 
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                        title="Set as current active speaker on main virtual stage"
                      >
                        <Play className={`w-3 h-3 ${isSpotlighted ? "text-tm-yellow animate-pulse" : "text-slate-500"}`} />
                        <span>{isSpotlighted ? "Beaming Live" : "Spotlight"}</span>
                      </button>

                      {/* Complete toggle checkbox button */}
                      <button
                        onClick={() => toggleCompleted(item.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border cursor-pointer ${
                          item.completed 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50" 
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                        title="Mark slot as completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      {/* Moving Controls */}
                      <button
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 cursor-pointer"
                        title="Move agenda item earlier"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, "down")}
                        disabled={index === meeting.timeline.length - 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 cursor-pointer"
                        title="Move agenda item later"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Item Form */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-tm-maroon" /> Create Dynamic Slot Array
            </h3>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Time Limit Stamp</label>
                <input
                  type="text"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="e.g. 19:30"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Min Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Meeting segment category</label>
                <select
                  value={formSegment}
                  onChange={(e) => setFormSegment(e.target.value as MeetingSegment)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none bg-white"
                >
                  <option value={MeetingSegment.PREPARED_SPEECH}>Prepared Speech Slot</option>
                  <option value={MeetingSegment.TABLE_TOPICS}>Table Topics Impromptu</option>
                  <option value={MeetingSegment.EVALUATION}>Interactive Evaluation</option>
                  <option value={MeetingSegment.BUSINESS}>Governance & Business</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Role / Speaker Rank Label</label>
                <input
                  type="text"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="e.g. Speaker 3 or Evaluator 3"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Player / Participant Name</label>
                <input
                  type="text"
                  value={formPlayer}
                  onChange={(e) => setFormPlayer(e.target.value)}
                  placeholder="e.g. Chloe Jenkins"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Speech / Project Title (Optional)</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Echoes of Leadership"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none"
                />
              </div>

              <div className="md:col-span-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-tm-blue hover:bg-tm-dark text-white rounded-lg font-semibold font-display tracking-wider uppercase transition-colors text-xs cursor-pointer"
                >
                  Append New Slot to Active Agenda Array
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: AI Script Helper (If opened) or Drag-Drop Presentations */}
        <div className="space-y-6">
          
          {/* LIVE STAGE DISPLAY & DIRECTOR CONTROLS */}
          <div className="bg-white rounded-xl border border-slate-150 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-tm-dark to-tm-blue px-6 py-4 flex justify-between items-center text-white border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping shrink-0" />
                <h3 className="font-display font-bold text-sm tracking-wide">Live Stage Master Monitor</h3>
              </div>
              <span className="text-[10px] bg-[#F2DF74] text-slate-950 font-extrabold font-mono px-2 py-0.5 rounded uppercase leading-none">
                Director Cockpit
              </span>
            </div>

            <div className="p-5 space-y-4 font-sans text-xs">
              {activeTimelineItem ? (
                <div className="space-y-4.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {/* Spotlight Person details */}
                  <div className="flex items-center gap-3.5">
                    {displayPhotoUrl ? (
                      <img 
                        src={displayPhotoUrl} 
                        alt={activeTimelineItem.player} 
                        className="w-12 h-12 rounded-lg object-cover border-2 border-[#F2DF74] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-tm-blue/10 text-tm-blue flex items-center justify-center font-bold text-lg shrink-0">
                        {activeTimelineItem.player.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-tm-maroon font-extrabold uppercase tracking-wider leading-none">
                        Active {activeTimelineItem.role}
                      </p>
                      <h4 className="text-sm font-extrabold text-slate-800 font-display mt-0.5 truncate">{activeTimelineItem.player}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium leading-tight">
                        📁 {activeTimelineItem.segment.replace("_", " ")} — "{activeTimelineItem.title || 'Untitled Session'}"
                      </p>
                    </div>
                  </div>

                  {/* Quote block */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-150 relative">
                    <Quote className="absolute -top-1.5 -left-1 w-3.5 h-3.5 text-tm-maroon transform rotate-180 opacity-55" />
                    <p className="text-[10px] italic text-slate-600 line-clamp-3 pl-3">
                      "{activeTimelineItem.quote || 'No presentation quote set yet for this spot.'}"
                    </p>
                  </div>

                  {/* Inline Editors for Photo and Quote */}
                  <div className="border-t border-slate-100 pt-3 space-y-2.5">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      📝 Live-Update Spotlight Profile
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-14 pt-2 shrink-0">Photo URL:</span>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <input 
                            type="text" 
                            value={activeTimelineItem.photoUrl || ""} 
                            onChange={(e) => {
                              const updatedTimeline = meeting.timeline.map(it => {
                                if (it.id === activeTimelineItem.id) {
                                  return { ...it, photoUrl: e.target.value };
                                }
                                return it;
                              });
                              onUpdateTimeline(updatedTimeline);
                              onSetSpotlight({ ...activeTimelineItem, photoUrl: e.target.value });
                            }}
                        placeholder={matchedUser?.photoUrl ? "Using member's default profile picture..." : "Paste photo URL here to update..."} 
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] focus:outline-tm-blue bg-white"
                          />
                      {matchedUser ? (
                            <button
                              onClick={async () => {
                                try {
                              const photoToSave = activeTimelineItem.photoUrl || "";
                                  const API_BASE = import.meta.env.VITE_API_URL || "";
                                  const res = await fetch(`${API_BASE}/api/users/${matchedUser._id || matchedUser.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                body: JSON.stringify({ photoUrl: photoToSave })
                                  });
                                  if (res.ok) {
                                alert(`Photo successfully updated in ${matchedUser.name}'s unified member profile!`);
                                setRegisteredUsers(prev => prev.map(u => (u._id === matchedUser._id || u.id === matchedUser.id) ? { ...u, photoUrl: photoToSave } : u));
                                  }
                                } catch (err) {}
                              }}
                          className="text-[9px] bg-tm-blue/10 text-tm-blue hover:bg-tm-blue hover:text-white px-2 py-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors self-start mt-0.5"
                            >
                          <Image className="w-3.5 h-3.5" /> Save to {matchedUser.name}'s Account Profile
                            </button>
                      ) : (
                        <span className="text-[9px] text-amber-500 font-semibold px-1">⚠️ Guest/Unregistered: Photo only saves for this meeting session.</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-14 pt-2 shrink-0">Quote/Intro:</span>
                        <textarea 
                          rows={2}
                          value={activeTimelineItem.quote || ""} 
                          onChange={(e) => {
                            const updatedTimeline = meeting.timeline.map(it => {
                              if (it.id === activeTimelineItem.id) {
                                return { ...it, quote: e.target.value };
                              }
                              return it;
                            });
                            onUpdateTimeline(updatedTimeline);
                            onSetSpotlight({ ...activeTimelineItem, quote: e.target.value });
                          }}
                          placeholder="e.g. Stepping onto the path..." 
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] focus:outline-tm-blue bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-150 border-dashed text-slate-400 space-y-1.5">
                  <p className="font-semibold text-xs text-slate-600">No Spotlighted Speaker Selected</p>
                  <p className="text-[10px] max-w-xs mx-auto">
                    Choose one speaker slot from the segment timeline array on the left using the <strong>🎯 Spotlight Speaker</strong> buttons to sync the Live Stage.
                  </p>
                </div>
              )}

              {/* Real-time remote clock monitor & controls */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3.5 border border-slate-800">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                  <div>
                    <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Remote Timer Control Deck
                    </p>
                    <span className="text-[10px] text-[#F2DF74] font-medium block mt-1 leading-none font-sans">
                      {liveTimerState.speaker || "Idle Speaker"} ({liveTimerState.role || "No Role"})
                    </span>
                  </div>

                  {/* Huge Clock tick */}
                  <span className="text-2xl font-extrabold font-mono text-white tracking-tight shrink-0 bg-black/20 px-2.5 py-1 rounded">
                    {Math.floor(liveTimerState.seconds / 60).toString().padStart(2, "0")}:{(liveTimerState.seconds % 60).toString().padStart(2, "0")}
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="flex gap-2">
                  {liveTimerState.isRunning ? (
                    <button
                      onClick={() => { setLiveTimerState(prev => ({ ...prev, isRunning: false })); sendTimerControl("pause"); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold tracking-wider uppercase text-[10px] transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Time</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setLiveTimerState(prev => ({ ...prev, isRunning: true })); sendTimerControl("start", { speaker: liveTimerState.speaker, role: liveTimerState.role, minSeconds: liveTimerState.minSeconds, yellowSeconds: liveTimerState.yellowSeconds, maxSeconds: liveTimerState.maxSeconds }); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold tracking-wider uppercase text-[10px] transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Remote</span>
                    </button>
                  )}

                  <button
                    onClick={() => { setLiveTimerState(prev => ({ ...prev, isRunning: false, seconds: 0, signal: "NONE" })); sendTimerControl("reset"); }}
                    className="flex flex-center items-center justify-center hover:bg-white/10 text-slate-300 border border-slate-700 p-2 rounded-lg transition-colors cursor-pointer"
                    title="Reset timer to 0 seconds"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                  </button>

                  <div className="flex flex-col justify-center text-right font-mono text-[9px] text-[#F2DF74] leading-tight px-1 shrink-0">
                    <span className="text-slate-400 block font-bold">Signal Light:</span>
                    <span className="font-extrabold text-white animate-pulse block uppercase mt-0.5">
                      {liveTimerState.signal === "NONE" ? "⚫ NONE" : liveTimerState.signal === "GREEN" ? "🟢 GREEN" : liveTimerState.signal === "YELLOW" ? "🟡 YELLOW" : "🔴 RED"}
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 font-sans leading-relaxed pt-1.5 border-t border-slate-800/60 flex items-center gap-1">
                  <span>ℹ️ Limits:</span>
                  <span className="text-white font-mono">{(liveTimerState.minSeconds/60)}m</span>
                  <span>-</span>
                  <span className="text-white font-mono">{(liveTimerState.yellowSeconds/60)}m</span>
                  <span>-</span>
                  <span className="text-white font-mono">{(liveTimerState.maxSeconds/60)}m</span>
                </p>
              </div>
            </div>
          </div>

          {/* Meeting Information Card — title, number, name, link, date, WOD/POD */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Edit3 className="w-4.5 h-4.5 text-tm-maroon" /> Meeting Information
            </h3>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Meeting Name</label>
                <input type="text" value={info.name} onChange={e => setInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Meeting Number</label>
                <input type="number" value={info.number} onChange={e => setInfo(prev => ({ ...prev, number: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Title / Theme</label>
                <input type="text" value={info.theme} onChange={e => setInfo(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Date</label>
                <input type="text" value={info.date} onChange={e => setInfo(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-500 font-medium">Meeting Link (Zoom / Google Meet)</label>
                <input type="url" value={info.meetingLink} onChange={e => setInfo(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 font-medium">Toastmaster of the Day (TMOD)</label>
                <input type="text" value={info.toastmasterOfTheDay} onChange={e => setInfo(prev => ({ ...prev, toastmasterOfTheDay: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleSaveInfo}
                className="px-4 py-2 bg-tm-blue hover:bg-tm-dark text-white rounded-lg font-semibold font-display tracking-wider uppercase transition-colors text-xs cursor-pointer flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Update Meeting Info
              </button>
            </div>

            {/* Vocabulary Section */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-display font-semibold text-xs text-slate-600 mb-3 uppercase tracking-wider">Word & Phrase of the Day</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-medium">Word of the Day</label>
                  <input type="text" value={vocab.wordOfDay} onChange={e => setVocab(prev => ({ ...prev, wordOfDay: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-medium">Definition</label>
                  <input type="text" value={vocab.wordOfDayDefinition} onChange={e => setVocab(prev => ({ ...prev, wordOfDayDefinition: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-medium">Phrase of the Day</label>
                  <input type="text" value={vocab.phraseOfDay} onChange={e => setVocab(prev => ({ ...prev, phraseOfDay: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-medium">Meaning</label>
                  <input type="text" value={vocab.phraseOfDayMeaning} onChange={e => setVocab(prev => ({ ...prev, phraseOfDayMeaning: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-700 focus:outline-tm-blue outline-none" />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button type="button" onClick={handleSaveVocab}
                  className="px-4 py-2 bg-tm-blue hover:bg-tm-dark text-white rounded-lg font-semibold font-display tracking-wider uppercase transition-colors text-xs cursor-pointer flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Update Vocabulary
                </button>
              </div>
            </div>
          </div>

          {/* AI Speech Script Assistant Sidebar Block */}
          {aiAssistantOpen && (
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-tm-yellow animate-spin" />
                  <h3 className="font-display font-bold text-sm tracking-wide text-white">AI Speech Script Coach</h3>
                </div>
                <span className="text-[10px] bg-tm-maroon text-white font-semibold font-mono px-2 py-0.5 rounded leading-none">
                  Gemini Flash
                </span>
              </div>

              <div className="space-y-3.5 font-sans text-xs">
                {/* Content Type Selector */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">What are we drafting?</label>
                  <select
                    value={aiContentType}
                    onChange={(e) => setAiContentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none"
                  >
                    <option value="TMOD Introductions">TMOD Greeting Introductions</option>
                    <option value="Speaker Introduction Script">Speaker Introduction Script</option>
                    <option value="Table Topics Prompt Setup Narrative">Table Topics Prompt setup narrative</option>
                    <option value="Evaluation Starter Script">Evaluator Constructive feedback starter</option>
                  </select>
                </div>

                {/* Target Role Selector */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">For which roleplayer?</label>
                  <input
                    type="text"
                    value={aiRole}
                    onChange={(e) => setAiRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none"
                  />
                </div>

                {/* Topic/Title Parameter */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Speech Topic / Theme Focus</label>
                  <input
                    type="text"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none"
                  />
                </div>

                {/* Bullets/Rough idea summary */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Rough ideas or points (Optional)</label>
                  <textarea
                    rows={3}
                    value={aiDraftText}
                    onChange={(e) => setAiDraftText(e.target.value)}
                    placeholder="e.g. focus on Metanoia; welcome guests; keep time margins clean..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none resize-none"
                  />
                </div>

                {/* Call API Trigger */}
                <button
                  type="button"
                  onClick={handleCallSpeechAssist}
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-tm-yellow to-amber-400 hover:from-amber-400 hover:to-tm-yellow text-slate-900 rounded-lg font-bold font-display tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Writing script...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-bounce" />
                      <span>Draft Speech Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* API Output Area */}
              {aiOutput && (
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-2 mt-2">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AI ASSIST OUTPUT</p>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-1">
                    {aiOutput}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Drag-Drop presentations upload area */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-700">Presentation Slides Registry</h3>
              <p className="text-xs text-slate-400 mt-0.5">Upload presentation files and associate them with scheduled speakers.</p>
            </div>

            {/* Drag drop dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragOver ? "border-tm-blue bg-tm-blue/5 scale-[0.98]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">Drag speaker slides here, or browse files</p>
              <p className="text-[10px] text-slate-400 mt-1">Supports PDF, PPTX up to 25MB. Associated automatically.</p>
              
              <input
                type="file"
                className="hidden"
                id="slide-file-uploader"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                    setUploadedFiles(prev => [
                      ...prev,
                      { name: file.name, size: `${sizeMB} MB`, role: "Speaker " + (prev.length + 1) }
                    ]);
                  }
                }}
              />
              <label
                htmlFor="slide-file-uploader"
                className="mt-3.5 inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100/50 cursor-pointer shadow-sm"
              >
                Choose Presentation File
              </label>
            </div>

            {/* Uploaded Presentations List */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-0.5">Attached Presentation Slides</p>
              
              <div className="space-y-2.5">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 font-sans text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-tm-maroon shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Size: {file.size} • Allocated to {file.role}</p>
                      </div>
                    </div>
                    {/* Delete button from list */}
                    <button
                      onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4.5 text-xs text-amber-900 leading-relaxed space-y-2">
            <h4 className="font-display font-semibold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 shrink-0 text-amber-800" /> Administrative TMOD Note:
            </h4>
            <p className="font-sans">Ensure meeting timers comply with critical Pathways limits. When prepared speakers initiate their slots, remember to click 'Spotlight' to overlay their title, timer status, and evaluation template for the physical audience.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
