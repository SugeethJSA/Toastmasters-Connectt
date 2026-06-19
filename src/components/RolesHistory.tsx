import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function RolesHistory() {
  const [history, setHistory] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/roles/history`, { credentials: "include" });
      const data = await res.json();
      setHistory(data.history || {});
    } catch (err) {
      console.error("Failed to fetch roles history", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const entries = Object.entries(history) as [string, Record<string, number>][];
  const members = entries
    .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[1].Total || 0) - (a[1].Total || 0));

  const allRoles = new Set<string>();
  Object.values(history).forEach(roles => Object.keys(roles).forEach(r => { if (r !== "Total") allRoles.add(r); }));
  const sortedRoles = Array.from(allRoles).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-tm-yellow border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-tm-yellow" />
          Meeting Roles History
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search member..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-tm-yellow w-60" />
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-12">No role history found yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map(([name, roles]: [string, Record<string, number>]) => (
            <div key={name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(expanded === name ? null : name)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-tm-yellow/20 flex items-center justify-center">
                    <span className="text-tm-dark font-bold text-sm">{name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{(roles.Total || 0)} total roles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                    {(Object.entries(roles) as [string, number][]).filter(([r]) => r !== "Total").sort((a, b) => b[1] - a[1]).slice(0, 3).map(([role, count]) => (
                      <span key={role} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{role} ({count})</span>
                    ))}
                  </div>
                  {expanded === name ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>
              {expanded === name && (
                <div className="px-5 pb-4 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-3">
                    {sortedRoles.map(role => {
                      const count: number = roles[role] || 0;
                      if (count === 0) return null;
                      return (
                        <div key={role} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">{role}</p>
                          <p className="text-lg font-bold font-display text-slate-800 mt-0.5">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
