import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface TimerPreset {
  id: string;
  name: string;
  minSeconds: number;
  yellowSeconds: number;
  maxSeconds: number;
  segment: string;
}

interface TimerPresetsProps {
  onApply: (preset: TimerPreset) => void;
}

export const TimerPresetsPanel: React.FC<TimerPresetsProps> = ({ onApply }) => {
  const { user } = useAuth();
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: "", minSeconds: 300, yellowSeconds: 360, maxSeconds: 420, segment: "PREPARED_SPEECH" });
  const [saving, setSaving] = useState(false);

  const isOfficer = user?.role === "admin" || user?.role === "officer";

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/timer-presets`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreset.name.trim()) return;
    setSaving(true);
    try {
      const payload = { id: "preset-" + Date.now(), ...newPreset };
      await fetch(`${API_BASE}/api/timer-presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      await fetchPresets();
      setShowForm(false);
      setNewPreset({ name: "", minSeconds: 300, yellowSeconds: 360, maxSeconds: 420, segment: "PREPARED_SPEECH" });
    } catch (err) {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/timer-presets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetchPresets();
    } catch (err) {
      // Silent fail
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-semibold text-xs text-slate-600 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Timer Presets
        </h4>
        {isOfficer && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[10px] text-tm-blue hover:bg-tm-blue/10 px-2 py-0.5 rounded cursor-pointer"
          >
            <Plus className="w-3 h-3 inline" /> New
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="text"
            value={newPreset.name}
            onChange={(e) => setNewPreset((p) => ({ ...p, name: e.target.value }))}
            placeholder="Preset name"
            className="w-full px-2 py-1 border rounded text-[11px] outline-none focus:border-tm-blue"
            required
          />
          <div className="grid grid-cols-3 gap-1">
            <input type="number" value={newPreset.minSeconds / 60} onChange={(e) => setNewPreset((p) => ({ ...p, minSeconds: Number(e.target.value) * 60 }))} placeholder="Min" className="px-1 py-1 border rounded text-[10px] w-full" min={1} />
            <input type="number" value={newPreset.yellowSeconds / 60} onChange={(e) => setNewPreset((p) => ({ ...p, yellowSeconds: Number(e.target.value) * 60 }))} placeholder="Yel" className="px-1 py-1 border rounded text-[10px] w-full" min={1} />
            <input type="number" value={newPreset.maxSeconds / 60} onChange={(e) => setNewPreset((p) => ({ ...p, maxSeconds: Number(e.target.value) * 60 }))} placeholder="Max" className="px-1 py-1 border rounded text-[10px] w-full" min={1} />
          </div>
          <div className="flex gap-1">
            <button type="submit" disabled={saving} className="flex-1 py-1 bg-tm-blue text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Save className="w-3 h-3 inline" />} Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] cursor-pointer">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group">
              <button
                onClick={() => onApply(p)}
                className="text-left flex-1 cursor-pointer"
              >
                <p className="text-[11px] font-semibold text-slate-700">{p.name}</p>
                <p className="text-[9px] text-slate-400 font-mono">
                  {p.minSeconds / 60}:00 / {p.yellowSeconds / 60}:00 / {p.maxSeconds / 60}:00
                </p>
              </button>
              {isOfficer && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};