import React, { useState } from "react";
import { Meeting, GeReport, GeReportItem } from "../types";
import { Star, FileText, Save } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const GE_ROLES = ["Timer", "Ah Counter", "Grammarian", "Table Topics Master", "Evaluators (Overall)"];

interface Props {
  meeting: Meeting;
  user: any;
  onUpdate: (report: GeReport) => void;
}

export function GeReportPanel({ meeting, user, onUpdate }: Props) {
  const report = meeting.geReport || { meetingRating: 3, overallAssessment: "", items: [] };
  const [saving, setSaving] = useState(false);

  const isGeneralEvaluator = user?.name?.trim().toLowerCase() === (meeting.generalEvaluator || "").trim().toLowerCase();
  if (!isGeneralEvaluator) return null;

  const upsertItem = (role: string) => {
    const existing = report.items.find(i => i.role === role);
    if (existing) return existing;
    return { role, rolePlayer: "", rating: 3, positiveFeedback: "", improvementFeedback: "" };
  };

  const updateItem = (role: string, updates: Partial<GeReportItem>) => {
    const newItems = report.items.some(i => i.role === role)
      ? report.items.map(i => i.role === role ? { ...i, ...updates } : i)
      : [...report.items, { role, rolePlayer: "", rating: 3, positiveFeedback: "", improvementFeedback: "", ...updates }];
    onUpdate({ ...report, items: newItems });
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/meetings/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(meeting),
      });
    } catch (err) {
      console.error("Failed to save GE report", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-400" />
        General Evaluator Report
      </h3>

      {/* Overall */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">Meeting Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => onUpdate({ ...report, meetingRating: n })}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${n <= report.meetingRating ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <textarea value={report.overallAssessment} onChange={e => onUpdate({ ...report, overallAssessment: e.target.value })}
          placeholder="Overall assessment of the meeting..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-tm-yellow resize-none" rows={3} />
      </div>

      {/* Role Player Evaluations */}
      <div className="space-y-3">
        {GE_ROLES.map(role => {
          const item = upsertItem(role);
          return (
            <div key={role} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700">{role}</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => updateItem(role, { rating: n })}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${n <= item.rating ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={item.rolePlayer} onChange={e => updateItem(role, { rolePlayer: e.target.value })}
                  placeholder="Who played this role?" className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-tm-yellow" />
                <textarea value={item.positiveFeedback} onChange={e => updateItem(role, { positiveFeedback: e.target.value })}
                  placeholder="What went well..." className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-tm-yellow resize-none" rows={2} />
                <textarea value={item.improvementFeedback} onChange={e => updateItem(role, { improvementFeedback: e.target.value })}
                  placeholder="Suggestions for improvement..." className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-tm-yellow resize-none" rows={2} />
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-tm-yellow text-tm-dark font-bold text-xs rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50">
        <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save GE Report"}
      </button>
    </div>
  );
}
