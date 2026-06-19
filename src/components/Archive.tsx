import React, { useState } from "react";
import { Meeting, TimerLog, AhCounterLog, GrammarianUse, EvaluationItem, SAAPoll, TimelineItem } from "../types";
import { 
  FileText, Download, Loader2, Edit, Save, CheckCircle, 
  User, ChevronRight, Award, Printer, Clock, MessageSquare,
  Users, BarChart3, BookOpen, Volume, List, Plus
} from "lucide-react";
import { generateMomPDF } from "../utils/pdfExport";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface ArchiveProps {
  meeting: Meeting;
  timerLogs: TimerLog[];
  ahLogs: AhCounterLog[];
  grammarianLogs: GrammarianUse[];
  evaluations: EvaluationItem[];
  polls: SAAPoll[];
  pastMeetings: any[];
  onAddPastMeeting: (meeting: any) => void;
  onUpdatePastMeeting: (id: string, updatedMOM: any) => void;
}

export const Archive: React.FC<ArchiveProps> = ({
  meeting,
  timerLogs,
  ahLogs,
  grammarianLogs,
  evaluations,
  polls,
  pastMeetings,
  onAddPastMeeting,
  onUpdatePastMeeting
}) => {
  const [selectedMOM, setSelectedMOM] = useState<any | null>(pastMeetings[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorialText, setEditorialText] = useState("");

  const handleCreateMOM = () => {
    const newMOMRecord = {
      id: "meet-" + meeting.number + "-" + Date.now(),
      number: meeting.number,
      date: meeting.date,
      theme: meeting.theme,
      wordOfDay: meeting.wordOfDay,
      phraseOfDay: meeting.phraseOfDay,
      wordOfDayDefinition: meeting.wordOfDayDefinition,
      phraseOfDayMeaning: meeting.phraseOfDayMeaning,
      toastmasterOfTheDay: meeting.toastmasterOfTheDay,
      generalEvaluator: meeting.generalEvaluator,
      tableTopicsMaster: meeting.tableTopicsMaster,
      timer: meeting.timer,
      ahCounter: meeting.ahCounter,
      grammarian: meeting.grammarian,
      sergeantAtArms: meeting.sergeantAtArms,
      editorialSummary: "",
      approved: false,
      approvedBy: "",
      timeline: meeting.timeline || [],
      timerLogs: timerLogs,
      ahLogs: ahLogs,
      grammarianLogs: grammarianLogs,
      evaluations: evaluations,
      polls: polls,
      attendance: meeting.attendance || [],
      guestList: meeting.guestList || [],
      secretaryNotes: (meeting.timeline || []).map((item: TimelineItem) => ({
        timelineItemId: item.id,
        note: ""
      }))
    };

    onAddPastMeeting(newMOMRecord);
    setSelectedMOM(newMOMRecord);
    setEditorialText("");
  };

  const handleStartEdit = () => {
    if (!selectedMOM) return;
    setEditorialText(selectedMOM.editorialSummary || "");
    setIsEditing(true);
  };

  const handleSaveMinutes = () => {
    if (!selectedMOM) return;
    const updated = {
      ...selectedMOM,
      editorialSummary: editorialText
    };
    onUpdatePastMeeting(selectedMOM.id, updated);
    setSelectedMOM(updated);
    setIsEditing(false);
  };

  const handleApproveMinutes = () => {
    if (!selectedMOM) return;
    const updated = {
      ...selectedMOM,
      approved: true,
      approvedBy: "Club President"
    };
    onUpdatePastMeeting(selectedMOM.id, updated);
    setSelectedMOM(updated);
  };

  const handleSecretaryNoteChange = (timelineItemId: string, note: string) => {
    if (!selectedMOM) return;
    const updatedNotes = (selectedMOM.secretaryNotes || []).map((n: any) =>
      n.timelineItemId === timelineItemId ? { ...n, note } : n
    );
    if (!updatedNotes.find((n: any) => n.timelineItemId === timelineItemId)) {
      updatedNotes.push({ timelineItemId, note });
    }
    const updated = { ...selectedMOM, secretaryNotes: updatedNotes };
    onUpdatePastMeeting(selectedMOM.id, updated);
    setSelectedMOM(updated);
  };

  const getSecretaryNote = (timelineItemId: string): string => {
    if (!selectedMOM?.secretaryNotes) return "";
    const found = selectedMOM.secretaryNotes.find((n: any) => n.timelineItemId === timelineItemId);
    return found?.note || "";
  };

  const totalFillerWords = (log: any) => {
    if (!log?.counts) return 0;
    return (log.counts.ah || 0) + (log.counts.um || 0) + (log.counts.er || 0) +
           (log.counts.well || 0) + (log.counts.so || 0) + (log.counts.repeats || 0);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "GREEN": return "text-emerald-600 bg-emerald-50";
      case "YELLOW": return "text-amber-600 bg-amber-50";
      case "RED": return "text-rose-600 bg-rose-50";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  const getScoreAverage = (scores: any) => {
    if (!scores) return 0;
    const vals = Object.values(scores) as number[];
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "0";
  };

  const getAhWinner = () => {
    if (!ahLogs || ahLogs.length === 0) return null;
    const withTotals = ahLogs.map(l => ({ ...l, total: totalFillerWords(l) }));
    const minTotal = Math.min(...withTotals.map(l => l.total));
    const winner = withTotals.find(l => l.total === minTotal && l.total >= 0);
    return winner;
  };

  const formatSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div id="meeting-minutes-archives" className="space-y-6">
      
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">
            Secretary Console & Meeting Minutes
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Review all meeting data and draft the official minutes of the meeting.
          </p>
        </div>

        <button
          onClick={handleCreateMOM}
          className="flex items-center gap-2 px-5 py-2.5 bg-tm-blue hover:bg-tm-dark text-white text-xs font-semibold rounded-lg font-display uppercase tracking-widest transition-all shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create MOM from Current Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans text-xs">
        
        {/* Left Column: Past Meetings List */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-700 pb-3 border-b border-slate-100">
              Minutes Ledger Archives ({pastMeetings.length} Records)
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {pastMeetings.length === 0 && (
                <p className="text-slate-400 text-center py-6">No archived meetings yet. Create one from the current meeting data.</p>
              )}
              {pastMeetings.map((item) => {
                const isSelected = selectedMOM?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedMOM(item);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                      isSelected 
                        ? "bg-tm-blue/5 border-tm-blue/60 shadow-sm" 
                        : "bg-slate-50 border-slate-200/50 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800">Meeting #{item.number}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.date} &bull; {item.theme}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.approved ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/40 rounded-xl p-5 text-amber-950 leading-relaxed font-sans space-y-2.5">
            <h4 className="font-semibold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 font-display text-[11px]">
              <CheckCircle className="w-4 h-4 text-amber-800" /> Secretary's Guide
            </h4>
            <p>Review each section below and add your observations as Secretary Notes for each agenda item. The narrative summary at the bottom serves as the official minutes preamble.</p>
          </div>
        </div>

        {/* Right Panels: MOM Detail View */}
        <div className="xl:col-span-2">
          {selectedMOM ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-lg overflow-hidden">
              
              {/* Letterhead Header */}
              <div className="bg-[#002a44] text-white p-6 md:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] bg-tm-yellow text-slate-900 font-bold font-display px-2.5 py-1 rounded tracking-widest uppercase">
                      Official Club Record
                    </span>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white mt-1.5">
                      TOASTMASTERS INTERNATIONAL
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">Sophrosyne VIT Area F4 District 120</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!selectedMOM) return;
                        generateMomPDF({
                          clubName: "Sophrosyne VIT Area F4 District 120",
                          meetingNumber: selectedMOM.number,
                          date: selectedMOM.date,
                          theme: selectedMOM.theme || meeting.theme,
                          wordOfDay: selectedMOM.wordOfDay || meeting.wordOfDay,
                          phraseOfDay: selectedMOM.phraseOfDay || meeting.phraseOfDay,
                          toastmasterOfTheDay: selectedMOM.toastmasterOfTheDay || meeting.toastmasterOfTheDay,
                          generalEvaluator: selectedMOM.generalEvaluator || meeting.generalEvaluator,
                          tableTopicsMaster: selectedMOM.tableTopicsMaster || meeting.tableTopicsMaster,
                          timer: selectedMOM.timer || meeting.timer,
                          ahCounter: selectedMOM.ahCounter || meeting.ahCounter,
                          grammarian: selectedMOM.grammarian || meeting.grammarian,
                          sergeantAtArms: selectedMOM.sergeantAtArms || meeting.sergeantAtArms,
                          editorialSummary: selectedMOM.editorialSummary || "",
                          approved: selectedMOM.approved,
                          approvedBy: selectedMOM.approvedBy,
                          attendance: selectedMOM.attendance || [],
                          timerLogs: selectedMOM.timerLogs || [],
                          evaluations: selectedMOM.evaluations || [],
                          guestList: selectedMOM.guestList || [],
                        });
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded text-[11px] font-semibold text-white tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Export PDF
                    </button>
                    {!selectedMOM.approved && (
                      <button
                        onClick={handleApproveMinutes}
                        className="px-3.5 py-1.5 bg-tm-maroon hover:opacity-90 text-white rounded text-[11px] font-bold tracking-wider flex items-center gap-1 cursor-pointer border border-tm-maroon/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 font-mono text-[10px] text-slate-300">
                  <div><strong className="text-slate-400 uppercase">Meeting:</strong> #{selectedMOM.number}</div>
                  <div><strong className="text-slate-400 uppercase">Date:</strong> {selectedMOM.date}</div>
                  <div><strong className="text-slate-400 uppercase">WOD:</strong> {selectedMOM.wordOfDay}</div>
                  <div><strong className="text-slate-400 uppercase">POD:</strong> {selectedMOM.phraseOfDay}</div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 md:p-8 space-y-6 bg-[#fafbfc]">

                {/* Attendance Summary */}
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                    <Users className="w-4 h-4 text-tm-blue" /> Attendance
                  </h4>
                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
                    <span>Members present: <strong>{(selectedMOM.attendance || []).filter((a: any) => a.type === "member").length}</strong></span>
                    <span>Guests: <strong>{(selectedMOM.guestList || selectedMOM.attendance?.filter((a: any) => a.type === "guest") || []).length}</strong></span>
                    <div className="w-full flex flex-wrap gap-1.5 mt-1">
                      {(selectedMOM.attendance || []).filter((a: any) => a.type === "member").map((a: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-tm-blue/5 text-tm-blue rounded text-[10px]">{a.name}</span>
                      ))}
                      {(selectedMOM.guestList || []).map((g: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">{g} (Guest)</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Agenda Timeline with Secretary Notes */}
                {(selectedMOM.timeline || []).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                      <List className="w-4 h-4 text-tm-blue" /> Agenda & Secretary's Notes
                    </h4>
                    <div className="space-y-3">
                      {(selectedMOM.timeline || []).map((item: any, idx: number) => (
                        <div key={item.id || idx} className="border border-slate-100 rounded-lg p-3 bg-slate-50/30">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-[11px] text-slate-600">
                              <span className="font-mono text-slate-400">{item.time}</span>
                              <span className="font-semibold text-slate-800">{item.role}</span>
                              <span className="text-slate-500">{item.player}</span>
                              {item.title && <span className="text-slate-400 italic">"{item.title}"</span>}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                              }`}>{item.completed ? 'Done' : 'Pending'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{item.durationMin}min</span>
                          </div>
                          <textarea
                            placeholder="Add your secretary note for this agenda item..."
                            value={getSecretaryNote(item.id)}
                            onChange={(e) => handleSecretaryNoteChange(item.id, e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded text-[11px] text-slate-700 bg-white outline-none focus:border-tm-blue focus:bg-white resize-none"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timer Report */}
                {(selectedMOM.timerLogs || []).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                      <Clock className="w-4 h-4 text-tm-blue" /> Timer Report
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 font-semibold">Speaker</th>
                            <th className="py-2 font-semibold">Role</th>
                            <th className="py-2 font-semibold">Duration</th>
                            <th className="py-2 font-semibold">Signal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedMOM.timerLogs || []).map((log: any, i: number) => (
                            <tr key={log.id || i} className="hover:bg-slate-50">
                              <td className="py-2 text-slate-800">{log.speaker}</td>
                              <td className="py-2 text-slate-500">{log.role}</td>
                              <td className="py-2 font-mono">{log.timeString || formatSeconds(log.seconds)}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getSignalColor(log.signal)}`}>
                                  {log.signal}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Evaluations */}
                {(selectedMOM.evaluations || []).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                      <BookOpen className="w-4 h-4 text-tm-blue" /> Evaluations
                    </h4>
                    <div className="space-y-3">
                      {(selectedMOM.evaluations || []).map((ev: any, i: number) => (
                        <div key={ev.id || i} className="border border-slate-100 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[11px]">
                              <strong className="text-slate-800">{ev.evaluator}</strong>
                              <span className="text-slate-400 mx-1">evaluated</span>
                              <strong className="text-slate-800">{ev.speaker}</strong>
                              <span className="text-slate-400 mx-1">on</span>
                              <span className="italic text-slate-600">"{ev.speechTitle}"</span>
                            </div>
                            <span className="px-2 py-0.5 bg-tm-blue/10 text-tm-blue rounded text-[10px] font-bold">
                              Avg: {getScoreAverage(ev.scores)}/5
                            </span>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 mb-2">
                            {ev.scores && Object.entries(ev.scores).map(([key, val]: any) => (
                              <div key={key} className="text-center">
                                <div className="text-[8px] text-slate-400 uppercase truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                <div className="text-[11px] font-bold text-slate-700">{val}</div>
                              </div>
                            ))}
                          </div>
                          {ev.positives && <p className="text-[10px] text-emerald-700 mb-1"><strong>+</strong> {ev.positives}</p>}
                          {ev.improvements && <p className="text-[10px] text-amber-700"><strong>!</strong> {ev.improvements}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ah-Counter Report */}
                {(selectedMOM.ahLogs || []).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                      <Volume className="w-4 h-4 text-tm-blue" /> Ah-Counter Report
                    </h4>
                    {(() => { const winner = getAhWinner(); return winner ? (
                      <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800">
                        <strong>Award:</strong> Best Ah-Counter Performance &mdash; {winner.speaker} with only {winner.total} filler word{winner.total !== 1 ? 's' : ''}!
                      </div>
                    ) : null; })()}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 font-semibold">Speaker</th>
                            <th className="py-2 font-semibold">Ah</th>
                            <th className="py-2 font-semibold">Um</th>
                            <th className="py-2 font-semibold">Er</th>
                            <th className="py-2 font-semibold">Well</th>
                            <th className="py-2 font-semibold">So</th>
                            <th className="py-2 font-semibold">Repeats</th>
                            <th className="py-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedMOM.ahLogs || []).map((log: any, i: number) => {
                            const total = totalFillerWords(log);
                            return (
                              <tr key={log.id || i} className="hover:bg-slate-50">
                                <td className="py-2 text-slate-800">{log.speaker}</td>
                                <td className="py-2">{log.counts?.ah || 0}</td>
                                <td className="py-2">{log.counts?.um || 0}</td>
                                <td className="py-2">{log.counts?.er || 0}</td>
                                <td className="py-2">{log.counts?.well || 0}</td>
                                <td className="py-2">{log.counts?.so || 0}</td>
                                <td className="py-2">{log.counts?.repeats || 0}</td>
                                <td className="py-2 font-bold">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Grammarian Report */}
                {(selectedMOM.grammarianLogs || []).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                      <MessageSquare className="w-4 h-4 text-tm-blue" /> Grammarian Report
                    </h4>
                    <div className="space-y-2">
                      {(selectedMOM.grammarianLogs || []).map((log: any, i: number) => (
                        <div key={i} className="border border-slate-100 rounded-lg p-3 text-[11px]">
                          <strong className="text-slate-800">{log.speaker}</strong>
                          <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                            <span>WOD used: <strong>{log.wodUsedCount || 0}x</strong></span>
                            <span>POD used: <strong>{log.podUsedCount || 0}x</strong></span>
                          </div>
                          {(log.elegantWordsLog || []).length > 0 && (
                            <div className="mt-1">
                              <span className="text-[9px] font-bold text-emerald-700 uppercase">Elegant Phrases:</span>
                              <ul className="list-disc list-inside text-[10px] text-slate-600 mt-0.5">
                                {(log.elegantWordsLog || []).map((p: string, j: number) => (
                                  <li key={j}>"{p}"</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {(log.fillerMistakesLog || []).length > 0 && (
                            <div className="mt-1">
                              <span className="text-[9px] font-bold text-amber-700 uppercase">Slip-ups:</span>
                              <ul className="list-disc list-inside text-[10px] text-slate-600 mt-0.5">
                                {(log.fillerMistakesLog || []).map((p: string, j: number) => (
                                  <li key={j}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voting Results */}
                {(selectedMOM.polls || []).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                      <Award className="w-4 h-4 text-tm-blue" /> Voting Results
                    </h4>
                    <div className="space-y-3">
                      {(selectedMOM.polls || []).map((poll: any, i: number) => {
                        const sorted = [...(poll.options || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
                        return (
                          <div key={poll.id || i}>
                            <p className="text-[11px] font-semibold text-slate-700 mb-1">{poll.question}</p>
                            <div className="space-y-1">
                              {sorted.map((opt: any, j: number) => (
                                <div key={opt.id || j} className="flex items-center gap-2 text-[11px]">
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${j === 0 ? 'bg-tm-yellow text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                                    {j + 1}
                                  </span>
                                  <span className="text-slate-700">{opt.name}</span>
                                  <span className="ml-auto text-slate-400">{opt.votes || 0} vote{(opt.votes || 0) !== 1 ? 's' : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Role Assignments Summary */}
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5 mb-3">
                    <User className="w-4 h-4 text-tm-blue" /> Role Assignments
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
                    {selectedMOM.toastmasterOfTheDay && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">TMOD:</span> <strong className="text-slate-700">{selectedMOM.toastmasterOfTheDay}</strong></div>}
                    {selectedMOM.generalEvaluator && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">GE:</span> <strong className="text-slate-700">{selectedMOM.generalEvaluator}</strong></div>}
                    {selectedMOM.tableTopicsMaster && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">TTM:</span> <strong className="text-slate-700">{selectedMOM.tableTopicsMaster}</strong></div>}
                    {selectedMOM.timer && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">Timer:</span> <strong className="text-slate-700">{selectedMOM.timer}</strong></div>}
                    {selectedMOM.ahCounter && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">Ah-Counter:</span> <strong className="text-slate-700">{selectedMOM.ahCounter}</strong></div>}
                    {selectedMOM.grammarian && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">Grammarian:</span> <strong className="text-slate-700">{selectedMOM.grammarian}</strong></div>}
                    {selectedMOM.sergeantAtArms && <div className="px-2 py-1.5 bg-slate-50 rounded"><span className="text-slate-400">SAA:</span> <strong className="text-slate-700">{selectedMOM.sergeantAtArms}</strong></div>}
                  </div>
                </div>

                {/* Secretary's Narrative */}
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-display font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-tm-blue" /> Secretary's Narrative Summary
                    </h4>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <button onClick={handleSaveMinutes} className="flex items-center gap-1 text-[11px] bg-emerald-600 font-semibold px-2.5 py-1 rounded text-white cursor-pointer">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <button onClick={handleStartEdit} className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded hover:bg-slate-200 cursor-pointer border border-slate-200/55">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={8}
                      value={editorialText}
                      onChange={(e) => setEditorialText(e.target.value)}
                      placeholder="Write the official minutes narrative here. Summarize the meeting highlights, educational progress, and action items."
                      className="w-full p-4 border rounded-xl bg-slate-50 text-slate-700 outline-none focus:bg-white focus:border-tm-blue leading-relaxed font-sans text-xs resize-none"
                    />
                  ) : (
                    <div className="text-slate-700 leading-relaxed font-sans text-xs whitespace-pre-wrap min-h-[60px]">
                      {selectedMOM.editorialSummary || <span className="text-slate-400 italic">No narrative written yet. Click "Edit" to draft the minutes summary.</span>}
                    </div>
                  )}
                </div>

                {/* Approval Block */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-slate-400 leading-none">
                  <div>
                    <strong>SECRETARY REGISTER SEAL</strong>
                    <p className="mt-1">Minutes drafted from live meeting data</p>
                  </div>
                  {selectedMOM.approved ? (
                    <div className="text-right flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <div>
                        <strong className="text-emerald-700 uppercase">APPROVED</strong>
                        <p className="text-slate-400 mt-1">{selectedMOM.approvedBy}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <strong className="text-amber-700 uppercase">AWAITING APPROVAL</strong>
                      <p className="text-slate-400 mt-1">Review before sealing</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-sm text-center font-sans space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-display font-semibold text-slate-600 text-sm">No Minutes Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Select a minutes record from the left sidebar or create a new one from the current meeting data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
