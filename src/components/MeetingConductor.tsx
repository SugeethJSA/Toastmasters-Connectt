import React, { useState } from "react";
import { Tv, Layers, Users, FileText } from "lucide-react";
import { Meeting, TimelineItem, TimerLog, AhCounterLog, GrammarianUse, TableTopicsPrompt } from "../types";
import { StageView } from "./StageView";
import { TMODMaster } from "./TMODMaster";
import { RolePlayers } from "./RolePlayers";
import { AgendaBuilder } from "./AgendaBuilder";

const TABS = [
  { key: "stage", label: "Stage View", icon: Tv },
  { key: "tmod", label: "TMOD Cockpit", icon: Layers },
  { key: "roleplayers", label: "Role Players", icon: Users },
  { key: "agenda", label: "Agenda Builder", icon: FileText },
];

interface Props {
  meeting: Meeting;
  setMeeting: (m: Meeting) => void;
  user: any;
  activeTimelineItem: TimelineItem | null;
  liveTimerState: any;
  setLiveTimerState: (s: any) => void;
  sendTimerControl: (cmd: any) => void;
  stageTopic: any;
  sendTopicControl: (cmd: any) => void;
  timerLogs: TimerLog[];
  ahLogs: AhCounterLog[];
  grammarianLogs: GrammarianUse[];
  topicsPrompts: TableTopicsPrompt[];
  onAddTimerLog: (log: TimerLog) => void;
  onUpdateAhLogs: (logs: AhCounterLog[]) => void;
  onUpdateGrammarianLogs: (logs: GrammarianUse[]) => void;
  onUpdateTopicsPrompts: (p: TableTopicsPrompt[]) => void;
  onUpdateTimeline: (t: TimelineItem[]) => void;
  onSetSpotlight: (item: TimelineItem | null) => void;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export function MeetingConductor({
  meeting, setMeeting, user, activeTimelineItem, liveTimerState, setLiveTimerState,
  sendTimerControl, stageTopic, sendTopicControl, timerLogs, ahLogs, grammarianLogs,
  topicsPrompts, onAddTimerLog, onUpdateAhLogs, onUpdateGrammarianLogs,
  onUpdateTopicsPrompts, onUpdateTimeline, onSetSpotlight, onToggleFullScreen, isFullScreen,
}: Props) {
  const [tab, setTab] = useState("agenda");

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
      {tab === "agenda" && <AgendaBuilder meeting={meeting} setMeeting={setMeeting} />}
      {(tab === "stage" || tab === "stage_fullscreen") && <StageView meeting={meeting} setMeeting={setMeeting} activeTimelineItem={activeTimelineItem} liveTimerState={liveTimerState} setLiveTimerState={setLiveTimerState} sendTimerControl={sendTimerControl} stageTopic={stageTopic} sendTopicControl={sendTopicControl} onToggleFullScreen={onToggleFullScreen} isFullScreen={tab === "stage_fullscreen"} />}
      {tab === "tmod" && <TMODMaster meeting={meeting} setMeeting={setMeeting} activeTimelineItem={activeTimelineItem} onUpdateTimeline={onUpdateTimeline} onSetSpotlight={onSetSpotlight} liveTimerState={liveTimerState} setLiveTimerState={setLiveTimerState} sendTimerControl={sendTimerControl} />}
      {tab === "roleplayers" && <RolePlayers meeting={meeting} currentUser={user} timerLogs={timerLogs} ahLogs={ahLogs} grammarianLogs={grammarianLogs} topicsPrompts={topicsPrompts} onAddTimerLog={onAddTimerLog} onUpdateAhLogs={onUpdateAhLogs} onUpdateGrammarianLogs={onUpdateGrammarianLogs} onUpdateTopicsPrompts={onUpdateTopicsPrompts} liveTimerState={liveTimerState} setLiveTimerState={setLiveTimerState} sendTimerControl={sendTimerControl} stageTopic={stageTopic} sendTopicControl={sendTopicControl} />}
    </div>
  );
}
