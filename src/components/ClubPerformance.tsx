import React, { useState, useEffect } from "react";
import { 
  Award, Target, Users, TrendingUp, Calendar, ArrowUpRight, 
  BarChart3, CheckCircle2, Star, ShieldCheck, Heart, Loader2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface AnalyticsData {
  totalMeetings: number;
  totalTimerLogs: number;
  totalEvaluations: number;
  totalAttendance: number;
  approvedCount: number;
  attendanceTrend: { month: string; count: number }[];
  milestones: { name: string; evaluator: string; speechTitle: string; meetingNumber: number; date: string }[];
  currentMeeting: { number: number; theme: string; date: string; attendanceCount: number; timerLogCount: number } | null;
}

export const ClubPerformance: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-tm-blue" />
      </div>
    );
  }

  const avgAttendance = data && data.totalMeetings > 0 ? Math.round((data.totalAttendance / data.totalMeetings) / (data.currentMeeting?.attendanceCount || 1) * 100) : 78;
  const approvedPct = data && data.totalMeetings > 0 ? Math.round((data.approvedCount / data.totalMeetings) * 100) : 0;

  return (
    <div id="club-performance-dashboard-view" className="space-y-6">
      
      {/* Title block */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
          <div>
            <h2 className="text-xl font-bold font-display text-tm-dark">
              Club Performance Dashboard
            </h2>
            <p className="text-sm text-slate-500 font-sans mt-0.5">
              Presiding Officer Dashboard • Real-time metrics for Sophrosyne VIT Area F4 District 120.
              {data && <span className="ml-2 text-tm-blue font-semibold">{data.totalMeetings} meetings recorded</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 (Span 2): DCP Progress & Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-tm-maroon" />
                <h3 className="font-display font-semibold text-slate-800 text-sm">Club Performance Summary</h3>
              </div>
              <span className="bg-tm-blue/10 text-tm-blue text-xs font-bold font-mono px-2.5 py-1 rounded">
                {data ? `${data.approvedCount} / ${data.totalMeetings} Meetings Approved` : "Loading..."}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <Calendar className="w-5 h-5 text-tm-blue mx-auto" />
                <strong className="text-lg block font-display text-slate-800">{data?.totalMeetings || 0}</strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Meetings</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <Users className="w-5 h-5 text-emerald-600 mx-auto" />
                <strong className="text-lg block font-display text-slate-800">{data?.totalAttendance || 0}</strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Total Check-ins</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <BarChart3 className="w-5 h-5 text-amber-600 mx-auto" />
                <strong className="text-lg block font-display text-slate-800">{data?.totalTimerLogs || 0}</strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Timer Logs</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <Star className="w-5 h-5 text-indigo-600 mx-auto" />
                <strong className="text-lg block font-display text-slate-800">{data?.totalEvaluations || 0}</strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Evaluations</span>
              </div>
            </div>
          </div>

          {/* Attendance Trend Chart */}
          {data && data.attendanceTrend.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-tm-blue" /> Attendance Trend (Archive)
              </h3>
              <div className="h-40 w-full bg-slate-50 rounded-xl border border-slate-200/55 p-3 flex items-end gap-2.5">
                {data.attendanceTrend.map((d) => {
                  const pct = Math.min((d.count / 30) * 100, 100);
                  return (
                    <div key={d.month} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity z-10">
                        {d.count} checked in
                      </div>
                      <div style={{ height: `${pct || 2}%` }} className="w-3 bg-tm-blue rounded-t transition-all hover:bg-tm-maroon" />
                      <span className="text-[10px] font-mono text-slate-400 mt-1">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stats & Milestones */}
        <div className="space-y-6 text-xs font-sans">
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Engagement Insights</h3>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center space-y-1">
                <Users className="w-6 h-6 text-tm-blue mx-auto" />
                <strong className="text-xl block font-display text-slate-800">{avgAttendance}%</strong>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Avg Attendance</span>
              </div>
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <strong className="text-xl block font-display text-slate-800">{approvedPct}%</strong>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">MOM Approval Rate</span>
              </div>
            </div>
          </div>

          {data?.currentMeeting && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Current Meeting</h3>
              <div className="space-y-2">
                <p className="text-slate-600">#{data.currentMeeting.number} &mdash; {data.currentMeeting.theme}</p>
                <div className="flex gap-3 text-[10px]">
                  <span className="bg-tm-blue/10 text-tm-blue px-2 py-0.5 rounded font-mono">{data.currentMeeting.attendanceCount} checked in</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">{data.currentMeeting.timerLogCount} timer logs</span>
                </div>
              </div>
            </div>
          )}

          {/* Educational Milestones from Archive */}
          {data && data.milestones.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Recent Evaluations</h3>
              <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                {data.milestones.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div>
                      <strong className="text-slate-800 block text-xs">{item.name}</strong>
                      <span className="text-[10px] text-slate-400">by {item.evaluator}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-tm-maroon">#{item.meetingNumber}</span>
                      <span className="block text-[9px] text-slate-400">{item.speechTitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};