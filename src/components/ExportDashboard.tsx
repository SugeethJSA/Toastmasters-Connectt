import React from "react";
import { Download, Users, UserPlus, DollarSign, TrendingDown, BookOpen, Award } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const EXPORTS = [
  { key: "members", label: "Members", desc: "Name, email, role, phone, join date", icon: Users, color: "bg-blue-500" },
  { key: "guests", label: "Guests", desc: "Name, contact, source, home club, status, visit dates", icon: UserPlus, color: "bg-amber-500" },
  { key: "dues", label: "Dues Records", desc: "Member, period, amount, payment status, method", icon: DollarSign, color: "bg-emerald-500" },
  { key: "expenses", label: "Expenses", desc: "Description, amount, category, date, paid by", icon: TrendingDown, color: "bg-rose-500" },
  { key: "pathways", label: "Pathways", desc: "Member, pathway name, level, progress, status", icon: BookOpen, color: "bg-purple-500" },
  { key: "awards", label: "Education Awards", desc: "Member, award name, date awarded", icon: Award, color: "bg-tm-blue" },
];

export const ExportDashboard: React.FC = () => {
  const handleExport = (entity: string) => {
    const a = document.createElement("a");
    a.href = `${API_BASE}/api/export/${entity}`;
    a.download = `${entity}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Download className="w-5 h-5 text-tm-blue" /> Export & Reports
        </h2>
        <p className="text-sm text-slate-500">Download club data as CSV spreadsheets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPORTS.map(exp => (
          <button key={exp.key} onClick={() => handleExport(exp.key)}
            className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-tm-blue/30 hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg ${exp.color} flex items-center justify-center shrink-0`}>
                <exp.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-tm-blue transition-colors">{exp.label}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{exp.desc}</p>
              </div>
              <Download className="w-4 h-4 text-slate-300 group-hover:text-tm-blue shrink-0 mt-1 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-2">Notes</h3>
        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
          <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet app</li>
          <li>Data is filtered to your club only</li>
          <li>Dates are in ISO format (YYYY-MM-DD)</li>
          <li>For MongoDB users, data reflects the latest saved state</li>
        </ul>
      </div>
    </div>
  );
};
