import React, { useState, useEffect } from "react";
import { BookOpen, Award, Plus, X, Loader2, ChevronDown, ChevronUp, Search, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Pathway {
  _id: string;
  memberId: string;
  memberName: string;
  pathwayName: string;
  level: number;
  projectsCompleted: number;
  totalProjects: number;
  startedAt: string;
  completedAt: string | null;
  notes: string;
  status: "active" | "completed" | "paused";
}

interface EducationAward {
  _id: string;
  memberId: string;
  award: string;
  dateAwarded: string;
  notes: string;
}

const LEVEL_LABELS = ["", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];

const AWARD_OPTIONS = [
  "Competent Communication (CC)", "Competent Leadership (CL)",
  "Advanced Communicator Bronze (ACB)", "Advanced Communicator Silver (ACS)", "Advanced Communicator Gold (ACG)",
  "Competent Leader (CL)", "Advanced Leader Bronze (ALB)", "Advanced Leader Silver (ALS)",
  "Distinguished Toastmaster (DTM)", "Pathway Completion", "Level 1 Completion",
  "Level 2 Completion", "Level 3 Completion", "Level 4 Completion", "Level 5 Completion",
];

const FILL_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export const PathwaysDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [awards, setAwards] = useState<EducationAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ memberId: "", memberName: "", pathwayName: "", level: 1, projectsCompleted: 0, totalProjects: 14, notes: "" });
  const [awardForm, setAwardForm] = useState({ memberId: "", memberName: "", award: "", notes: "" });
  const [members, setMembers] = useState<{id: string; name: string; email?: string}[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pwRes, awardRes, memberRes] = await Promise.all([
        fetch(`${API_BASE}/api/pathways`, { credentials: "include" }),
        fetch(`${API_BASE}/api/education-awards`, { credentials: "include" }),
        fetch(`${API_BASE}/api/users`, { credentials: "include" }),
      ]);
      const pwData = await pwRes.json();
      const awardData = await awardRes.json();
      const memberData = await memberRes.json();
      setPathways(pwData.pathways || []);
      setAwards(awardData.awards || []);
      const m = (memberData.users || []).map((u: any) => ({ id: u._id || u.id, name: u.name || u.email, email: u.email }));
      setMembers(m);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    try {
      await fetch(`${API_BASE}/api/pathways`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ memberId: "", memberName: "", pathwayName: "", level: 1, projectsCompleted: 0, totalProjects: 14, notes: "" });
      fetchData();
    } catch { /* silent */ }
  };

  const handleUpdate = async (id: string, updates: Partial<Pathway>) => {
    try {
      await fetch(`${API_BASE}/api/pathways/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(updates),
      });
      fetchData();
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/pathways/${id}`, { method: "DELETE", credentials: "include" });
      fetchData();
    } catch { /* silent */ }
  };

  const handleCreateAward = async () => {
    try {
      await fetch(`${API_BASE}/api/education-awards`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(awardForm),
      });
      setShowAwardForm(false);
      setAwardForm({ memberId: "", memberName: "", award: "", notes: "" });
      fetchData();
    } catch { /* silent */ }
  };

  const handleDeleteAward = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/education-awards/${id}`, { method: "DELETE", credentials: "include" });
      fetchData();
    } catch { /* silent */ }
  };

  const filtered = pathways.filter(p =>
    p.memberName.toLowerCase().includes(search.toLowerCase()) ||
    p.pathwayName.toLowerCase().includes(search.toLowerCase())
  );

  const activePathways = filtered.filter(p => p.status === "active");
  const completedCount = pathways.filter(p => p.status === "completed").length;
  const totalProgress = pathways.length > 0
    ? Math.round(pathways.reduce((s, p) => s + p.projectsCompleted, 0) / pathways.reduce((s, p) => s + p.totalProjects, 0) * 100)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-tm-blue" /></div>
  );

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-tm-blue" /> Pathways & Education
          </h2>
          <p className="text-sm text-slate-500">Track member progress in Toastmasters Pathways and education awards</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAwardForm(true)} className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Add Award
          </button>
          <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 bg-tm-blue hover:bg-tm-blue/90 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Pathway
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-tm-blue">{activePathways.length}</p>
          <p className="text-xs text-slate-500">Active Pathways</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{totalProgress}%</p>
          <p className="text-xs text-slate-500">Overall Progress</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search pathways..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No pathways yet. Click "Add Pathway" to get started.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pw, i) => (
            <div key={pw._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div onClick={() => setExpanded(expanded === pw._id ? null : pw._id)}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: FILL_COLORS[i % FILL_COLORS.length] }}>
                  {pw.pathwayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{pw.memberName}</h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
                      pw.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      pw.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>{pw.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{pw.pathwayName} &middot; {LEVEL_LABELS[pw.level] || `Level ${pw.level}`}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-tm-blue rounded-full transition-all" style={{ width: `${Math.min(100, (pw.projectsCompleted / pw.totalProjects) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 w-10 text-right">{pw.projectsCompleted}/{pw.totalProjects}</span>
                  </div>
                </div>
                {expanded === pw._id ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
              </div>

              {expanded === pw._id && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member</label>
                      <p className="text-sm text-slate-700">{pw.memberName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pathway</label>
                      <p className="text-sm text-slate-700">{pw.pathwayName}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Level</label>
                      <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map(l => (
                          <button key={l} onClick={() => handleUpdate(pw._id, { level: l })}
                            className={`w-7 h-7 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                              pw.level >= l ? "bg-tm-blue text-white" : "bg-slate-100 text-slate-400"
                            }`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Progress</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="number" min={0} max={pw.totalProjects} value={pw.projectsCompleted}
                          onChange={e => handleUpdate(pw._id, { projectsCompleted: parseInt(e.target.value) || 0 })}
                          className="w-16 text-xs px-2 py-1 border border-slate-200 rounded" />
                        <span className="text-xs text-slate-400">/ {pw.totalProjects}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                      <select value={pw.status} onChange={e => handleUpdate(pw._id, { status: e.target.value as "active" | "completed" | "paused" })}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded mt-1">
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Started</label>
                      <p className="text-xs text-slate-500 mt-1">{new Date(pw.startedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Notes</label>
                    <textarea value={pw.notes} onChange={e => handleUpdate(pw._id, { notes: e.target.value })}
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded mt-1 h-16 resize-none" />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => handleDelete(pw._id)} className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {awards.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-amber-500" /> Education Awards</h3>
          <div className="grid grid-cols-2 gap-3">
            {awards.map(a => (
              <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{a.award}</p>
                  <p className="text-[10px] text-slate-400">{a.memberId} &middot; {new Date(a.dateAwarded).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDeleteAward(a._id)} className="text-rose-400 hover:text-rose-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Add Pathway</h3>
            <div className="space-y-3">
              <select value={form.memberId} onChange={e => { const m = members.find(m => m.id === e.target.value); setForm({ ...form, memberId: e.target.value, memberName: m ? m.name : "" }); }}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                <option value="">Select member...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={form.pathwayName} onChange={e => setForm({ ...form, pathwayName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                <option value="">Select pathway...</option>
                {["Dynamic Leadership", "Effective Coaching", "Innovative Planning", "Leadership Development",
                  "Motivational Strategies", "Persuasive Influence", "Presentation Mastery", "Strategic Relationships",
                  "Team Collaboration", "Visionary Communication", "Engaging Humor", "Connect with Storytelling",
                  "Connect with Technology", "Deliver with Impact", "Facilitate Difficult Conversations",
                  "Navigate Change", "Navigate Leadership", "Prepare to Lead", "Spark your Speaking", "Stand-up and Be Heard"
                ].map(pw => <option key={pw} value={pw}>{pw}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Level</label>
                  <input type="number" min={1} max={5} value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Total Projects</label>
                  <input type="number" min={1} value={form.totalProjects} onChange={e => setForm({ ...form, totalProjects: parseInt(e.target.value) || 14 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <textarea placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg h-20 resize-none" />
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                <button onClick={handleCreate} disabled={!form.memberId || !form.pathwayName}
                  className="text-xs px-3 py-1.5 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAwardForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAwardForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Add Education Award</h3>
            <div className="space-y-3">
              <select value={awardForm.memberId} onChange={e => { const m = members.find(m => m.id === e.target.value); setAwardForm({ ...awardForm, memberId: e.target.value, memberName: m ? m.name : "" }); }}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                <option value="">Select member...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={awardForm.award} onChange={e => setAwardForm({ ...awardForm, award: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                <option value="">Select award...</option>
                {AWARD_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <textarea placeholder="Notes..." value={awardForm.notes} onChange={e => setAwardForm({ ...awardForm, notes: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg h-20 resize-none" />
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowAwardForm(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                <button onClick={handleCreateAward} disabled={!awardForm.memberId || !awardForm.award}
                  className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50">Add Award</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
