import React, { useState, useEffect } from "react";
import { User, Camera, Lock, Save, Loader2, Phone, Mail, Quote } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", avatarUrl: "", photoUrl: "", quote: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/profile`, { credentials: "include" });
        const data = await res.json();
        if (data.user) {
          setForm({
            name: data.user.name || "",
            phone: data.user.phone || "",
            avatarUrl: data.user.avatarUrl || "",
            photoUrl: data.user.photoUrl || "",
            quote: data.user.quote || "",
          });
        }
      } catch {} finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error || "Failed to save" }); return; }
      updateUser(data.user);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch { setMessage({ type: "error", text: "Failed to save profile" }); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwMessage(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "Passwords do not match" }); return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: "error", text: "Password must be at least 6 characters" }); return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMessage({ type: "error", text: data.error || "Failed to change password" }); return; }
      setPwMessage({ type: "success", text: "Password changed successfully" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch { setPwMessage({ type: "error", text: "Failed to change password" }); }
    finally { setPwSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-tm-blue" /></div>;

  const avatarSrc = form.avatarUrl || form.photoUrl || "";

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-tm-blue/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-tm-blue/20">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <User className="w-7 h-7 text-tm-blue" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      {message && (
        <div className={`text-xs px-4 py-2 rounded-lg font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-tm-blue" /> Personal Information</h3>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avatar URL</label>
          <div className="flex items-center gap-2 mt-1">
            <Camera className="w-4 h-4 text-slate-300 shrink-0" />
            <input type="text" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg" className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20 mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
            <input type="email" value={user?.email || ""} disabled
              className="w-full text-xs px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded-lg mt-1 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 123-4567" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20 mt-1" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Quote className="w-3 h-3" /> Quote / Motto</label>
          <input type="text" value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })}
            placeholder="Your favorite quote or motto..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20 mt-1" />
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving}
            className="text-xs px-4 py-2 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50 hover:bg-tm-blue/90 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Lock className="w-4 h-4 text-tm-blue" /> Change Password</h3>

        {pwMessage && (
          <div className={`text-xs px-4 py-2 rounded-lg font-semibold ${pwMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {pwMessage.text}
          </div>
        )}

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
          <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20 mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20 mt-1" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleChangePassword} disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="text-xs px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50 hover:bg-slate-800 transition-colors">
            {pwSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
        <h3 className="text-sm font-bold text-slate-700">Account Info</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-slate-400">Role:</span> <span className="font-semibold text-slate-700 capitalize">{user?.role || "Member"}</span></div>
          <div><span className="text-slate-400">Club ID:</span> <span className="font-semibold text-slate-700">{user?.clubId || "—"}</span></div>
          <div><span className="text-slate-400">Club:</span> <span className="font-semibold text-slate-700">{user?.clubName || "—"}</span></div>
          <div><span className="text-slate-400">Account Status:</span> <span className="font-semibold text-emerald-600">Active</span></div>
        </div>
      </div>
    </div>
  );
};
