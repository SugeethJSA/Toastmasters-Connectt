import React, { useState, useEffect, useCallback } from "react";
import { Award, Target, TrendingUp, Users, BookOpen, Shield, RotateCcw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface DcpGoal {
  _id: string;
  number: number;
  title: string;
  description: string;
  category: "education" | "membership" | "training" | "administration";
  target: number;
  current: number;
  achieved: boolean;
  notes: string;
  year: string;
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  education: { label: "Education", icon: BookOpen, color: "bg-blue-500" },
  membership: { label: "Membership", icon: Users, color: "bg-emerald-500" },
  training: { label: "Training", icon: TrendingUp, color: "bg-purple-500" },
  administration: { label: "Administration", icon: Shield, color: "bg-amber-500" },
};

export function DcpDashboard() {
  const [goals, setGoals] = useState<DcpGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [year] = useState("2025-2026");

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dcp/goals?year=${year}`, { credentials: "include" });
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error("Failed to fetch DCP goals", err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const updateGoal = async (id: string, updates: Partial<DcpGoal>) => {
    const old = goals;
    setGoals(prev => prev.map(g => g._id === id ? { ...g, ...updates } : g));
    try {
      await fetch(`${API_BASE}/api/dcp/goals/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(updates),
      });
    } catch {
      setGoals(old);
    }
  };

  const resetGoals = async () => {
    if (!confirm("Reset all DCP goals to defaults? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/dcp/goals/reset`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error("Failed to reset DCP goals", err);
    } finally {
      setLoading(false);
    }
  };

  const achievedCount = goals.filter(g => g.achieved).length;
  const totalPossible = goals.length;
  const pct = totalPossible > 0 ? Math.round((achievedCount / totalPossible) * 100) : 0;

  let status: string, statusColor: string;
  if (achievedCount >= 9) { status = "President's Distinguished"; statusColor = "text-yellow-500"; }
  else if (achievedCount >= 7) { status = "Select Distinguished"; statusColor = "text-sky-400"; }
  else if (achievedCount >= 5) { status = "Distinguished"; statusColor = "text-emerald-400"; }
  else { status = "Standard"; statusColor = "text-slate-400"; }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-tm-yellow border-t-transparent" />
      </div>
    );
  }

  const categories = ["education", "membership", "training", "administration"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
          <Award className="w-6 h-6 text-tm-yellow" />
          Distinguished Club Program ({year})
        </h2>
        <button onClick={resetGoals} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Reset Goals
        </button>
      </div>

      {/* DCP Status */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Points Earned</p>
          <p className="text-3xl font-bold font-display text-slate-800 mt-1">{achievedCount} <span className="text-lg text-slate-400 font-normal">/ {totalPossible}</span></p>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-tm-yellow rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Club Status</p>
          <p className={`text-xl font-bold font-display mt-1 ${statusColor}`}>{status}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Goals Achieved</p>
          <p className="text-3xl font-bold font-display text-emerald-500 mt-1">{achievedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Goals Remaining</p>
          <p className="text-3xl font-bold font-display text-rose-500 mt-1">{totalPossible - achievedCount}</p>
        </div>
      </div>

      {/* Goals by Category */}
      {categories.map(cat => {
        const catGoals = goals.filter(g => g.category === cat);
        if (catGoals.length === 0) return null;
        const meta = CATEGORY_META[cat];
        const catAchieved = catGoals.filter(g => g.achieved).length;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${meta.color} bg-opacity-20 flex items-center justify-center`}>
                <meta.icon className={`w-4 h-4 ${meta.color.replace("bg-", "text-")}`} />
              </div>
              <h3 className="font-display font-bold text-slate-700">{meta.label}</h3>
              <span className="text-xs text-slate-400 ml-auto">{catAchieved}/{catGoals.length} achieved</span>
            </div>
            <div className="space-y-3">
              {catGoals.map(goal => {
                const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                const overTarget = goal.current >= goal.target;
                return (
                  <div key={goal._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{goal.number}</span>
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{goal.title}</h4>
                          {goal.achieved && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">ACHIEVED</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600 shrink-0 cursor-pointer select-none">
                        <input type="checkbox" checked={goal.achieved} onChange={e => updateGoal(goal._id, { achieved: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-tm-yellow focus:ring-tm-yellow cursor-pointer" />
                        Done
                      </label>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Current:</span>
                        <input type="number" min="0" value={goal.current} onChange={e => updateGoal(goal._id, { current: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-mono text-center focus:outline-none focus:ring-1 focus:ring-tm-yellow" />
                      </div>
                      <span className="text-xs text-slate-300">/</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Target:</span>
                        <input type="number" min="1" value={goal.target} onChange={e => updateGoal(goal._id, { target: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700 font-mono text-center focus:outline-none focus:ring-1 focus:ring-tm-yellow" />
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${overTarget ? "bg-emerald-400" : "bg-tm-yellow"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-mono font-bold ${overTarget ? "text-emerald-500" : "text-slate-400"}`}>{pct}%</span>
                    </div>
                    <input type="text" placeholder="Notes..." value={goal.notes} onChange={e => updateGoal(goal._id, { notes: e.target.value })}
                      className="mt-2 w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-600 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-tm-yellow" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
