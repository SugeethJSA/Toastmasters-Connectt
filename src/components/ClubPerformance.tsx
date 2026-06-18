import React from "react";
import { 
  Award, Target, Users, TrendingUp, Calendar, ArrowUpRight, 
  BarChart3, CheckCircle2, Star, ShieldCheck, Heart
} from "lucide-react";

export const ClubPerformance: React.FC = () => {
  const dcpGoals = [
    { title: "Education: 2 Level 1s", met: true, key: "ed-1" },
    { title: "Education: 2 Level 2s", met: true, key: "ed-2" },
    { title: "Education: 2 Level 3s", met: false, key: "ed-3" },
    { title: "Education: 1 Level 4, 1 Level 5, or 1 DTM", met: true, key: "ed-4" },
    { title: "Membership: 4 New Members", met: false, key: "mem-1" },
    { title: "Membership: 4 More New Members", met: false, key: "mem-2" },
    { title: "Training: 4 Officers Trained in Summer & Winter", met: true, key: "trn-1" },
    { title: "Administration: Dues Renewals & Officer List On-Time", met: true, key: "adm-1" },
  ];

  const chartData = [
    { month: "Jul", active: 22, target: 20 },
    { month: "Aug", active: 24, target: 20 },
    { month: "Sep", active: 25, target: 20 },
    { month: "Oct", active: 28, target: 20 },
    { month: "Nov", active: 29, target: 20 },
    { month: "Dec", active: 31, target: 20 },
    { month: "Jan", active: 30, target: 22 },
    { month: "Feb", active: 34, target: 22 },
    { month: "Mar", active: 35, target: 22 },
    { month: "Apr", active: 38, target: 24 },
    { month: "May", active: 40, target: 24 },
    { month: "Jun", active: 42, target: 24 },
  ];

  const milestones = [
    { name: "Sarah Jenkins", path: "Dynamic Leadership", level: "Level 4", status: "Completed", color: "bg-emerald-100 text-emerald-800" },
    { name: "David Chen", path: "Innovative Planning", level: "Level 2", status: "In Progress", color: "bg-amber-100 text-amber-800" },
    { name: "Elena Rodriguez", path: "Persuasive Influence", level: "Level 5", status: "Pending Award", color: "bg-blue-100 text-blue-800 animate-pulse" },
    { name: "Marcus Brody", path: "Presentation Mastery", level: "Level 1", status: "Completed", color: "bg-emerald-100 text-emerald-800" },
  ];

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
              Presiding Officer Dashboard • Real-time metrics and progress indicators for Sophrosyne VIT Area F4 District 120.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded font-display" onClick={() => alert("Report compiled and exported to clipboard.")}>
              Export Report
            </button>
            <button className="px-3.5 py-1.5 bg-tm-maroon text-white hover:opacity-90 text-xs font-bold rounded font-display" onClick={() => alert("DCP targets aligned with official Toastmasters Club Central record.")}>
              Align Targets
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 (Span 2): DCP Progress Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-tm-maroon" />
                <h3 className="font-display font-semibold text-slate-800 text-sm">DCP Progress Tracker</h3>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold font-mono px-2.5 py-1 rounded">
                DCP Goal Status: 7 / 10 Met
              </span>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Distinguished Club Program (DCP) requirements represent the standard of education, growth, administration, and training excellence mandated by Toastmasters International Chapter bylaws.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              {dcpGoals.map((g, idx) => (
                <div key={g.key} className="p-3.5 bg-slate-50/70 border border-slate-150 rounded-lg flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${g.met ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 block text-xs">Goal #{idx + 1}: {g.met ? "Met" : "Pending"}</strong>
                    <span className="text-slate-500 mt-1 block">{g.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall DCP Level Visual gauge */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-4 text-xs font-sans">
              <Award className="w-8 h-8 text-tm-maroon shrink-0" />
              <div>
                <strong className="text-indigo-950 font-display block text-sm">Select Honor standing reached: Presidents Distinguished Club</strong>
                <span className="text-indigo-800 mt-0.5 block">Meeting 7 out of 10 goals unlocks highest honor status when membership levels reach charter thresholds.</span>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Chart (Replica of Bento Item 3 in the prompt) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <BarChart3 className="w-5 h-5 text-tm-blue" /> Membership Health & Active Roster Trend (12 Months)
              </h3>
              <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-tm-blue" />
                  <span>Active Members</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                  <span>Charter Target Base (20)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-450 italic font-sans pl-1">
              Active physical paid-member roster records showing consistent month-on-month growth.
            </p>

            {/* Custom SVG/CSS dynamic chart replica */}
            <div className="h-44 w-full bg-slate-50 rounded-xl border border-slate-200/55 p-3 flex items-end gap-2.5 mt-2">
              {chartData.map((d) => {
                const activePct = (d.active / 45) * 100;
                const targetPct = (d.target / 45) * 100;
                return (
                  <div key={d.month} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                    {/* Tooltip feedback */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-850 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity z-10">
                      Act: {d.active} / Trg: {d.target}
                    </div>

                    <div className="w-full relative flex items-end justify-center h-[90%] pb-1 gap-0.5">
                      {/* Target Base visual column shadow */}
                      <div 
                        style={{ height: `${targetPct}%` }}
                        className="w-1.5 bg-slate-300 rounded-t"
                      />
                      {/* Active level bar */}
                      <div 
                        style={{ height: `${activePct}%` }}
                        className="w-2.5 bg-tm-blue rounded-t transition-all hover:bg-tm-maroon"
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 mt-1">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Engagement Stats, Milestone Lists, Officer gauges */}
        <div className="space-y-6 text-xs font-sans">
          
          {/* Engagement metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-slate-850 text-sm">Engagement Insights</h3>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl text-center space-y-1">
                <Users className="w-6 h-6 text-tm-blue mx-auto" />
                <strong className="text-xl block font-display text-slate-800">78%</strong>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Avg Attendance</span>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl text-center space-y-1">
                <Heart className="w-6 h-6 text-tm-maroon mx-auto" />
                <strong className="text-xl block font-display text-slate-800">92%</strong>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Retention Rate</span>
              </div>
            </div>
            
            <button 
              onClick={() => alert("Launching global analytics report generator...")}
              className="w-full py-2 bg-slate-55 border border-slate-200 text-slate-700 font-bold font-display uppercase tracking-widest text-[9px] hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Analyze Retention Cohorts
            </button>
          </div>

          {/* Officer Dashboard Training gauge */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Executive Officer Training</h3>
            
            <div className="flex items-center justify-center p-4">
              <div className="relative w-28 h-28 flex flex-col items-center justify-center rounded-full border-4 border-slate-105">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-slate-100" 
                    cx="50" 
                    cy="50" 
                    fill="none" 
                    r="45" 
                    stroke="#eaeaea" 
                    strokeWidth="6"
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    fill="none" 
                    r="45" 
                    stroke="#772432" 
                    strokeWidth="6"
                    strokeDasharray="283"
                    strokeDashoffset="0" // 100% trained
                  />
                </svg>
                <div className="text-center font-sans z-10">
                  <span className="text-xl font-bold font-display text-slate-800">7 / 7</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mt-0.5">Officers Trained</span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-center text-slate-500 leading-normal font-sans px-2">
              All club officers have completed required District 101 leadership training for this period, fulfilling administrative DCP Criterion 9.
            </p>
          </div>

          {/* Educational Milestones list panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Educational Milestones</h3>
            <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
              {milestones.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                  <div>
                    <strong className="text-slate-800 block text-xs">{item.name}</strong>
                    <span className="text-[10px] text-slate-400 font-sans mt-0.5">{item.path}</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 font-sans">
                    <span className="text-[10px] font-semibold text-tm-maroon">{item.level}</span>
                    <span className={`px-2 py-0.5 text-[9px] rounded font-bold font-mono tracking-wide uppercase ${item.color}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
