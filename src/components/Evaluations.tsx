import React, { useState } from "react";
import { EvaluationItem, Meeting } from "../types";
import { Plus, Star, Award, CheckCircle2, FileText, BarChart3, HelpCircle, CornerDownRight, Download, Trash2 } from "lucide-react";

interface EvaluationsProps {
  meeting: Meeting;
  currentUser: { name: string; role: string } | null;
  evaluations: EvaluationItem[];
  onAddEvaluation: (item: EvaluationItem) => void;
  onUpdateEvaluations?: (evals: EvaluationItem[]) => void;
}

export const Evaluations: React.FC<EvaluationsProps> = ({
  evaluations,
  onAddEvaluation,
  onUpdateEvaluations,
  meeting,
  currentUser,
}) => {
  // Derive default speaker from timeline
  const timelineSpeakers = meeting.timeline.filter(item => item.segment === "PREPARED_SPEECH").map(item => item.player).filter(Boolean);
  const defaultSpeaker = timelineSpeakers[0] || "Audrey Chen";
  const defaultSpeechTitle = meeting.title || "The Art of Slowing Down";

  // Local form state
  const [evaluator, setEvaluator] = useState(currentUser?.name || "Helen Ramirez");
  const [speaker, setSpeaker] = useState(defaultSpeaker);
  const [speechTitle, setSpeechTitle] = useState(defaultSpeechTitle);
  const [projectLevel, setProjectLevel] = useState("Level 1: Evaluation and Feedback");
  
  // Custom 1-5 competency ratings
  const [dynamicCompetencies, setDynamicCompetencies] = useState([
    { id: "c1", label: "Clarity & articulation", val: 4 },
    { id: "c2", label: "Vocal variety & pauses", val: 3 },
    { id: "c3", label: "Direct eye contact", val: 5 },
    { id: "c4", label: "Body language & gestures", val: 4 },
    { id: "c5", label: "Audience awareness", val: 4 },
    { id: "c6", label: "Comfort level & pacing", val: 4 },
    { id: "c7", label: "Subject matter understanding", val: 5 },
  ]);

  const [positives, setPositives] = useState("");
  const [improvements, setImprovements] = useState("");
  const [summarizedFeedback, setSummarizedFeedback] = useState("");

  // Filter evaluations to only show relevant ones
  const visibleEvaluations = evaluations.filter(ev => 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'officer' || 
    ev.speaker === currentUser?.name || 
    ev.evaluator === currentUser?.name ||
    meeting.generalEvaluator === currentUser?.name
  );

  const handleAddMetric = () => {
    const name = prompt("Enter new evaluation metric name (e.g., 'Use of Props'):");
    if (name?.trim()) {
      setDynamicCompetencies([...dynamicCompetencies, { id: `custom_${Date.now()}`, label: name.trim(), val: 3 }]);
    }
  };

  const handleRemoveMetric = (id: string) => {
    setDynamicCompetencies(dynamicCompetencies.filter(c => c.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positives.trim() || !summarizedFeedback.trim()) return;

    const scoresObj: any = {};
    dynamicCompetencies.forEach(c => {
      scoresObj[c.label] = c.val;
    });

    const newEval: EvaluationItem = {
      id: "eval-" + Date.now(),
      evaluator,
      speaker,
      speechTitle,
      projectLevel,
      scores: scoresObj,
      positives,
      improvements,
      summarizedFeedback,
      submittedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddEvaluation(newEval);
    
    // Clear textual feedbacks
    setPositives("");
    setImprovements("");
    setSummarizedFeedback("");
  };

  const downloadReport = (item: EvaluationItem) => {
    const content = `TOASTMASTERS EVALUATION REPORT\n=================================\nSpeaker: ${item.speaker}\nEvaluator: ${item.evaluator}\nSpeech Title: ${item.speechTitle}\nProject Level: ${item.projectLevel}\nDate: ${item.submittedAt || new Date().toLocaleDateString()}\n\n--- SCORES (Out of 5) ---\n${Object.entries(item.scores).map(([k, v]) => `${k}: ${v}/5`).join('\n')}\n\n--- QUALITATIVE FEEDBACK ---\nEXCELLED:\n${item.positives}\n\nWORK ON:\n${item.improvements}\n\nCHALLENGE:\n${item.summarizedFeedback}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Evaluation_${item.speaker.replace(/\\s+/g, "_")}.txt`;
    a.click();
  };

  // Core Competencies Ratings Matrix
  const templates = [
    {
      id: "tmpl-icebreaker",
      title: "Standard Icebreaker",
      desc: "Focuses on delivery basics and reducing anxiety. Simplified 3-point scoring.",
      projectLevel: "Level 1: Evaluation and Feedback",
      speechTitle: "My Icebreaker Journey",
      scores: { clarity: 4, vocalVariety: 3, eyeContact: 5, gestures: 3, audienceAwareness: 4, comfortLevel: 3, subjectMatter: 5 },
      positives: "Great baseline confidence and opening hook that immediately settled the room. Outstanding eye contact throughout the introduction.",
      improvements: "Try speaking completely without index cards to showcase high comfort levels.",
      challenge: "Venture to double your speech length in Table Topics next time."
    },
    {
      id: "tmpl-persuade",
      title: "Persuasive Speaking",
      desc: "Detailed rubric for rhetorical devices, emotional appeal, and call to action.",
      projectLevel: "Level 3: Inspiring Your Audience",
      speechTitle: "The Future of Public Discourse",
      scores: { clarity: 5, vocalVariety: 5, eyeContact: 4, gestures: 5, audienceAwareness: 5, comfortLevel: 4, subjectMatter: 5 },
      positives: "Brilliant use of anaphora and rhetorical pacing. Strong call to action in the closing 30 seconds that rallied the entire room.",
      improvements: "Utilize the full stage width during transitions to reinforce key arguments.",
      challenge: "Deliver a prepared speech with zero physical barriers or lecterns next time."
    },
    {
      id: "tmpl-research",
      title: "Researching & Presenting",
      desc: "Emphasis on source citation, logical flow, and handling Q&A sessions.",
      projectLevel: "Level 2: Understanding Communication Style",
      speechTitle: "Unearthing Global Communication Dynamics",
      scores: { clarity: 5, vocalVariety: 4, eyeContact: 4, gestures: 4, audienceAwareness: 4, comfortLevel: 4, subjectMatter: 5 },
      positives: "Exceptional visual aid transitions. Handled all audience Q&A queries after the timer signal with absolute professional composure.",
      improvements: "Incorporate primary oral citations in your next introduction slide.",
      challenge: "Take an immediate opposing stance during Table Topics to practice dynamic counter-speech research."
    }
  ];

  const applyTemplate = (t: typeof templates[0]) => {
    setSpeechTitle(t.speechTitle);
    setProjectLevel(t.projectLevel);
    
    setDynamicCompetencies([
      { id: "c1", label: "Clarity & articulation", val: t.scores.clarity },
      { id: "c2", label: "Vocal variety & pauses", val: t.scores.vocalVariety },
      { id: "c3", label: "Direct eye contact", val: t.scores.eyeContact },
      { id: "c4", label: "Body language & gestures", val: t.scores.gestures },
      { id: "c5", label: "Audience awareness", val: t.scores.audienceAwareness },
      { id: "c6", label: "Comfort level & pacing", val: t.scores.comfortLevel },
      { id: "c7", label: "Subject matter understanding", val: t.scores.subjectMatter },
    ]);

    setPositives(t.positives);
    setImprovements(t.improvements);
    setSummarizedFeedback(t.challenge);
    alert(`Successfully applied "${t.title}" evaluation template parameters into peer scorecard below!`);
  };

  return (
    <div id="pathways-evaluations-system" className="space-y-6">
      
      {/* Header and Brand */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold font-display text-tm-dark">
          Pathways Competency-Based Evaluations
        </h2>
        <p className="text-sm text-slate-500 font-sans mt-0.5 font-light">
          Submit Pathways-aligned peer evaluations. Quantitative scorecards integrate instantly into interactive bento visualizations illustrating speaker metrics.
        </p>
      </div>

      {/* Pathways Template Library - Bento Style Horizontal Flow */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5 pl-1">
          <FileText className="w-4 h-4 text-tm-maroon shrink-0" /> Browse Pathways Evaluation Template Library
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div 
              key={tmpl.id} 
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-tm-blue/50 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-start">
                  <span className="bg-tm-blue/10 text-tm-blue font-bold text-[8px] font-mono px-2 py-0.5 rounded tracking-widest uppercase">
                    Level {tmpl.projectLevel.match(/\d/)?.[0] || "1"} Project
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">
                    Scorecard: 1-5
                  </span>
                </div>
                <h4 className="font-display font-bold text-slate-800 text-xs mt-1 leading-snug">{tmpl.title}</h4>
                <p className="text-slate-500 leading-normal text-[11px] font-sans">{tmpl.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                <span className="text-[10px] text-slate-400">Target: Prepared Speeches</span>
                <button
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="px-3 py-1.5 bg-tm-maroon hover:opacity-90 text-white font-bold font-display rounded-md text-[10px] uppercase tracking-wide cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  Apply Rubric
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Col Span 2): Evaluation Form */}
        <div className="xl:col-span-2 space-y-6">
          <form onSubmit={handleFormSubmit} className="bg-white rounded-xl border border-slate-100 p-6 space-y-6 shadow-sm text-xs font-sans">
            
            {/* Header info bar */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-tm-maroon shrink-0" />
              <h3 className="font-display font-semibold text-slate-700 text-sm">Pathways Speech Evaluation Form</h3>
            </div>

            {/* Core Info Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold font-sans">Evaluator (Peer Assessor)</label>
                <input
                  type="text"
                  value={evaluator}
                  onChange={(e) => setEvaluator(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-tm-blue bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold">Select Scheduled Speaker</label>
                <select
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-tm-blue bg-white"
                  required
                >
                  {timelineSpeakers.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  {!timelineSpeakers.includes(speaker) && <option value={speaker}>{speaker}</option>}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold">Speech Title / Presentation Topic</label>
                <input
                  type="text"
                  value={speechTitle}
                  onChange={(e) => setSpeechTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-tm-blue bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-semibold">Pathways Curriculum Project Level</label>
                <select
                  value={projectLevel}
                  onChange={(e) => setProjectLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-tm-blue bg-white"
                >
                  <option value="Level 1: Evaluation and Feedback">Level 1: Evaluation and Feedback</option>
                  <option value="Level 2: Understanding Communication Style">Level 2: Understanding Communication Style</option>
                  <option value="Level 3: Inspiring Your Audience">Level 3: Inspiring Your Audience</option>
                  <option value="Level 4: Managing Projects Successfully">Level 4: Managing Projects Successfully</option>
                  <option value="Level 5: High Performance Leadership">Level 5: High Performance Leadership</option>
                </select>
              </div>
            </div>

            {/* Core Competencies Ratings Matrix */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800 font-display flex items-center gap-1">
                  <Award className="w-4 h-4 text-tm-maroon" /> Dynamic Core Speech Competencies
                </h4>
                <button type="button" onClick={handleAddMetric} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase tracking-wider border border-slate-200 cursor-pointer flex items-center gap-1"><Plus className="w-3 h-3"/> Add Metric</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicCompetencies.map((comp, idx) => (
                  <div key={comp.id} className="flex justify-between items-center p-3 bg-slate-50/70 border border-slate-200/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleRemoveMetric(comp.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer" title="Remove metric"><Trash2 className="w-3.5 h-3.5"/></button>
                      <span className="font-semibold text-slate-600 font-sans">{comp.label}</span>
                    </div>
                    
                    {/* Star selection */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => {
                            const newComps = [...dynamicCompetencies];
                            newComps[idx].val = starValue;
                            setDynamicCompetencies(newComps);
                          }}
                          className={`p-1 hover:scale-115 transition-transform cursor-pointer ${
                            starValue <= comp.val ? "text-amber-400" : "text-slate-300"
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Narrative Feedbacks */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 font-display">Qualitative Evaluation Feedback</h4>
              
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-emerald-800 font-semibold tracking-wider uppercase text-[10px] block">
                    Excelled (What did physical speech excel in? Outline strengths)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Exceptional pacing, eye contact with left partition, excellent hook..."
                    value={positives}
                    onChange={(e) => setPositives(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-emerald-500 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-tm-maroon font-semibold tracking-wider uppercase text-[10px] block">
                    Work on (Areas of potential improvement to reach the next level)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Integrate dynamic vocal changes during transition slides..."
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-tm-maroon bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold tracking-wider uppercase text-[10px] block">
                    Challenge (A stretch challenge specifically aligned with this project level)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Speak completely without flash notes next time to demonstrate total audience awareness..."
                    value={summarizedFeedback}
                    onChange={(e) => setSummarizedFeedback(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-tm-blue bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Trigger */}
            <button
              type="submit"
              className="w-full py-3 bg-tm-blue hover:bg-tm-dark text-white font-semibold font-display tracking-widest text-xs uppercase rounded-lg shadow transition-colors cursor-pointer"
            >
              Commit Peer Assessment to Pathways Record
            </button>
          </form>
        </div>

        {/* Right Bento Column: Stats, Competency Charts */}
        <div className="space-y-6">
          
          {/* visual SVG grid of competency averages */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4.5 h-4.5 text-tm-maroon" /> Active Assembly Scorecards
              </h3>
              <p className="text-[10px] text-slate-400 font-sans italic mt-0.5">Aggregate scores of submitted evaluated speaker metrics.</p>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 font-sans text-xs">
              {visibleEvaluations.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">No evaluations completed yet. Be the first!</p>
              ) : (
                visibleEvaluations.map((item) => {
                  // Calculate average
                  const scoresArray = Object.values(item.scores) as number[];
                  const average = (scoresArray.reduce((acc: number, val: number) => acc + val, 0) / scoresArray.length).toFixed(1);
                  return (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3.5 hover:border-slate-400 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-800 block text-xs">{item.speaker}</strong>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">{item.projectLevel}</span>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <button onClick={() => downloadReport(item)} className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-tm-blue hover:text-white transition-colors cursor-pointer" title="Download Report"><Download className="w-3 h-3"/></button>
                          <span className="bg-tm-maroon text-white font-bold font-mono px-2 py-0.5 text-[10px] rounded">
                            Avg: {average}/5.0
                          </span>
                        </div>
                      </div>

                      {/* Small inline visual bar chart using raw SVG/div */}
                      <div className="space-y-2 pt-2 border-t border-slate-300/50">
                        {(Object.entries(item.scores) as [string, number][]).map(([key, value]) => (
                          <div key={key} className="space-y-0.5 font-sans">
                            <div className="flex justify-between text-[10px] text-slate-500 font-medium capitalize">
                              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-mono">{value}/5</span>
                            </div>
                            <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${(value / 5) * 100}%` }}
                                className="bg-tm-blue rounded-full h-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200/50 text-[11px] leading-relaxed text-slate-600 italic">
                        <p className="line-clamp-2"><span className="font-semibold text-emerald-800 not-italic">Excelled:</span> "{item.positives}"</p>
                        <p className="line-clamp-2"><span className="font-semibold text-tm-maroon not-italic">Improvements:</span> "{item.improvements}"</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Guidelines notes */}
          <div className="bg-indigo-50 border border-indigo-200/35 rounded-xl p-5 text-xs text-indigo-950 leading-relaxed space-y-2.5">
            <h4 className="font-display font-semibold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-indigo-600 text-indigo-600" /> Pathways Evaluation Ethos
            </h4>
            <p className="font-sans">Standard peer reviews should motivate, preserve speaker confidence, provide concrete recommendations for growth, and be delivered within the required 3:30 minute boundary parameters.</p>
            <div className="flex items-center gap-1 text-[11px] text-indigo-800 font-semibold pt-1">
              <CornerDownRight className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>Reference pathways matrix level checklists</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
