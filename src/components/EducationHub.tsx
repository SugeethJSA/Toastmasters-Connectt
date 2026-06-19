import React, { useState } from "react";
import { Star, BookOpen } from "lucide-react";
import { Meeting, EvaluationItem } from "../types";
import { Evaluations } from "./Evaluations";
import { PathwaysDashboard } from "./PathwaysDashboard";
import { GeReportPanel } from "./GeReportPanel";

interface Props {
  meeting: Meeting;
  user: any;
  evaluations: EvaluationItem[];
  onAddEvaluation: (item: EvaluationItem) => void;
  onUpdateGeReport: (report: any) => void;
}

const TABS = [
  { key: "evaluations", label: "Evaluations", icon: Star },
  { key: "pathways", label: "Pathways", icon: BookOpen },
];

export function EducationHub({ meeting, user, evaluations, onAddEvaluation, onUpdateGeReport }: Props) {
  const [tab, setTab] = useState("evaluations");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === t.key ? "border-tm-yellow text-tm-dark" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "evaluations" && (
        <>
          <Evaluations meeting={meeting} currentUser={user} evaluations={evaluations} onAddEvaluation={onAddEvaluation} />
          <div className="mt-6"><GeReportPanel meeting={meeting} user={user} onUpdate={onUpdateGeReport} /></div>
        </>
      )}
      {tab === "pathways" && <PathwaysDashboard />}
    </div>
  );
}
