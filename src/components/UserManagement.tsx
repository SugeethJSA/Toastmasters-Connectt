import React, { useState, useEffect } from "react";
import { ShieldCheck, User, Save, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface UserRecord {
  _id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  photoUrl?: string;
  quote?: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "member" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editRole, setEditRole] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        await fetchUsers();
        setNewUser({ email: "", password: "", name: "", role: "member" });
        setShowAddForm(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create user");
      }
    } catch (err) {
      alert("Failed to create user");
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserRecord>) => {
    setSaving(id);
    try {
      await fetch(`${API_BASE}/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      await fetchUsers();
    } catch (err) {
      // Silent fail
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await fetch(`${API_BASE}/api/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleRoleSave = async (userId: string) => {
    const newRole = editRole[userId];
    if (!newRole) return;
    await handleUpdateUser(userId, { role: newRole });
    setEditRole((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  const isOfficer = currentUser?.role === "admin" || currentUser?.role === "officer";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-tm-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">
            User Management & Role Delegation
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Manage club members, assign roles, and control access permissions.
          </p>
        </div>
        {isOfficer && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-tm-blue hover:bg-tm-dark text-white rounded-lg font-display font-bold text-xs tracking-wider cursor-pointer"
          >
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        )}
      </div>

      {showAddForm && isOfficer && (
        <form onSubmit={handleAddUser} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-sm text-slate-700">Register New Club Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border rounded-lg outline-none focus:border-tm-blue text-xs"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 border rounded-lg outline-none focus:border-tm-blue text-xs"
              required
            />
            <input
              type="password"
              placeholder="Password (default: toastmasters123)"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              className="px-3 py-2 border rounded-lg outline-none focus:border-tm-blue text-xs"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border rounded-lg outline-none focus:border-tm-blue text-xs bg-white"
            >
              <option value="member">Member</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-tm-maroon text-white rounded-lg font-display font-bold text-xs tracking-wider cursor-pointer">
            <Save className="w-4 h-4 inline mr-1" /> Create User
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u._id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  {u.photoUrl ? (
                    <img src={u.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {u.isActive ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">Active</span>
                ) : (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded uppercase">Inactive</span>
                )}

                {isOfficer && editRole[u._id] ? (
                  <div className="flex items-center gap-1">
                    <select
                      value={editRole[u._id]}
                      onChange={(e) => setEditRole((prev) => ({ ...prev, [u._id]: e.target.value }))}
                      className="px-2 py-1 border rounded text-xs bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                    <button
                      onClick={() => handleRoleSave(u._id)}
                      disabled={saving === u._id}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                    >
                      {saving === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                ) : isOfficer ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${u.role === "admin" ? "bg-purple-100 text-purple-800" : u.role === "officer" ? "bg-tm-blue/10 text-tm-blue" : "bg-slate-100 text-slate-600"}`}>
                    {u.role}
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${u.role === "admin" ? "bg-purple-100 text-purple-800" : u.role === "officer" ? "bg-tm-blue/10 text-tm-blue" : "bg-slate-100 text-slate-600"}`}>
                    {u.role}
                  </span>
                )}

                {isOfficer && (
                  <div className="flex items-center gap-1">
                    {!editRole[u._id] && (
                      <button
                        onClick={() => setEditRole((prev) => ({ ...prev, [u._id]: u.role }))}
                        className="p-1 text-slate-400 hover:text-tm-blue rounded cursor-pointer"
                        title="Change role"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                      className={`p-1 rounded cursor-pointer ${u.isActive ? "text-rose-400 hover:text-rose-600" : "text-emerald-400 hover:text-emerald-600"}`}
                      title={u.isActive ? "Deactivate" : "Activate"}
                    >
                      {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};