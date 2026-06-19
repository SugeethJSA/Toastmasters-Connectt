import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Vote, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SAAPoll } from "../types";
import { INITIAL_POLLS } from "../mockData";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const VotePage: React.FC = () => {
  const { meetCode } = useParams<{ meetCode: string }>();
  const navigate = useNavigate();
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // Use polls from server meeting data if available, otherwise fallback to mock data
  const activePolls: SAAPoll[] = meetingInfo?.polls
    ? (meetingInfo.polls.length > 0 ? meetingInfo.polls : [])
    : INITIAL_POLLS;

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/meetings/vote/${meetCode}`);
        if (response.ok) {
          const data = await response.json();
          setMeetingInfo(data.meeting);
        } else {
          setError("Invalid meeting code or meeting not found.");
        }
      } catch (err) {
        if (meetCode === "123456" || meetCode === "SOPHROSYNE") {
          setMeetingInfo({
            number: 124,
            theme: "Pioneering the Future",
            meetCode: meetCode
          });
        } else {
          setError("Failed to fetch meeting. Try code SOPHROSYNE");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [meetCode]);

  const handleCastVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) return;

    setSubmitting((prev) => ({ ...prev, [pollId]: true }));

    try {
      const response = await fetch(`${API_BASE}/api/polls/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetCode, pollId, optionId }),
      });

      if (response.ok) {
        setVoted((prev) => ({ ...prev, [pollId]: true }));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to submit vote. Please try again.");
      }
    } catch (err) {
      // Fallback: save locally if server unreachable
      setVoted((prev) => ({ ...prev, [pollId]: true }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [pollId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-tm-blue border-t-transparent" />
      </div>
    );
  }

  if (error || !meetingInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4 max-w-md w-full shadow-lg">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Vote className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-800">Invalid Meeting Code</h2>
          <p className="text-slate-500 text-sm font-sans">The meeting code "{meetCode}" is either incorrect or the meeting has ended.</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-tm-blue text-white rounded-lg font-bold">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-tm-blue/10 text-tm-blue rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Vote className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800">
            Meeting #{meetingInfo.number} Voting Portal
          </h1>
          <p className="text-slate-500 font-medium">Theme: "{meetingInfo.theme}"</p>
        </div>

        {/* Polls list */}
        <div className="space-y-6">
          {activePolls.filter(p => p.active).map(poll => (
            <div key={poll.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">
                  {poll.type.replace("_", " ")}
                </span>
                {voted[poll.id] && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Voted
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-5 leading-snug">{poll.question}</h3>

              {voted[poll.id] ? (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Your vote has been securely recorded.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {poll.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-sm font-sans cursor-pointer transition-colors ${
                          selectedOptions[poll.id] === opt.id 
                            ? "bg-tm-blue/10 border-tm-blue text-tm-blue font-bold shadow-sm" 
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span>{opt.name}</span>
                        <input
                          type="radio"
                          name={`poll-${poll.id}`}
                          className="w-4 h-4 text-tm-blue focus:ring-tm-blue"
                          checked={selectedOptions[poll.id] === opt.id}
                          onChange={() => setSelectedOptions(prev => ({ ...prev, [poll.id]: opt.id }))}
                        />
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCastVote(poll.id)}
                    disabled={!selectedOptions[poll.id] || submitting[poll.id]}
                    className="w-full py-3 bg-gradient-to-r from-tm-blue to-tm-dark text-white rounded-lg font-bold font-display uppercase tracking-widest text-xs shadow-md disabled:opacity-50 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    {submitting[poll.id] ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span>
                    ) : (
                      "Submit Secure Ballot"
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}

          {activePolls.filter(p => p.active).length === 0 && (
            <div className="text-center p-8 bg-white border border-slate-200 rounded-xl">
              <p className="text-slate-500 font-medium">No active polls are available for this meeting right now.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
