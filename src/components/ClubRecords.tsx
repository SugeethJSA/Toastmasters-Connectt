import React, { useState } from "react";
import { ClipboardCheck, Settings, TrendingUp, Award } from "lucide-react";
import { Meeting, TimerLog, AhCounterLog, GrammarianUse, EvaluationItem, SAAPoll } from "../types";
import { Archive } from "./Archive";
import { Governance } from "./Governance";
import { ClubPerformance } from "./ClubPerformance";
import { DcpDashboard } from "./DcpDashboard";

interface Props {
  meeting: Meeting;
  timerLogs: TimerLog[];
  ahLogs: AhCounterLog[];
  grammarianLogs: GrammarianUse[];
  evaluations: EvaluationItem[];
  polls: SAAPoll[];
  pastMeetings: any[];
  onAddPastMeeting: (m: any) => void;
  onUpdatePastMeeting: (id: string, m: any) => void;
  onUpdatePolls: (p: SAAPoll[]) => void;
  onApproveCurrentMOM: () => void;
}

const TABS = [
  { key: "archive", label: "Archive & MOM", icon: ClipboardCheck },
  { key: "governance", label: "Ballot Controls", icon: Settings },
  { key: "performance", label: "Club Performance", icon: TrendingUp },
  { key: "dcp", label: "DCP Tracker", icon: Award },
];

export function ClubRecords({ meeting, timerLogs, ahLogs, grammarianLogs, evaluations, polls, pastMeetings, onAddPastMeeting, onUpdatePastMeeting, onUpdatePolls, onApproveCurrentMOM }: Props) {
  const [tab, setTab] = useState("archive");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              tab === t.key ? "border-tm-yellow text-tm-dark" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "archive" && <Archive meeting={meeting} timerLogs={timerLogs} ahLogs={ahLogs} grammarianLogs={grammarianLogs} evaluations={evaluations} polls={polls} pastMeetings={pastMeetings} onAddPastMeeting={onAddPastMeeting} onUpdatePastMeeting={onUpdatePastMeeting} />}
      {tab === "governance" && <Governance meeting={meeting} polls={polls} onUpdatePolls={onUpdatePolls} onApproveCurrentMOM={onApproveCurrentMOM} />}
      {tab === "performance" && <ClubPerformance />}
      {tab === "dcp" && <DcpDashboard />}
    </div>
  );
}
