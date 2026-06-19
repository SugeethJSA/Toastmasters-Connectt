import React, { useState } from "react";
import { SAAPoll, Meeting } from "../types";
import { 
  Award, Vote, PieChart, Shield, HelpCircle, BarChart3, Plus, Trash2, 
  Settings, Users, CheckCircle, RefreshCw, Sparkles, Sliders, Loader2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface GovernanceProps {
  meeting: Meeting;
  polls: SAAPoll[];
  onUpdatePolls: (newPolls: SAAPoll[]) => void;
  onApproveCurrentMOM: () => void;
}

export const Governance: React.FC<GovernanceProps> = ({
  meeting,
  polls,
  onUpdatePolls,
  onApproveCurrentMOM
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptionsText, setCustomOptionsText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleCastVote = async (pollId: string) => {
    const chosenOptionId = selectedOptions[pollId];
    if (!chosenOptionId) return;

    // Optimistic local update
    const updated = polls.map((p) => {
      if (p.id === pollId) {
        return {
          ...p,
          totalVotes: p.totalVotes + 1,
          options: p.options.map((opt) => {
            if (opt.id === chosenOptionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          })
        };
      }
      return p;
    });

    onUpdatePolls(updated);
    
    // Sync vote with server
    try {
      await fetch(`${API_BASE}/api/polls/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetCode: meeting.meetCode, pollId, optionId: chosenOptionId }),
      });
    } catch (err) {
      // Local state already updated; server sync is best-effort
    }

    // Clear choice to show voted state feedback
    setSelectedOptions((prev) => {
      const copy = { ...prev };
      delete copy[pollId];
      return copy;
    });
    alert("Your ballistic ballot value has been recorded into SAA audit vault!");
  };

  const handleRefreshPolls = async () => {
    if (!meeting.meetCode) return;
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/polls/results/${meeting.meetCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.polls) onUpdatePolls(data.polls);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setRefreshing(false);
    }
  };



  const handleDeployCustomPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || !customOptionsText.trim()) return;

    const parsedOptions = customOptionsText
      .split(",")
      .map((item, idx) => ({
        id: "cust-opt-" + idx + "-" + Date.now(),
        name: item.trim(),
        votes: 0
      }))
      .filter((opt) => opt.name.length > 0);

    const newPoll: SAAPoll = {
      id: "poll-" + Date.now(),
      question: customQuestion,
      type: "CUSTOM",
      options: parsedOptions,
      active: true,
      totalVotes: 0
    };

    onUpdatePolls([...polls, newPoll]);
    setCustomQuestion("");
    setCustomOptionsText("");
  };

  const handleResetPolls = () => {
    const updated = polls.map((p) => ({
      ...p,
      totalVotes: 0,
      active: true,
      options: p.options.map((o) => ({ ...o, votes: 0 }))
    }));
    onUpdatePolls(updated);
    alert("All ballot boxes have been emptied and recalibrated for standard logging!");
  };

  const handleTogglePollState = (id: string) => {
    const updated = polls.map((p) => {
      if (p.id === id) {
        return { ...p, active: !p.active };
      }
      return p;
    });
    onUpdatePolls(updated);
  };

  const handleDeletePoll = (id: string) => {
    const updated = polls.filter((p) => p.id !== id);
    onUpdatePolls(updated);
  };

  return (
    <div id="saa-governance-hub" className="space-y-6">
      
      {/* SAA Title */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold font-display text-tm-dark">
          Sergeant-At-Arms & Club Governance Hub
        </h2>
        <p className="text-sm text-slate-500 font-sans mt-0.5">
          Deploy anonymous physical voting cards, cast ballots, track audits, approve past Minutes of Meeting and toggle safety metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans text-xs">
        
        {/* Left Columns: Voter Ballot Box */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Vote className="w-5 h-5 text-tm-maroon shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-slate-700 text-sm">Active Assembly Ballot Boxes</h3>
                <p className="text-[10px] text-slate-400 mt-1">Guests and members may submit one ballot token per sector.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {polls.map((poll) => (
                <div key={poll.id} className="border border-slate-200/60 rounded-xl p-4.5 space-y-4 hover:border-slate-400 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center bg-slate-100 px-2 py-1 rounded">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold leading-none">
                        {poll.type === "BEST_SPEAKER" ? "🏆 Best Speaker" :
                         poll.type === "BEST_TABLE_TOPICS" ? "🎤 Best Table Topics" :
                         poll.type === "BEST_EVALUATOR" ? "📋 Best Evaluator" :
                         poll.type === "BEST_ROLE_PLAYER" ? "🎭 Best Role Player" :
                         poll.type === "BEST_TAG_TEAM" ? "🤝 Best Tag Team" :
                         poll.type.replace("_", " ")}
                      </span>
                      {!poll.active && (
                        <span className="text-[9px] text-rose-500 font-mono font-bold uppercase leading-none">Closed</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-800 text-xs mt-3 leading-snug">{poll.question}</h4>
                  </div>

                  {poll.active ? (
                    <div className="space-y-3.5 pt-2 border-t border-slate-100">
                      <div className="space-y-1.5">
                        {poll.options.map((opt) => {
                          const isSelected = selectedOptions[poll.id] === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center justify-between p-2 rounded-lg border text-[11px] font-sans cursor-pointer transition-colors ${
                                isSelected 
                                  ? "bg-tm-blue/10 border-tm-blue text-tm-blue font-semibold scale-[1.01]" 
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span>{opt.name}</span>
                              <input
                                type="radio"
                                name={`radio-${poll.id}`}
                                className="hidden"
                                checked={isSelected}
                                onChange={() => setSelectedOptions((prev) => ({ ...prev, [poll.id]: opt.id }))}
                              />
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleCastVote(poll.id)}
                        disabled={!selectedOptions[poll.id]}
                        className="w-full py-2 bg-gradient-to-r from-[#004165] to-tm-dark text-white rounded font-bold font-display uppercase tracking-widest cursor-pointer text-[10px] shadow disabled:opacity-45"
                      >
                        Cast Electronic Ballistic Vote
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-center text-slate-400 italic font-sans py-4">
                      Voter polls completed. Audit data finalized by Sergeant-at-Arms.
                    </div>
                  )}

                  {/* Immediate Votes summary representation inside the ballot box */}
                  <div className="pt-3 border-t border-slate-100/50 space-y-1 bg-slate-50/50 p-2 rounded-lg">
                    <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Audit Tallies Summary ({poll.totalVotes} total):</p>
                    {poll.options.map((o) => {
                      const pct = poll.totalVotes > 0 ? ((o.votes / poll.totalVotes) * 100).toFixed(0) : "0";
                      return (
                        <div key={o.id} className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{o.name}</span>
                            <span className="font-mono font-bold">{o.votes} ({pct}%)</span>
                          </div>
                          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="bg-tm-maroon h-full rounded" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SAA Authenticated Administration Control Deck */}
        <div className="space-y-6">
          
          {/* Safeguard block */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Shield className="w-5 h-5 text-tm-dark shrink-0" /> Administrative SAA Cockpit
            </h3>

            <div className="space-y-6">
              {/* Authenticated feedback banner */}
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/40 p-3.5 rounded-lg flex items-center gap-2.5 font-sans">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block text-xs uppercase text-emerald-950 font-display">Authenticated SAA Panel</strong>
                  <p className="text-[10px] mt-0.5">Control registers, unlock ballot parameters, reset vote files</p>
                </div>
              </div>

              {/* SAA Control Actions */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-slate-600 font-display uppercase text-[10px] tracking-widest pl-0.5">Quick Actions Parameters</h4>

                <button
                  onClick={handleResetPolls}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  <span>Reset All Voter Ballot Tallies</span>
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={handleRefreshPolls}
                  disabled={refreshing}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  <span>Refresh Poll Results from Server</span>
                  {refreshing ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <RefreshCw className="w-4 h-4 text-slate-400" />}
                </button>

                <button
                  onClick={onApproveCurrentMOM}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer text-left"
                >
                  <div>
                    <span>Seal In-Progress Meeting Record</span>
                    <p className="text-[9px] text-slate-400 font-medium normal-case mt-0.5">Approve and export to Past Archives index.</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Deploy Custom Poll Form */}
              <form onSubmit={handleDeployCustomPoll} className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="font-semibold font-display uppercase text-[10px] tracking-widest text-tm-maroon flex items-center gap-1">
                  <Plus className="w-4 h-4 text-tm-maroon" /> Deploy Custom Topic/Question
                </h4>

                <div className="space-y-3 font-sans">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium text-[10px]">What is the custom ballot query?</label>
                    <input
                      type="text"
                      placeholder="e.g. Rate current meeting theme pacing"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:border-tm-blue bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium text-[10px]">Options (Comma-separated list)</label>
                    <input
                      type="text"
                      placeholder="e.g. Excellent, Standard, Sluggish, Overtime"
                      value={customOptionsText}
                      onChange={(e) => setCustomOptionsText(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:border-tm-blue bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-tm-maroon hover:bg-tm-maroon/90 text-white rounded font-display uppercase tracking-widest text-[9px] cursor-pointer shadow-sm"
                  >
                    Broadcast Custom Voter Poll
                  </button>
                </div>
              </form>

              {/* Delete / Tweak Active boxes */}
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <h4 className="font-semibold text-slate-600 font-display uppercase text-[10px] tracking-widest">Toggle SAA State parameters</h4>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {polls.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-200/50 rounded-lg">
                      <span className="font-semibold text-slate-700 truncate max-w-[130px]">{p.question}</span>
                      
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleTogglePollState(p.id)}
                          className={`p-1 text-[9px] rounded font-mono uppercase font-bold cursor-pointer ${
                            p.active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {p.active ? "Active" : "Closed"}
                        </button>
                        
                        <button
                          onClick={() => handleDeletePoll(p.id)}
                          className="p-1 bg-slate-300 border border-slate-200/50 rounded text-rose-600 hover:bg-slate-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
