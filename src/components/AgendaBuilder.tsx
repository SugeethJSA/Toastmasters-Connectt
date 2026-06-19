import React, { useState, useRef } from "react";
import { GripVertical, Plus, Save, Trash2, Clock, User, FileText, Crown } from "lucide-react";
import { Meeting, TimelineItem, MeetingSegment } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "";

const SEGMENT_COLORS: Record<string, string> = {
  PREPARED_SPEECH: "border-l-blue-500",
  TABLE_TOPICS: "border-l-amber-500",
  EVALUATION: "border-l-emerald-500",
  BUSINESS: "border-l-purple-500",
};

const SEGMENT_BG: Record<string, string> = {
  PREPARED_SPEECH: "bg-blue-50",
  TABLE_TOPICS: "bg-amber-50",
  EVALUATION: "bg-emerald-50",
  BUSINESS: "bg-purple-50",
};

const BASE_PRESETS: { role: string; segment: MeetingSegment; durationMin: number }[] = [
  { role: "Sergeant at Arms", segment: MeetingSegment.BUSINESS, durationMin: 2 },
  { role: "Toastmaster of the Day", segment: MeetingSegment.BUSINESS, durationMin: 3 },
  { role: "Grammarian", segment: MeetingSegment.BUSINESS, durationMin: 1 },
  { role: "Ah Counter", segment: MeetingSegment.BUSINESS, durationMin: 1 },
  { role: "Timer", segment: MeetingSegment.BUSINESS, durationMin: 1 },
  { role: "Table Topics Master", segment: MeetingSegment.TABLE_TOPICS, durationMin: 1 },
  { role: "Table Topics Speaker", segment: MeetingSegment.TABLE_TOPICS, durationMin: 2 },
  { role: "General Evaluator", segment: MeetingSegment.EVALUATION, durationMin: 2 },
];

interface AgendaBuilderProps {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
}

export const AgendaBuilder: React.FC<AgendaBuilderProps> = ({ meeting, setMeeting }) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [customTab, setCustomTab] = useState<"preset" | "speech" | "eval" | "custom">("preset");
  const [customRole, setCustomRole] = useState("");
  const [customSegment, setCustomSegment] = useState<MeetingSegment>(MeetingSegment.BUSINESS);
  const [customDuration, setCustomDuration] = useState(5);

  const speakerCount = meeting.timeline.filter(t => t.segment === MeetingSegment.PREPARED_SPEECH).length;
  const evalCount = meeting.timeline.filter(t => t.segment === MeetingSegment.EVALUATION).length;

  const getNextSpeakerN = () => speakerCount + 1;
  const getNextEvalN = () => evalCount + 1;

  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const items = [...meeting.timeline];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(idx, 0, moved);
    const reindexed = items.map((item, i) => ({ ...item, id: `item-${i + 1}` }));
    setMeeting(prev => ({ ...prev, timeline: reindexed }));
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  const handleRemove = (idx: number) => {
    setMeeting(prev => ({ ...prev, timeline: prev.timeline.filter((_, i) => i !== idx) }));
  };

  const addItem = (role: string, segment: MeetingSegment, durationMin: number) => {
    const lastItem = meeting.timeline[meeting.timeline.length - 1];
    const lastTime = lastItem?.time || "19:00";
    const [h, m] = lastTime.split(":").map(Number);
    const newMin = m + (lastItem?.durationMin ?? 0) + 2;
    const newTime = `${String(h + Math.floor(newMin / 60)).padStart(2, "0")}:${String(newMin % 60).padStart(2, "0")}`;
    const newItem: TimelineItem = {
      id: `item-${Date.now()}`,
      time: newTime,
      durationMin,
      role,
      player: "",
      segment,
      completed: false,
    };
    setMeeting(prev => ({ ...prev, timeline: [...prev.timeline, newItem] }));
  };

  const handleAddPreset = (preset: typeof BASE_PRESETS[0]) => {
    addItem(preset.role, preset.segment, preset.durationMin);
  };

  const handleAddSpeaker = () => {
    const n = getNextSpeakerN();
    addItem(`Speaker ${n}`, MeetingSegment.PREPARED_SPEECH, 7);
  };

  const handleAddEvaluator = () => {
    const n = getNextEvalN();
    addItem(`Evaluator ${n}`, MeetingSegment.EVALUATION, 3);
  };

  const handleAddCustom = () => {
    if (!customRole.trim()) return;
    addItem(customRole.trim(), customSegment, customDuration);
    setCustomRole("");
  };

  const handleUpdateItem = (idx: number, updates: Partial<TimelineItem>) => {
    setMeeting(prev => {
      const items = [...prev.timeline];
      items[idx] = { ...items[idx], ...updates };
      return { ...prev, timeline: items };
    });
  };

  const handleSync = async () => {
    try {
      await fetch(`${API_BASE}/api/meetings/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(meeting),
      });
    } catch {}
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-tm-blue" /> Agenda Builder</h2>
          <p className="text-sm text-slate-500">Drag to reorder · Click to edit · Add unlimited items</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="text-xs px-3 py-1.5 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
          <button onClick={handleSync} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
            <Save className="w-3.5 h-3.5" /> Save to Meeting
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-3"><Crown className="w-3.5 h-3.5 text-amber-500" /> Presiding Officer</h3>
        <input type="text" value={meeting.presidingOfficer || ""} onChange={e => setMeeting(prev => ({ ...prev, presidingOfficer: e.target.value }))}
          placeholder="President / Presiding Officer name..." className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20" />
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Prepared Speech</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Table Topics</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Evaluation</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Business</span>
      </div>

      <div className="space-y-1.5">
        {meeting.timeline.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-sm text-slate-400">No agenda items yet. Click "Add Item" to add speakers, evaluations, and more.</p>
          </div>
        ) : (
          meeting.timeline.map((item, idx) => {
            const isOver = overIdx === idx && dragIdx !== idx;
            const segColor = SEGMENT_COLORS[item.segment] || "border-l-slate-300";
            const segBg = SEGMENT_BG[item.segment] || "bg-white";
            return (
              <div key={item.id || idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 border-l-4 ${segColor} ${segBg} cursor-grab active:cursor-grabbing transition-all ${isOver ? 'opacity-50 scale-[1.02] shadow-md' : ''} ${dragIdx === idx ? 'opacity-40' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  {editIdx === idx ? (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input type="text" value={item.role} onChange={e => handleUpdateItem(idx, { role: e.target.value })}
                          className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded" />
                        <select value={item.segment} onChange={e => handleUpdateItem(idx, { segment: e.target.value as MeetingSegment })}
                          className="text-xs px-2 py-1 border border-slate-200 rounded">
                          <option value="BUSINESS">Business</option>
                          <option value="PREPARED_SPEECH">Prepared Speech</option>
                          <option value="TABLE_TOPICS">Table Topics</option>
                          <option value="EVALUATION">Evaluation</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="w-3 h-3" /><input type="text" value={item.time} onChange={e => handleUpdateItem(idx, { time: e.target.value })} className="w-14 text-xs px-1 py-0.5 border border-slate-200 rounded" /></div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="w-3 h-3" /><input type="number" min={1} value={item.durationMin} onChange={e => handleUpdateItem(idx, { durationMin: parseInt(e.target.value) || 1 })} className="w-12 text-xs px-1 py-0.5 border border-slate-200 rounded" /> min</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 flex-1"><User className="w-3 h-3" /><input type="text" value={item.player} onChange={e => handleUpdateItem(idx, { player: e.target.value })} placeholder="Assign member..." className="flex-1 text-xs px-1 py-0.5 border border-slate-200 rounded" /></div>
                      </div>
                      {item.segment === MeetingSegment.PREPARED_SPEECH && (
                        <input type="text" value={item.title || ""} onChange={e => handleUpdateItem(idx, { title: e.target.value })} placeholder="Speech title..." className="w-full text-xs px-2 py-1 border border-slate-200 rounded" />
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{item.role}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          item.segment === "PREPARED_SPEECH" ? "bg-blue-100 text-blue-700" :
                          item.segment === "TABLE_TOPICS" ? "bg-amber-100 text-amber-700" :
                          item.segment === "EVALUATION" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
                        }`}>{item.segment.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                        <span>{item.durationMin} min</span>
                        {item.player && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.player}</span>}
                        {item.title && <span className="italic">"{item.title}"</span>}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditIdx(editIdx === idx ? null : idx)} className="p-1 text-slate-300 hover:text-tm-blue cursor-pointer" title="Edit">
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleRemove(idx)} className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Summary</h3>
        <div className="grid grid-cols-5 gap-3 text-center text-xs">
          <div><span className="font-bold text-slate-700 text-sm">{meeting.timeline.length}</span><p className="text-slate-400">Items</p></div>
          <div><span className="font-bold text-slate-700 text-sm">{meeting.timeline.reduce((s, t) => s + t.durationMin, 0)}</span><p className="text-slate-400">Total Min</p></div>
          <div><span className="font-bold text-slate-700 text-sm">{speakerCount}</span><p className="text-slate-400">Speakers</p></div>
          <div><span className="font-bold text-slate-700 text-sm">{evalCount}</span><p className="text-slate-400">Evaluators</p></div>
          <div><span className="font-bold text-slate-700 text-sm">{meeting.timeline.filter(t => !t.player).length}</span><p className="text-slate-400">Unassigned</p></div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Add Agenda Item</h3>

            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4">
              {(["preset", "speech", "eval", "custom"] as const).map(tab => (
                <button key={tab} onClick={() => setCustomTab(tab)}
                  className={`flex-1 text-[10px] px-2 py-1.5 rounded-md font-semibold capitalize cursor-pointer transition-colors ${customTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab === "preset" ? "Presets" : tab === "speech" ? `Speech (${getNextSpeakerN()})` : tab === "eval" ? `Eval (${getNextEvalN()})` : "Custom"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {customTab === "preset" && (
                <div className="grid grid-cols-2 gap-2">
                  {BASE_PRESETS.map((preset, i) => (
                    <button key={i} onClick={() => { handleAddPreset(preset); setShowAdd(false); }}
                      className={`text-left p-3 rounded-lg border text-xs hover:border-tm-blue/50 transition-colors cursor-pointer ${SEGMENT_BG[preset.segment]} border-slate-200`}>
                      <p className="font-semibold text-slate-700">{preset.role}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{preset.segment.replace("_", " ")} · {preset.durationMin} min</p>
                    </button>
                  ))}
                </div>
              )}

              {customTab === "speech" && (
                <div className="text-center py-6">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Add Speaker #{getNextSpeakerN()}</p>
                  <p className="text-xs text-slate-400 mb-4">7 minutes · Prepared Speech segment</p>
                  <button onClick={() => { handleAddSpeaker(); setShowAdd(false); }}
                    className="px-6 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 cursor-pointer">
                    + Add Speaker {getNextSpeakerN()}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-3">You can always add more speakers after this one.</p>
                </div>
              )}

              {customTab === "eval" && (
                <div className="text-center py-6">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Add Evaluator #{getNextEvalN()}</p>
                  <p className="text-xs text-slate-400 mb-4">3 minutes · Evaluation segment</p>
                  <button onClick={() => { handleAddEvaluator(); setShowAdd(false); }}
                    className="px-6 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 cursor-pointer">
                    + Add Evaluator {getNextEvalN()}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-3">Add as many evaluators as you need.</p>
                </div>
              )}

              {customTab === "custom" && (
                <div className="space-y-3 py-2">
                  <input type="text" value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Role name (e.g. Joke Master, Inspiration)" autoFocus
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={customSegment} onChange={e => setCustomSegment(e.target.value as MeetingSegment)}
                      className="text-xs px-3 py-2 border border-slate-200 rounded-lg">
                      <option value="BUSINESS">Business</option>
                      <option value="PREPARED_SPEECH">Prepared Speech</option>
                      <option value="TABLE_TOPICS">Table Topics</option>
                      <option value="EVALUATION">Evaluation</option>
                    </select>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <input type="number" min={1} value={customDuration} onChange={e => setCustomDuration(parseInt(e.target.value) || 1)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" /> min
                    </div>
                  </div>
                  <button onClick={() => { handleAddCustom(); setShowAdd(false); }} disabled={!customRole.trim()}
                    className="w-full text-xs px-3 py-2 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50">Add Custom Item</button>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
