import React, { useState, useEffect } from "react";
import { Save, Upload, Trash2, Loader2, FileText, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Meeting, TimelineItem } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface MeetingTemplatesProps {
  meeting: Meeting;
  setMeeting: React.Dispatch<React.SetStateAction<Meeting>>;
}

interface Template {
  id: string;
  _id?: string;
  name: string;
  description: string;
  theme: string;
  wordOfDay: string;
  wordOfDayDefinition: string;
  phraseOfDay: string;
  phraseOfDayMeaning: string;
  timeline: TimelineItem[];
}

export const MeetingTemplates: React.FC<MeetingTemplatesProps> = ({ meeting, setMeeting }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  const isOfficer = user?.role === "admin" || user?.role === "officer";

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/templates`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        id: "tmpl-" + Date.now(),
        name: templateName,
        description: templateDesc,
        theme: meeting.theme,
        wordOfDay: meeting.wordOfDay,
        wordOfDayDefinition: meeting.wordOfDayDefinition,
        phraseOfDay: meeting.phraseOfDay,
        phraseOfDayMeaning: meeting.phraseOfDayMeaning,
        timeline: meeting.timeline,
      };
      const res = await fetch(`${API_BASE}/api/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchTemplates();
        setTemplateName("");
        setTemplateDesc("");
      }
    } catch (err) {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (tmpl: Template) => {
    const id = tmpl._id || tmpl.id;
    setApplying(id);
    try {
      const res = await fetch(`${API_BASE}/api/templates/${id}/apply`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.meeting) setMeeting(data.meeting);
      }
    } catch (err) {
      // Silent fail
    } finally {
      setApplying(null);
    }
  };

  const handleDeleteTemplate = async (tmpl: Template) => {
    if (!confirm(`Delete template "${tmpl.name}"?`)) return;
    const id = tmpl._id || tmpl.id;
    try {
      await fetch(`${API_BASE}/api/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetchTemplates();
    } catch (err) {
      // Silent fail
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold font-display text-tm-dark">Meeting Templates</h2>
        <p className="text-sm text-slate-500 font-sans mt-0.5">
          Save recurring agenda layouts and apply them to future meetings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Save Template Form */}
        {isOfficer && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-700 flex items-center gap-1.5">
              <Save className="w-4 h-4 text-tm-maroon" /> Save Current Agenda as Template
            </h3>
            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Regular Weekly Meeting"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-tm-blue"
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="e.g. Standard agenda with 3 speeches"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:border-tm-blue"
                />
              </div>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !templateName.trim()}
                className="w-full py-2 bg-tm-maroon text-white rounded-lg font-display font-bold text-xs tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className={`${isOfficer ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-tm-blue" />
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 font-sans text-sm">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>No templates saved yet. Save your current agenda as a template to reuse it later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tmpl) => {
                const id = tmpl._id || tmpl.id;
                return (
                  <div key={id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-semibold text-slate-800">{tmpl.name}</h4>
                        {tmpl.description && <p className="text-xs text-slate-400 mt-0.5">{tmpl.description}</p>}
                      </div>
                      {isOfficer && (
                        <button
                          onClick={() => handleDeleteTemplate(tmpl)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{tmpl.timeline?.length || 0} agenda items</span>
                      {tmpl.theme && <><span className="text-slate-300">|</span><span>Theme: "{tmpl.theme}"</span></>}
                    </div>

                    {isOfficer && (
                      <button
                        onClick={() => handleApplyTemplate(tmpl)}
                        disabled={applying === id}
                        className="w-full py-2 bg-tm-blue hover:bg-tm-dark text-white rounded-lg font-display font-bold text-[10px] tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {applying === id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Apply to Current Meeting
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};