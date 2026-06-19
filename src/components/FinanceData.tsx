import React, { useState } from "react";
import { DollarSign, Download } from "lucide-react";
import { FinanceDashboard } from "./FinanceDashboard";
import { ExportDashboard } from "./ExportDashboard";

const TABS = [
  { key: "finance", label: "Finance", icon: DollarSign },
  { key: "exports", label: "Exports", icon: Download },
];

export function FinanceData() {
  const [tab, setTab] = useState("finance");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === t.key ? "border-tm-yellow text-tm-dark" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "finance" && <FinanceDashboard />}
      {tab === "exports" && <ExportDashboard />}
    </div>
  );
}
