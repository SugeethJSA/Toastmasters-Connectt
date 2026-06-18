import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Loader2, Mail, Shield, User, Save, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Meeting, TimelineItem, MeetingSegment } from "../types";

interface MembersProps {
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

export const Members: React.FC<MembersProps> = ({ meeting, setMeeting }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // States to add new member
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  // Meeting Role Delegation States
  const [roles, setRoles] = useState({
    toastmasterOfTheDay: meeting.toastmasterOfTheDay,
    generalEvaluator: meeting.generalEvaluator,
    tableTopicsMaster: meeting.tableTopicsMaster,
    timer: meeting.timer,
    ahCounter: meeting.ahCounter,
    grammarian: meeting.grammarian,
    sergeantAtArms: meeting.sergeantAtArms,
  });

  useEffect(() => {
    setRoles({
      toastmasterOfTheDay: meeting.toastmasterOfTheDay,
      generalEvaluator: meeting.generalEvaluator,
      tableTopicsMaster: meeting.tableTopicsMaster,
      timer: meeting.timer,
      ahCounter: meeting.ahCounter,
      grammarian: meeting.grammarian,
      sergeantAtArms: meeting.sergeantAtArms,
    });
  }, [meeting.toastmasterOfTheDay, meeting.generalEvaluator, meeting.tableTopicsMaster, meeting.timer, meeting.ahCounter, meeting.grammarian, meeting.sergeantAtArms]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/api/users`, { credentials: "include" });
      const data = await res.json();
      if (data.users) {
        setMembers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !newMemberName.trim()) return;

    setAddingMember(true);
    const generatedPassword = Math.random().toString(36).slice(-8) + "!";
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newMemberEmail, name: newMemberName, role: newMemberRole, password: generatedPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setNewMemberEmail("");
        setNewMemberName("");
        setNewMemberRole("member");
        setShowAddMember(false);
        fetchMembers();
        alert(`User successfully registered!\n\nTemporary Password: ${generatedPassword}\n\nPlease share this securely with the member so they can log in.`);
      } else {
        alert(data.error || "Failed to create member");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to completely remove this member from the club roster?")) return;
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Role Assignment Handlers
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

  const handleAssignMemberRole = (memberId: string, memberName: string, newRoleKey: string) => {
    setRoles(prev => {
      const updated = { ...prev };
      // Clear this user from any other roles to keep 1 role per user in this table
      Object.keys(updated).forEach(k => {
        if (updated[k as keyof typeof updated] === memberName) {
          updated[k as keyof typeof updated] = "";
        }
      });
      // Assign the new role
      if (newRoleKey) {
        updated[newRoleKey as keyof typeof updated] = memberName;
      }
      return updated;
    });
  };

  const handleSaveRoleAssignments = () => {
    const newTimeline = buildRoleTimelineItems();
    setMeeting((prev) => ({ ...prev, ...roles, timeline: newTimeline }));
    alert("Role assignments saved and timeline dynamically updated!");
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">Club Roster & Members</h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Manage unified synced club members, officers, and guests across the entire platform.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'officer') && (
          <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center gap-1.5 px-4 py-2 bg-tm-blue hover:bg-tm-dark text-white font-bold rounded font-display tracking-wider transition-colors text-xs cursor-pointer">
            <Plus className="w-4 h-4" /> {showAddMember ? "Cancel" : "Add Member"}
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {showAddMember && (
        <form onSubmit={handleCreateMember} className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-tm-maroon" />
            <h3 className="font-display font-semibold text-slate-700 text-sm">Register Unified Member</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
            <div className="space-y-1.5"><label className="text-slate-500 font-bold block">Name</label><input type="text" required placeholder="John Doe" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue" /></div>
            <div className="space-y-1.5"><label className="text-slate-500 font-bold block">Email Address</label><input type="email" required placeholder="john@example.com" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue" /></div>
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold block">Club Role</label>
              <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue">
                <option value="member">Member</option>
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={addingMember} className="px-6 py-2.5 bg-tm-maroon hover:opacity-95 text-white font-bold rounded uppercase tracking-wider font-display text-[10px] disabled:opacity-50 cursor-pointer">
              {addingMember ? "Registering..." : "Add to Roster Database"}
            </button>
          </div>
        </form>
      )}

      {/* Member Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
          <Users className="w-5 h-5 text-tm-blue" /> Active Club Roster
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 pb-2">
                <th className="py-3 font-bold uppercase text-[10px] tracking-wider pl-1">Member Profile</th>
                <th className="py-3 font-bold uppercase text-[10px] tracking-wider">Contact Email</th>
                <th className="py-3 font-bold uppercase text-[10px] tracking-wider">Meeting Role</th>
                <th className="py-3 text-center font-bold uppercase text-[10px] tracking-wider">Status</th>
                <th className="py-3 text-right font-bold uppercase text-[10px] tracking-wider pr-4">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingMembers ? <tr><td colSpan={5} className="py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-tm-blue" /><p>Syncing Unified Users...</p></td></tr> : members.map((m: any) => {
                const assignedRoles = Object.entries(roles).filter(([k, v]) => v === m.name).map(([k]) => k);
                return (
                <tr key={m._id || m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-1 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-tm-blue/10 text-tm-blue font-bold flex items-center justify-center border border-tm-blue/20">{m.name?.charAt(0)}{m.name?.split(" ")[1]?.charAt(0) || m.name?.charAt(1) || ""}</div>
                    <div>
                      <strong className="text-slate-800 text-sm">{m.name}</strong>
                      {m.role && <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1.5 ${m.role === 'admin' ? 'bg-rose-100 text-rose-800' : m.role === 'officer' ? 'bg-amber-100 text-amber-800' : m.role === 'guest' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{m.role}</span>}
                    </div>
                  </td>
                  <td className="py-3"><div className="flex items-center gap-1.5 text-slate-500"><Mail className="w-3.5 h-3.5" /><span>{m.email}</span></div></td>
                  
                  {/* Meeting Role Assignment Dropdown inside the table */}
                  <td className="py-3">
                    <select
                      className="px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs w-40 outline-none focus:border-tm-blue bg-white"
                      value={assignedRoles.length > 0 ? assignedRoles[0] : ""}
                      onChange={(e) => handleAssignMemberRole(m._id || m.id, m.name, e.target.value)}
                    >
                      <option value="">-- Unassigned --</option>
                      <option value="toastmasterOfTheDay">Toastmaster of the Day</option>
                      <option value="generalEvaluator">General Evaluator</option>
                      <option value="tableTopicsMaster">Table Topics Master</option>
                      <option value="timer">Timer</option>
                      <option value="ahCounter">Ah-Counter</option>
                      <option value="grammarian">Grammarian</option>
                      <option value="sergeantAtArms">Sergeant-at-Arms</option>
                    </select>
                  </td>

                  <td className="py-3 text-center"><span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 text-right pr-2">{(user?.role === 'admin' || user?.role === 'officer') && user?.id !== (m._id || m.id) ? <button onClick={() => handleDeleteMember(m._id || m.id)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Remove Member"><Trash2 className="w-4 h-4" /></button> : <span className="text-slate-300 text-[10px] pr-2">-</span>}</td>
                </tr>
              )})}
              
              {/* Display Walk-in Guests enrolled via StageView */}
              {!loadingMembers && meeting.guestList.map((guestName: string, idx: number) => (
                <tr key={`guest-walkin-${idx}`} className="hover:bg-slate-50/70 transition-colors bg-slate-50/30">
                  <td className="py-3 pl-1 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center border border-slate-300">
                      {guestName.charAt(0)}{guestName.split(" ")[1]?.charAt(0) || ""}
                    </div>
                    <div>
                      <strong className="text-slate-700 text-sm">{guestName}</strong>
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1.5">Walk-in Guest</span>
                    </div>
                  </td>
                  <td className="py-3"><div className="flex items-center gap-1.5 text-slate-400"><Mail className="w-3.5 h-3.5" /><span>-</span></div></td>
                  <td className="py-3">
                    <select disabled className="px-2 py-1 border border-slate-200 rounded text-slate-400 text-xs w-40 outline-none bg-slate-100 opacity-60">
                      <option>-- Session Guest --</option>
                    </select>
                  </td>
                  <td className="py-3 text-center"><span className="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500">Unregistered</span></td>
                  <td className="py-3 text-right pr-2">
                    {(user?.role === 'admin' || user?.role === 'officer') && (
                      <button onClick={() => setMeeting(prev => ({ ...prev, guestList: prev.guestList.filter((_, i) => i !== idx) }))} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Remove Walk-in Guest"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loadingMembers && members.length === 0 && meeting.guestList.length === 0 && <div className="text-center py-8 text-slate-400 font-sans text-xs">No registered members or guests found.</div>}
        </div>
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={handleSaveRoleAssignments} className="flex items-center gap-1.5 px-4 py-2 bg-tm-blue hover:bg-tm-dark text-white font-bold rounded tracking-wider transition-colors text-[10px] uppercase cursor-pointer">
            <Save className="w-3.5 h-3.5" /> Save Roles & Timeline
          </button>
        </div>
      </div>
    </div>
  );
};