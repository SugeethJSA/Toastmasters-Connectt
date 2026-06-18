import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, Save, CheckCircle2, User as UserIcon } from "lucide-react";
import { Meeting, TimelineItem, MeetingSegment } from "../types";

interface AccessControlProps {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
}

const ROLE_TIMELINE_MAP: Record<string, { title: string; segment: MeetingSegment; durationMin: number; timelineRole: string }> = {
  toastmasterOfTheDay: { title: "Meeting Introduction & Team Overview", segment: MeetingSegment.BUSINESS, durationMin: 7, timelineRole: "Toastmaster of the Day" },
  generalEvaluator: { title: "Grammarian, Ah-Counter, and Time Reports", segment: MeetingSegment.EVALUATION, durationMin: 7, timelineRole: "General Evaluator" },
  tableTopicsMaster: { title: "Impromptu Journey Prompts", segment: MeetingSegment.TABLE_TOPICS, durationMin: 15, timelineRole: "Table Topics Master" },
  timer: { title: "Timer Tracking", segment: MeetingSegment.BUSINESS, durationMin: 3, timelineRole: "Timer" },
  ahCounter: { title: "Ah-Counter Report", segment: MeetingSegment.BUSINESS, durationMin: 3, timelineRole: "Ah-Counter" },
  grammarian: { title: "Grammarian Report", segment: MeetingSegment.BUSINESS, durationMin: 3, timelineRole: "Grammarian" },
  sergeantAtArms: { title: "President Introduction & Meeting Warmup", segment: MeetingSegment.BUSINESS, durationMin: 5, timelineRole: "Sergeant-at-Arms" },
};

export const AccessControl: React.FC<AccessControlProps> = ({ meeting, setMeeting }) => {
  const [roles, setRoles] = useState({
    toastmasterOfTheDay: meeting.toastmasterOfTheDay,
    generalEvaluator: meeting.generalEvaluator,
    tableTopicsMaster: meeting.tableTopicsMaster,
    timer: meeting.timer,
    ahCounter: meeting.ahCounter,
    grammarian: meeting.grammarian,
    sergeantAtArms: meeting.sergeantAtArms,
  });

  // Lazy load registered users in the background — never blocks UI
  const [registeredNames, setRegisteredNames] = useState<string[]>([]);
  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    const API_BASE = import.meta.env.VITE_API_URL || "";
    fetch(`${API_BASE}/api/users`, { credentials: "include", signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.users) setRegisteredNames(d.users.map((u: any) => u.name)); })
      .catch(() => {});
  }, []);

  const buildRoleTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];
    const roleKeys = Object.keys(ROLE_TIMELINE_MAP) as (keyof typeof ROLE_TIMELINE_MAP)[];

    roleKeys.forEach((roleKey) => {
      const playerName = roles[roleKey];
      if (!playerName) return;

      const meta = ROLE_TIMELINE_MAP[roleKey];
      const existing = meeting.timeline.find(t => t.role === meta.timelineRole);

      if (existing) {
        items.push({ ...existing, player: playerName });
      } else {
        items.push({
          id: `tl-${roleKey}-${Date.now()}`,
          time: "19:00",
          durationMin: meta.durationMin,
          role: meta.timelineRole,
          player: playerName,
          title: meta.title,
          segment: meta.segment,
          completed: false,
          photoUrl: "",
          quote: "",
        });
      }
    });

    const roleTimelineRoles = Object.values(ROLE_TIMELINE_MAP).map(m => m.timelineRole);
    const otherItems = meeting.timeline.filter(t => !roleTimelineRoles.includes(t.role));
    return [...items, ...otherItems];
  };

  const handleRoleChange = (key: keyof typeof roles, value: string) => {
    setRoles((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    const newTimeline = buildRoleTimelineItems();
    setMeeting((prev) => ({ ...prev, ...roles, timeline: newTimeline }));
  };

  const RoleInput = ({ label, roleKey }: { label: string; roleKey: keyof typeof roles }) => (
    <div className="space-y-1.5">
      <label className="text-slate-500 font-bold text-[10px] uppercase flex items-center gap-1.5">
        <UserIcon className="w-3.5 h-3.5 text-tm-maroon" /> {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={roles[roleKey]}
          onChange={(e) => handleRoleChange(roleKey, e.target.value)}
          placeholder="Type member name..."
          list={`role-suggestions-${String(roleKey)}`}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-tm-blue font-sans text-xs"
        />
        <datalist id={`role-suggestions-${String(roleKey)}`}>
          {registeredNames.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">
            Administrative Access & Role Delegation
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Assign members to meeting roles. Type a name or pick from suggestions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveChanges}
          className="flex items-center gap-1.5 px-4 py-2 bg-tm-blue hover:bg-tm-dark text-white font-bold rounded font-display tracking-wider transition-colors text-xs cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Assignments
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans text-xs">
        {/* Role Assignment Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-tm-maroon" /> Role Assignments
          </h3>

          <div className="space-y-4">
            <RoleInput label="Toastmaster of the Day (TMOD)" roleKey="toastmasterOfTheDay" />
            <RoleInput label="General Evaluator" roleKey="generalEvaluator" />
            <RoleInput label="Table Topics Master" roleKey="tableTopicsMaster" />
            <RoleInput label="Sergeant-at-Arms (SAA)" roleKey="sergeantAtArms" />

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <RoleInput label="Timer" roleKey="timer" />
              <RoleInput label="Ah-Counter" roleKey="ahCounter" />
              <RoleInput label="Grammarian" roleKey="grammarian" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-950 leading-relaxed space-y-3 font-sans shadow-sm">
            <h4 className="font-display font-semibold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700" /> Auto-Population
            </h4>
            <ul className="space-y-2.5 font-sans list-none text-emerald-800 text-[11px]">
              <li className="flex gap-2">
                <span className="font-bold shrink-0 mt-0.5">•</span>
                <span><strong>Timeline Sync:</strong> Role assignments update the timeline items automatically.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0 mt-0.5">•</span>
                <span><strong>Suggestions</strong> come from registered users. No server? Just type names directly.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold shrink-0 mt-0.5">•</span>
                <span><strong>Speaker slots</strong> must be added via the TMOD Cockpit.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
