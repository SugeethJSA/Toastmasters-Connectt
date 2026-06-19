import React, { useState, useEffect } from "react";
import { DollarSign, Plus, X, Loader2, TrendingUp, TrendingDown, Wallet, Search, CreditCard } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface DuesRecord {
  _id: string;
  memberId: string;
  memberName: string;
  period: string;
  amount: number;
  paid: boolean;
  paidAt: string | null;
  method: string;
  notes: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  incurredAt: string;
  paidBy: string;
  notes: string;
}

const CATEGORIES = ["venue", "food", "supplies", "awards", "contest", "technology", "other"];

export const FinanceDashboard: React.FC = () => {
  const [dues, setDues] = useState<DuesRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dues" | "expenses" | "overview">("overview");
  const [showDueForm, setShowDueForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [search, setSearch] = useState("");

  const [dueForm, setDueForm] = useState({ memberId: "", memberName: "", period: "", amount: 20, paid: false, method: "cash", notes: "" });
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: 0, category: "other", incurredAt: new Date().toISOString().slice(0,10), paidBy: "", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [duesRes, expRes] = await Promise.all([
        fetch(`${API_BASE}/api/dues`, { credentials: "include" }),
        fetch(`${API_BASE}/api/expenses`, { credentials: "include" }),
      ]);
      const duesData = await duesRes.json();
      const expData = await expRes.json();
      setDues(duesData.dues || []);
      setExpenses(expData.expenses || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalCollected = dues.filter(d => d.paid).reduce((s, d) => s + d.amount, 0);
  const totalOutstanding = dues.filter(d => !d.paid).reduce((s, d) => s + d.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalCollected - totalExpenses;

  const handleCreateDue = async () => {
    try {
      await fetch(`${API_BASE}/api/dues`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(dueForm) });
      setShowDueForm(false);
      setDueForm({ memberId: "", memberName: "", period: "", amount: 20, paid: false, method: "cash", notes: "" });
      fetchData();
    } catch {}
  };

  const handleTogglePaid = async (id: string, paid: boolean) => {
    try {
      await fetch(`${API_BASE}/api/dues/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ paid, paidAt: paid ? new Date().toISOString() : null }) });
      fetchData();
    } catch {}
  };

  const handleDeleteDue = async (id: string) => {
    try { await fetch(`${API_BASE}/api/dues/${id}`, { method: "DELETE", credentials: "include" }); fetchData(); } catch {}
  };

  const handleCreateExpense = async () => {
    try {
      await fetch(`${API_BASE}/api/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(expenseForm) });
      setShowExpenseForm(false);
      setExpenseForm({ description: "", amount: 0, category: "other", incurredAt: new Date().toISOString().slice(0,10), paidBy: "", notes: "" });
      fetchData();
    } catch {}
  };

  const handleDeleteExpense = async (id: string) => {
    try { await fetch(`${API_BASE}/api/expenses/${id}`, { method: "DELETE", credentials: "include" }); fetchData(); } catch {}
  };

  const filteredDues = dues.filter(d => d.memberName.toLowerCase().includes(search.toLowerCase()) || d.period.toLowerCase().includes(search.toLowerCase()));
  const filteredExpenses = expenses.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-tm-blue" /></div>;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Wallet className="w-5 h-5 text-tm-blue" /> Finance & Dues</h2>
          <p className="text-sm text-slate-500">Track member dues, club expenses, and treasury balance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExpenseForm(true)} className="text-xs px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Add Expense
          </button>
          <button onClick={() => setShowDueForm(true)} className="text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Dues Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-lg font-bold text-slate-800"><span className="text-emerald-500">$</span>{totalCollected.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Collected</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-lg font-bold text-slate-800">${totalOutstanding.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1"><CreditCard className="w-3 h-3 text-amber-500" /> Outstanding</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-lg font-bold text-slate-800">${totalExpenses.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-rose-500" /> Expenses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${balance.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1"><DollarSign className={`w-3 h-3 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} /> Balance</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["overview", "dues", "expenses"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-4 py-1.5 rounded-md font-semibold capitalize cursor-pointer transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={`Search ${tab === "expenses" ? "expenses..." : "dues..."}`} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tm-blue/20" />
      </div>

      {tab !== "expenses" && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Dues Records ({filteredDues.length})</h3>
          {filteredDues.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No dues records yet</div>
          ) : (
            <div className="space-y-1.5">
              {filteredDues.map(d => (
                <div key={d._id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-2.5">
                  <button onClick={() => handleTogglePaid(d._id, !d.paid)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${d.paid ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-slate-400'}`}>
                    {d.paid && <span className="text-white text-[8px]">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{d.memberName}</p>
                    <p className="text-[10px] text-slate-400">{d.period} {d.method ? `· ${d.method}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${d.paid ? 'text-emerald-600' : 'text-amber-600'}`}>${d.amount.toFixed(2)}</p>
                    {d.paid && d.paidAt && <p className="text-[9px] text-slate-400">{new Date(d.paidAt).toLocaleDateString()}</p>}
                  </div>
                  <button onClick={() => handleDeleteDue(d._id)} className="text-rose-300 hover:text-rose-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab !== "dues" && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Expenses ({filteredExpenses.length})</h3>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No expenses recorded</div>
          ) : (
            <div className="space-y-1.5">
              {filteredExpenses.map(e => (
                <div key={e._id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-3 h-3 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{e.description}</p>
                    <p className="text-[10px] text-slate-400">{e.category} · {e.paidBy ? `paid by ${e.paidBy}` : ''} · {new Date(e.incurredAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-rose-600">${e.amount.toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleDeleteExpense(e._id)} className="text-rose-300 hover:text-rose-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDueForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowDueForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Add Dues Record</h3>
            <div className="space-y-3">
              <input placeholder="Member name" value={dueForm.memberName} onChange={e => setDueForm({ ...dueForm, memberName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              <input placeholder="Period (e.g. Jul-Dec 2025)" value={dueForm.period} onChange={e => setDueForm({ ...dueForm, period: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Amount ($)</label>
                  <input type="number" min={0} value={dueForm.amount} onChange={e => setDueForm({ ...dueForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Method</label>
                  <select value={dueForm.method} onChange={e => setDueForm({ ...dueForm, method: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={dueForm.paid} onChange={e => setDueForm({ ...dueForm, paid: e.target.checked })} />
                Mark as paid
              </label>
              <textarea placeholder="Notes..." value={dueForm.notes} onChange={e => setDueForm({ ...dueForm, notes: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg h-16 resize-none" />
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowDueForm(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                <button onClick={handleCreateDue} disabled={!dueForm.memberName || !dueForm.period}
                  className="text-xs px-3 py-1.5 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowExpenseForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Add Expense</h3>
            <div className="space-y-3">
              <input placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Amount ($)</label>
                  <input type="number" min={0} value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold">Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={expenseForm.incurredAt} onChange={e => setExpenseForm({ ...expenseForm, incurredAt: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
                <input placeholder="Paid by" value={expenseForm.paidBy} onChange={e => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <textarea placeholder="Notes..." value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg h-16 resize-none" />
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowExpenseForm(false)} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                <button onClick={handleCreateExpense} disabled={!expenseForm.description || !expenseForm.amount}
                  className="text-xs px-3 py-1.5 bg-tm-blue text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50">Add Expense</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
