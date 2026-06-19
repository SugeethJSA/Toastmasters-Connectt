import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Save, Loader2, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const ClubSettings: React.FC = () => {
  const { user } = useAuth();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", meetingDay: "", meetingTime: "", meetingLink: "",
    location: "", timezone: "", district: "", area: "",
    clubNumber: "", description: ""
  });

  const fetchClub = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/club`, { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      if (data.club) {
        setClub(data.club);
        setForm({
          name: data.club.name || "",
          meetingDay: data.club.meetingDay || "Friday",
          meetingTime: data.club.meetingTime || "19:00",
          meetingLink: data.club.meetingLink || "",
          location: data.club.location || "",
          timezone: data.club.timezone || "America/New_York",
          district: data.club.district || "",
          area: data.club.area || "",
          clubNumber: data.club.clubNumber || "",
          description: data.club.description || ""
        });
      } else {
        setError("Club not found — no club data returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load club settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-tm-blue" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl p-6 border border-rose-200 shadow-sm">
        <div className="text-center py-8">
          <h2 className="text-lg font-bold text-rose-700 mb-2">Failed to Load Club Settings</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={fetchClub} className="px-4 py-2 bg-tm-blue text-white rounded-lg text-sm cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/club`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setClub(data.club);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-tm-blue" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-tm-blue" />
          <div>
            <h2 className="text-xl font-bold font-display text-tm-dark">Club Settings</h2>
            <p className="text-sm text-slate-500 font-sans">Manage your club's profile and meeting details</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Club Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Day</label>
              <select value={form.meetingDay} onChange={e => setForm({ ...form, meetingDay: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm bg-white">
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Time</label>
              <input type="time" value={form.meetingTime} onChange={e => setForm({ ...form, meetingTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">District</label>
              <input type="text" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" placeholder="e.g. 120" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Area</label>
              <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" placeholder="e.g. F4" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Club Number</label>
              <input type="text" value={form.clubNumber} onChange={e => setForm({ ...form, clubNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" placeholder="e.g. 1234567" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meeting Link (Zoom/Google Meet)</label>
              <input type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" placeholder="https://zoom.us/j/..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location (In-person)</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm" placeholder="Room 101, Main Hall" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
              <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm bg-white">
                {["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Anchorage","Pacific/Honolulu","Europe/London","Europe/Paris","Asia/Tokyo","Asia/Kolkata","Australia/Sydney"].map(tz =>
                  <option key={tz} value={tz}>{tz}</option>
                )}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-tm-blue text-sm resize-none" />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-tm-blue hover:bg-tm-dark text-white font-bold rounded-lg text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
