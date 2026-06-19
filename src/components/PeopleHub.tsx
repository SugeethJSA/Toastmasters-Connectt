import React, { useState } from "react";
import { Users, UserPlus, UserCog, Clock } from "lucide-react";
import { Meeting } from "../types";
import { Members } from "./Members";
import { GuestManagement } from "./GuestManagement";
import { RolesHistory } from "./RolesHistory";
import { UserManagement } from "./UserManagement";

const TABS = [
  { key: "members", label: "Club Roster", icon: Users },
  { key: "guests", label: "Guests", icon: UserPlus },
  { key: "roles", label: "Roles History", icon: Clock },
  { key: "permissions", label: "Access Control", icon: UserCog },
];

const iconMap: Record<string, any> = { Users, UserPlus, Clock, UserCog };

interface Props {
  meeting: Meeting;
  setMeeting: (m: Meeting) => void;
}

export function PeopleHub({ meeting, setMeeting }: Props) {
  const [tab, setTab] = useState("members");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(t => {
          const Icon = iconMap[t.icon as string] || Users;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                tab === t.key ? "border-tm-yellow text-tm-dark" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "members" && <Members meeting={meeting} setMeeting={setMeeting} />}
      {tab === "guests" && <GuestManagement />}
      {tab === "roles" && <RolesHistory />}
      {tab === "permissions" && <UserManagement />}
    </div>
  );
}
