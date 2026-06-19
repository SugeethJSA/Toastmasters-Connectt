import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const failCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { credentials: "include" });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        failCountRef.current = 0;
      }
    } catch {
      failCountRef.current++;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const getInterval = () => Math.min(30000 * Math.pow(2, failCountRef.current), 300000);
    intervalRef.current = setInterval(fetchNotifications, getInterval());
    const adaptiveInterval = setInterval(() => {
      clearInterval(intervalRef.current!);
      intervalRef.current = setInterval(fetchNotifications, getInterval());
    }, 60000);
    return () => { clearInterval(intervalRef.current!); clearInterval(adaptiveInterval); };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {
      // silent
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "role_assigned": return "🎤";
      case "meeting_reminder": return "📅";
      case "member_approved": return "✅";
      case "mom_published": return "📄";
      case "vote_alert": return "🗳️";
      default: return "🔔";
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[10px] text-tm-blue hover:underline font-semibold cursor-pointer flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No notifications yet</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n._id}
                  onClick={() => { handleMarkRead(n._id); }}
                  className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${n.read ? '' : 'bg-tm-blue/5'}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0">{getTypeIcon(n.type)}</span>
                    <div className="min-w-0">
                      <p className={`text-[11px] ${n.read ? 'text-slate-500' : 'text-slate-800 font-semibold'}`}>{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[8px] text-slate-300 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-tm-blue rounded-full shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
