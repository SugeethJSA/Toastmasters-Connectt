import React, { useState } from "react";
import { Lock, Unlock, CheckSquare, Square, ShieldCheck, Play, ArrowLeft } from "lucide-react";
import { Meeting } from "../types";

interface MeetingAuthorizationProps {
  meeting: Meeting;
  onAuthorizeAndStart: () => void;
  onCancel: () => void;
}

export const MeetingAuthorization: React.FC<MeetingAuthorizationProps> = ({
  meeting,
  onAuthorizeAndStart,
  onCancel
}) => {
  const [checklist, setChecklist] = useState({
    agendaConfirmed: false,
    rolesFilled: false,
    logisticsReady: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleStart = () => {
    if (!checklist.agendaConfirmed || !checklist.rolesFilled || !checklist.logisticsReady) {
      alert("Please verify all preceding pre-flight checklist protocols before initiating session authorization!");
      return;
    }
    fetch("/api/meetings/sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meeting),
    }).catch(() => {});
    onAuthorizeAndStart();
  };

  const allChecked = checklist.agendaConfirmed && checklist.rolesFilled && checklist.logisticsReady;

  return (
    <div className="max-w-[800px] mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-6 md:p-8 space-y-6 text-xs font-sans">
      
      {/* Header section lock state icon */}
      <header className="flex flex-col items-center justify-center text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${allChecked ? "bg-emerald-100 text-emerald-600 animate-pulse" : "bg-tm-maroon/10 text-tm-maroon"}`}>
          {allChecked ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        <div className="space-y-1">
          <span className="text-[10px] bg-tm-yellow text-slate-900 font-bold font-display px-2.5 py-1 rounded tracking-widest uppercase">
            Governance Locked Setup
          </span>
          <h1 className="text-xl font-bold font-display text-tm-dark mt-2">
            Governance Lock: Friday Meeting #{meeting.number}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed mt-1">
            Presiding Officer, please inspect today's physical pre-flight assembly checklist to activate automated AI speech track loggers and electronic voting cards.
          </p>
        </div>
      </header>

      {/* Pre-flight list protocols (corresponds to checklist section in HTML mockup) */}
      <section className="space-y-3 pt-2">
        <h2 className="font-semibold text-slate-700 font-display flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <ShieldCheck className="w-4.5 h-4.5 text-tm-maroon" /> Pre-Flight Checklist Items
        </h2>

        <div className="space-y-2 font-sans">
          
          {/* Checklist Item 1 */}
          <div 
            onClick={() => toggleCheck("agendaConfirmed")}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <span className="shrink-0">
                {checklist.agendaConfirmed ? (
                  <CheckSquare className="w-4.5 h-4.5 text-tm-blue fill-tm-blue/10" />
                ) : (
                  <Square className="w-4.5 h-4.5 text-slate-400" />
                )}
              </span>
              <div>
                <strong className="text-slate-800 text-xs font-sans">Agenda Confirmed</strong>
                <p className="text-[11px] text-slate-400 font-medium">All speaker timetables, evaluation allocations and timeslots are locked in.</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${checklist.agendaConfirmed ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
              {checklist.agendaConfirmed ? "VERIFIED" : "PENDING"}
            </span>
          </div>

          {/* Checklist Item 2 */}
          <div 
            onClick={() => toggleCheck("rolesFilled")}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <span className="shrink-0">
                {checklist.rolesFilled ? (
                  <CheckSquare className="w-4.5 h-4.5 text-tm-blue fill-tm-blue/10" />
                ) : (
                  <Square className="w-4.5 h-4.5 text-slate-400" />
                )}
              </span>
              <div>
                <strong className="text-slate-800 text-xs">Roles & Functionary Assignments Confirmed</strong>
                <p className="text-[11px] text-slate-400 font-medium">Master Timer, Ah-Counter, and Grammarian are present and ready.</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${checklist.rolesFilled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
              {checklist.rolesFilled ? "VERIFIED" : "PENDING"}
            </span>
          </div>

          {/* Checklist Item 3 */}
          <div 
            onClick={() => toggleCheck("logisticsReady")}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <span className="shrink-0">
                {checklist.logisticsReady ? (
                  <CheckSquare className="w-4.5 h-4.5 text-tm-blue fill-tm-blue/10" />
                ) : (
                  <Square className="w-4.5 h-4.5 text-slate-400" />
                )}
              </span>
              <div>
                <strong className="text-slate-800 text-xs">Logistics Setup Complete</strong>
                <p className="text-[11px] text-slate-400 font-medium">Traffic lighting devices, SAA voter cards, and peer evaluations forms calibrated.</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${checklist.logisticsReady ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
              {checklist.logisticsReady ? "VERIFIED" : "PENDING"}
            </span>
          </div>

        </div>
      </section>

      {/* Start activation layout trigger */}
      <section className="pt-4 border-t border-slate-150 flex flex-col items-center space-y-4">
        <p className="text-slate-500 text-[11px] text-center max-w-sm leading-relaxed font-sans">
          By clicking below, you authorize the formal start of this Toastmasters assembly meeting. Dashboard status transitions into "LIVE SESSION".
        </p>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 text-xs font-sans">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded bg-white font-bold font-display cursor-pointer"
          >
            Return to Dashboard
          </button>
          <button 
            type="button"
            onClick={handleStart}
            disabled={!allChecked}
            className={`px-8 py-2.5 rounded font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1.5 shadow ${
              allChecked 
                ? "bg-tm-maroon text-white hover:opacity-95 cursor-pointer" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Play className="w-4 h-4 fill-current" /> Authorize & Start Meeting
          </button>
        </div>
      </section>
    </div>
  );
};
