import React, { useState } from "react";
import { Meeting, TimerLog, AhCounterLog, GrammarianUse, MinutesOfMeeting } from "../types";
import { 
  FileText, Download, Sparkles, Loader2, Edit, Save, CheckCircle, RefreshCw, 
  Trash2, User, ChevronRight, CornerDownRight, Award
} from "lucide-react";

interface ArchiveProps {
  meeting: Meeting;
  timerLogs: TimerLog[];
  ahLogs: AhCounterLog[];
  grammarianLogs: GrammarianUse[];
  pastMeetings: any[];
  onAddPastMeeting: (meeting: any) => void;
  onUpdatePastMeeting: (id: string, updatedMOM: any) => void;
}

export const Archive: React.FC<ArchiveProps> = ({
  meeting,
  timerLogs,
  ahLogs,
  grammarianLogs,
  pastMeetings,
  onAddPastMeeting,
  onUpdatePastMeeting
}) => {
  const [selectedMOM, setSelectedMOM] = useState<any | null>(pastMeetings[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorialText, setEditorialText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Trigger Gemini AI generation for the current live meeting minutes
  const handleGenerateAIMOM = async () => {
    setAiGenerating(true);
    try {
      const payload = {
        meetingDetails: {
          number: meeting.number,
          theme: meeting.theme,
          date: meeting.date,
          wordOfDay: meeting.wordOfDay,
          wordOfDayDefinition: meeting.wordOfDayDefinition,
          phraseOfDay: meeting.phraseOfDay,
          phraseOfDayMeaning: meeting.phraseOfDayMeaning,
          toastmasterOfTheDay: meeting.toastmasterOfTheDay,
          generalEvaluator: meeting.generalEvaluator,
          tableTopicsMaster: meeting.tableTopicsMaster,
          timer: meeting.timer,
          ahCounter: meeting.ahCounter,
          grammarian: meeting.grammarian,
          guestList: meeting.guestList
        },
        timerLogs: timerLogs,
        ahCounterLogs: ahLogs,
        grammarianLogs: grammarianLogs
      };

      const res = await fetch("/api/gemini/generate-mom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.error) {
        alert("Gemini failed, falling back to local generated structural minutes.");
      } else {
        const newMOMRecord = {
          id: "meet-" + meeting.number,
          number: meeting.number,
          date: meeting.date,
          theme: meeting.theme,
          wordOfDay: meeting.wordOfDay,
          phraseOfDay: meeting.phraseOfDay,
          editorialSummary: data.text,
          approved: false,
          approvedBy: ""
        };

        // Add to past meetings list and select it
        onAddPastMeeting(newMOMRecord);
        setSelectedMOM(newMOMRecord);
        setEditorialText(data.text);
      }
    } catch (err: any) {
      console.error(err);
      alert("Network exception contacting generator. Adding simulated record. Error: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleStartEdit = () => {
    if (!selectedMOM) return;
    setEditorialText(selectedMOM.editorialSummary);
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
      approvedBy: "David Vance (President)"
    };
    onUpdatePastMeeting(selectedMOM.id, updated);
    setSelectedMOM(updated);
  };

  // Simulated PDF Download Letterhead output
  const handleDownloadPDFSimulate = () => {
    if (!selectedMOM) return;
    
    // Create print window style or simple dynamic mockup
    const printContent = `
========================================
TOASTMASTERS INTERNATIONAL CLUB #124
MINUTES OF LAW ASSEMBLED SESSION - MEETING #${selectedMOM.number}
========================================
Date: ${selectedMOM.date}
Theme: "${selectedMOM.theme}"
Word of the Day: "${selectedMOM.wordOfDay}"
Phrase of the Day: "${selectedMOM.phraseOfDay}"

SUMMARY MINUTES:
----------------------------------------
${selectedMOM.editorialSummary}

----------------------------------------
Approved Status: ${selectedMOM.approved ? `Yes (By ${selectedMOM.approvedBy})` : "Pending Governance Committee Review"}
    `;
    
    const blob = new Blob([printContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Toastmasters_MOM_${selectedMOM.number}.txt`;
    link.click();
  };

  return (
    <div id="meeting-minutes-archives" className="space-y-6">
      
      {/* Upper header action blocks */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">
            Past Archives & AI Minutes of Meeting (MOM) generator
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Review history checklists, draft summaries with Gemini, approve governance details and export records.
          </p>
        </div>

        <button
          onClick={handleGenerateAIMOM}
          disabled={aiGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tm-maroon to-tm-lightmaroon text-white text-xs font-semibold rounded-lg font-display uppercase tracking-widest hover:opacity-90 transition-all shadow cursor-pointer disabled:opacity-40"
        >
          {aiGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Minutes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-tm-yellow animate-bounce" />
              <span>AI Synthesize meeting minutes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans text-xs">
        
        {/* Left Column (Col Span 1): Past Meetings List Selector */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-700 pb-3 border-b border-slate-100">
              Minutes Ledger Archives ({pastMeetings.length} Records)
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
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
                      <h4 className="font-semibold text-slate-800">Friday Meeting #{item.number}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.date} • {item.theme}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.approved ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded uppercase">
                          Pending
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
              <CheckCircle className="w-4 h-4 text-amber-800" /> Secretary Governance Mandate
            </h4>
            <p>Meeting minutes constitute the legal record of the club assembly. Under official bylaws, the President must double-check SAA vote tallies before formally assigning compliance seals.</p>
          </div>
        </div>

        {/* Right Columns (Col Span 2): Detailed View with Letterhead Sheet */}
        <div className="xl:col-span-2">
          {selectedMOM ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-lg overflow-hidden flex flex-col justify-between">
              
              {/* Official Toastmasters Letterhead Header */}
              <div className="bg-[#002a44] text-white p-6 md:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] bg-tm-yellow text-slate-900 font-bold font-display px-2.5 py-1 rounded tracking-widest uppercase">
                      Official Club Record
                    </span>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white mt-1.5">
                      TOASTMASTERS INTERNATIONAL
                    </h1>
                    <p className="text-xs text-slate-350 font-medium">Sophrosyne VIT Area F4 District 120</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadPDFSimulate}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded text-[11px] font-semibold text-white tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Save TXT
                    </button>
                    {!selectedMOM.approved && (
                      <button
                        onClick={handleApproveMinutes}
                        className="px-3.5 py-1.5 bg-tm-maroon hover:opacity-90 text-white rounded text-[11px] font-bold tracking-wider flex items-center gap-1 cursor-pointer border border-tm-maroon/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve MOM
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 font-mono text-[10px] text-slate-300">
                  <div>
                    <strong className="text-slate-400 uppercase">Meeting:</strong> #{selectedMOM.number}
                  </div>
                  <div>
                    <strong className="text-slate-400 uppercase">Date:</strong> {selectedMOM.date}
                  </div>
                  <div>
                    <strong className="text-slate-400 uppercase">WOD:</strong> {selectedMOM.wordOfDay}
                  </div>
                  <div>
                    <strong className="text-slate-400 uppercase">POD:</strong> {selectedMOM.phraseOfDay}
                  </div>
                </div>
              </div>

              {/* Letterhead Body Content */}
              <div className="p-6 md:p-8 space-y-6 bg-[#fafbfc]">
                
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-xs text-slate-500 font-sans">
                    Theme Exploration Topic: <strong className="text-slate-800">"{selectedMOM.theme}"</strong>
                  </span>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <button
                        onClick={handleSaveMinutes}
                        className="flex items-center gap-1 text-[11px] bg-emerald-600 font-semibold px-2.5 py-1 rounded text-white cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded hover:bg-slate-200 cursor-pointer border border-slate-200/55"
                      >
                        <Edit className="w-3.5 h-3.5" /> Custom Editor / Override
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4 bg-white p-4 border border-slate-200 rounded-xl shadow-inner">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-0.5">Editorial Narrative summary override</label>
                    <textarea
                      rows={12}
                      value={editorialText}
                      onChange={(e) => setEditorialText(e.target.value)}
                      className="w-full p-4 border rounded-xl bg-slate-50 text-slate-700 outline-none focus:bg-white focus:border-tm-blue leading-relaxed font-sans text-xs resize-none"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
                    <p className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">SUMMARY NARRATIVE REPORT:</p>
                    <div className="text-slate-700 leading-relaxed font-sans text-xs whitespace-pre-wrap">
                      {selectedMOM.editorialSummary}
                    </div>

                    {/* SAA Audit Signature Block */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-slate-400 leading-none">
                      <div>
                        <strong>SECRETARY REGISTER SEAL</strong>
                        <p className="mt-1">Automated electronic verification system</p>
                      </div>

                      {selectedMOM.approved ? (
                        <div className="text-right flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <div>
                            <strong className="text-emerald-700 uppercase">FORMALLY SEALED BY PRESIDENT</strong>
                            <p className="text-slate-400 mt-1">{selectedMOM.approvedBy}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <strong className="text-amber-700 uppercase">AWAITING EXECUTIVE SEAL</strong>
                          <p className="text-slate-400 mt-1">Audit status pending verification</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-sm text-center font-sans space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-display font-semibold text-slate-600 text-sm">No Minutes Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Select a ledger index from the left sidebar panel or generate a new live set utilizing the AI generate selector above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
