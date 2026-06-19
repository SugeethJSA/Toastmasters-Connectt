import React, { useState, useEffect } from "react";
import { Users, Plus, X, Loader2, Search, Phone, Mail, Calendar } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Guest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  homeClub: string;
  visitedMeetings: string[];
  firstVisit: string;
  lastVisit: string;
  followUpStatus: "pending" | "contacted" | "joined" | "not_interested";
  followUpNotes: string;
  interests: string;
  addedBy: string;
}

const STATUS_OPTIONS = ["pending", "contacted", "joined", "not_interested"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  joined: "bg-emerald-100 text-emerald-700",
  not_interested: "bg-slate-100 text-slate-500",
};

export const GuestManagement: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "", homeClub: "", interests: "" });

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/guests`, { credentials: "include" });
      const data = await res.json();
      setGuests(data.guests || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchGuests(); }, []);

  const handleCreate = async () => {
    try {
      await fetch(`${API_BASE}/api/guests`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", source: "", homeClub: "", interests: "" });
      fetchGuests();
    } catch {}
  };

  const handleUpdate = async (id: string, updates: Partial<Guest>) => {
    try {
      await fetch(`${API_BASE}/api/guests/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(updates),
      });
      fetchGuests();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await fetch(`${API_BASE}/api/guests/${id}`, { method: "DELETE", credentials: "include" }); fetchGuests(); } catch {}
  };

  const filtered = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.followUpStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = guests.filter(g => g.followUpStatus === "pending").length;
  const joinedCount = guests.filter(g => g.followUpStatus === "joined").length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-tm-blue" /></div>;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-tm-blue" /> Guest Management</h2>
          <p className="text-sm text-slate-500">Track visitors, follow-ups, and new member conversion</p>
        </div>
        <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Guest
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-2xl font-bold text-tm-blue">{guests.length}</p><p className="text-[10px] text-slate-500">Total Guests</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-2xl font-bold text-amber-600">{pendingCount}</p><p className="text-[10px] text-slate-500">Pending Follow-up</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-2xl font-bold text-emerald-600">{joinedCount}</p><p className="text-[10px] text-slate-500">Joined</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-700">{guests.length > 0 ? Math.round((joinedCount / guests.length) * 100) : 0}%</p>
          <p className="text-[10px] text-slate-500">Conversion Rate</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No guests found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(g => (
            <div key={g._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div onClick={() => setExpanded(expanded === g._id ? null : g._id)}
                className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-tm-blue/10 flex items-center justify-center text-tm-blue font-bold text-sm shrink-0">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{g.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{g.source ? `${g.source} · ` : ""}{new Date(g.lastVisit).toLocaleDateString()}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_COLORS[g.followUpStatus]}`}>{g.followUpStatus}</span>
              </div>

              {expanded === g._id && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-300" />
                        {g.email ? <span className="text-xs text-slate-700">{g.email}</span> : <span className="text-xs text-slate-300 italic">Not provided</span>}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-300" />
                        {g.phone ? <span className="text-xs text-slate-700">{g.phone}</span> : <span className="text-xs text-slate-300 italic">Not provided</span>}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Source</label>
                      <p className="text-xs text-slate-700 mt-0.5">{g.source || "—"}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Home Club</label>
                      <input type="text" value={g.homeClub} onChange={e => handleUpdate(g._id, { homeClub: e.target.value })}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded mt-0.5" placeholder="e.g. Bangalore Toastmasters" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Follow-up Status</label>
                      <select value={g.followUpStatus} onChange={e => handleUpdate(g._id, { followUpStatus: e.target.value as Guest["followUpStatus"] })}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded mt-0.5">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">First Visit</label>
                      <p className="text-xs text-slate-700 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-300" /> {new Date(g.firstVisit).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Visit</label>
                      <p className="text-xs text-slate-700 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-300" /> {new Date(g.lastVisit).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Interests</label>
                      <input type="text" value={g.interests} onChange={e => handleUpdate(g._id, { interests: e.target.value })}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded mt-0.5" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Follow-up Notes</label>
                      <textarea value={g.followUpNotes} onChange={e => handleUpdate(g._id, { followUpNotes: e.target.value })}
                        className="w-full text-xs px-2 py-1 border border-slate-200 rounded mt-0.5 h-16 resize-none" />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-[9px] text-slate-400">Added by {g.addedBy || "unknown"}</span>
                    <button onClick={() => handleDelete(g._id)} className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Add Guest</h3>
            <div className="space-y-3">
              <input placeholder="Full name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <input placeholder="How did they hear about the club?" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              <input placeholder="Home club (if visiting Toastmaster)" value={form.homeClub} onChange={e => setForm({ ...form, homeClub: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              <textarea placeholder="Interests, notes..." value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg h-16 resize-none" />
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                <button onClick={handleCreate} disabled={!form.name}
                  className="text-xs px-3 py-1.5 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50">Add Guest</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
