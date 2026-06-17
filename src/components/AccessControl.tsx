import React, { useState } from "react";
import { 
  ShieldCheck, ShieldAlert, Users, Settings, Plus, Trash2, 
  ToggleLeft, ToggleRight, CheckCircle2, Award, UserCheck, HelpCircle
} from "lucide-react";

export const AccessControl: React.FC = () => {
  // Mock roster with administrative toggle values
  const [members, setMembers] = useState([
    { id: "mem-1", name: "Sarah Jenkins", role: "VP Education", dtm: true, admin: true, tmod: true, eval: true },
    { id: "mem-2", name: "Marcus Rodriguez", role: "Active Member", dtm: false, admin: false, tmod: true, eval: false },
    { id: "mem-3", name: "David Chen", role: "Treasurer", dtm: false, admin: false, tmod: false, eval: true },
    { id: "mem-4", name: "Helen Ramirez", role: "VP Membership", dtm: true, admin: true, tmod: true, eval: true },
    { id: "mem-5", name: "Audrey Chen", role: "Secretary", dtm: false, admin: false, tmod: true, eval: false },
  ]);

  // Officer Matrix (VP Ed, VP Membership, Secretary, Treasurer) toggles for:
  // "Edit Agenda Structure", "Manage Guest Registry", "Access Financials", "Authorize Meetings"
  const [matrix, setMatrix] = useState({
    agenda_vpe: true,
    agenda_vpm: false,
    agenda_sec: true,
    agenda_trs: false,
    guest_vpe: false,
    guest_vpm: true,
    guest_sec: true,
    guest_trs: false,
    fin_vpe: false,
    fin_vpm: false,
    fin_sec: false,
    fin_trs: true,
    auth_vpe: true,
    auth_vpm: false,
    auth_sec: true,
    auth_trs: false,
  });

  // Custom delegated custom roles list
  const [customRoles, setCustomRoles] = useState([
    { id: "cr-1", title: "Webmaster", desc: "Manages digital presence, meeting recordings, and club website updates.", scopes: ["Access Recordings", "Edit Roster Info"] },
    { id: "cr-2", title: "Mentorship Chair", desc: "Temporary delegation to pair new members with experienced Toastmasters.", scopes: ["View Member Goals", "Send Internal Comms"] },
  ]);

  // States to add new custom role
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newScopeText, setNewScopeText] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);

  // States to re-delegate live controls
  const [selectedController, setSelectedController] = useState("Sarah Jenkins");
  const [selectedTimerController, setSelectedTimerController] = useState("mr");

  const toggleMemberPermission = (memberId: string, type: "admin" | "tmod" | "eval") => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          [type]: !m[type]
        };
      }
      return m;
    }));
  };

  const toggleMatrixValue = (key: keyof typeof matrix) => {
    setMatrix(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const scopes = newScopeText.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newRole = {
      id: "cr-" + Date.now(),
      title: newTitle,
      desc: newDesc,
      scopes: scopes.length > 0 ? scopes : ["General Access"]
    };

    setCustomRoles(prev => [...prev, newRole]);
    setNewTitle("");
    setNewDesc("");
    setNewScopeText("");
    setShowAddRole(false);
    alert(`Custom role "${newRole.title}" created successfully and deployed!`);
  };

  const handleDeleteCustomRole = (id: string) => {
    setCustomRoles(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveChanges = () => {
    alert("Administrative overrides completely saved and synchronized with Cloud Server registers!");
  };

  return (
    <div id="access-control-permissions-logic" className="space-y-6">
      
      {/* Upper header action blocks */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-tm-dark">
            Member Permission Logic & Access Controls
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Configure access controls, delegate cockpit roles for current meetings, and manage officer matrix tables instantly.
          </p>
        </div>

        <div className="flex gap-2 text-xs font-sans">
          <button 
            type="button"
            onClick={() => alert("Discarded current edits.")}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded font-bold font-display"
          >
            Discard
          </button>
          <button 
            type="button"
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-tm-blue hover:opacity-90 text-white font-bold rounded font-display select-none tracking-wider"
          >
            Save Overrides
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans text-xs">
        
        {/* Left Columns (Spans 2): Member Toggles and Matrix Tables */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Member Privileges Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">Roster Access Delegations</h3>
              <p className="text-[10px] text-slate-450 mt-1 italic pl-0.5">Toggle active admin dashboard visibility scopes per physical attendee.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 pb-2">
                    <th className="py-2.5 font-bold uppercase text-[9px] tracking-wider pl-1">Member / Officer</th>
                    <th className="py-2.5 text-center font-bold uppercase text-[9px] tracking-wider">Admin Dashboard</th>
                    <th className="py-2.5 text-center font-bold uppercase text-[9px] tracking-wider">TMOD Master</th>
                    <th className="py-2.5 text-center font-bold uppercase text-[9px] tracking-wider">Evaluations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-1 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#772432]/10 text-tm-maroon font-bold flex items-center justify-center border border-tm-maroon/20">
                          {m.name.charAt(0)}{m.name.split(" ")[1]?.charAt(0) || m.name.charAt(1)}
                        </div>
                        <div>
                          <strong className="text-slate-800 text-xs">{m.name}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                            {m.role} {m.dtm && <span className="bg-tm-yellow/20 text-tm-maroon font-extrabold text-[8px] px-1 rounded">DTM</span>}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleMemberPermission(m.id, "admin")}
                          className={`p-1 rounded cursor-pointer transition-transform ${m.admin ? "text-tm-blue hover:scale-105" : "text-slate-350"}`}
                        >
                          {m.admin ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                        </button>
                      </td>

                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleMemberPermission(m.id, "tmod")}
                          className={`p-1 rounded cursor-pointer transition-transform ${m.tmod ? "text-tm-blue hover:scale-105" : "text-slate-350"}`}
                        >
                          {m.tmod ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                        </button>
                      </td>

                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleMemberPermission(m.id, "eval")}
                          className={`p-1 rounded cursor-pointer transition-transform ${m.eval ? "text-tm-blue hover:scale-105" : "text-slate-350"}`}
                        >
                          {m.eval ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Officer Matrix (Table inside Member Permission Logic HTML mockups) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-tm-maroon" /> Officer Role matrix Permissions
            </h3>

            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2 px-3 font-semibold uppercase text-[9px] tracking-wider">Permission Capability</th>
                    <th className="py-2 px-3 text-center font-semibold uppercase text-[9px] tracking-wider">VP Education</th>
                    <th className="py-2 px-3 text-center font-semibold uppercase text-[9px] tracking-wider">VP Membership</th>
                    <th className="py-2 px-3 text-center font-semibold uppercase text-[9px] tracking-wider">Secretary</th>
                    <th className="py-2 px-3 text-center font-semibold uppercase text-[9px] tracking-wider">Treasurer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  
                  {/* Category 1: Edit Agenda */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-755 font-sans">Edit Agenda Structure</td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.agenda_vpe} 
                        onChange={() => toggleMatrixValue("agenda_vpe")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.agenda_vpm} 
                        onChange={() => toggleMatrixValue("agenda_vpm")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.agenda_sec} 
                        onChange={() => toggleMatrixValue("agenda_sec")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.agenda_trs} 
                        onChange={() => toggleMatrixValue("agenda_trs")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                  </tr>

                  {/* Category 2: Manage Guest logs */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-755">Manage Guest Registry</td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.guest_vpe} 
                        onChange={() => toggleMatrixValue("guest_vpe")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.guest_vpm} 
                        onChange={() => toggleMatrixValue("guest_vpm")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.guest_sec} 
                        onChange={() => toggleMatrixValue("guest_sec")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.guest_trs} 
                        onChange={() => toggleMatrixValue("guest_trs")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                  </tr>

                  {/* Category 3: Access financials */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-755">Access Financials & Club Balance</td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.fin_vpe} 
                        onChange={() => toggleMatrixValue("fin_vpe")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.fin_vpm} 
                        onChange={() => toggleMatrixValue("fin_vpm")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.fin_sec} 
                        onChange={() => toggleMatrixValue("fin_sec")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.fin_trs} 
                        onChange={() => toggleMatrixValue("fin_trs")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                  </tr>

                  {/* Category 4: Authorize meeting */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-755">Authorize Live Sessions</td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.auth_vpe} 
                        onChange={() => toggleMatrixValue("auth_vpe")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.auth_vpm} 
                        onChange={() => toggleMatrixValue("auth_vpm")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.auth_sec} 
                        onChange={() => toggleMatrixValue("auth_sec")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={matrix.auth_trs} 
                        onChange={() => toggleMatrixValue("auth_trs")} 
                        className="rounded border-slate-250 text-tm-maroon focus:ring-tm-maroon cursor-pointer w-4 h-4"
                      />
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Roles Delegations Cards Form and Layout */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pr-1">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Custom Roles & Delegated Functions</h3>
              <button
                onClick={() => setShowAddRole(!showAddRole)}
                className="flex items-center gap-1 font-bold text-tm-maroon hover:underline bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5 text-tm-maroon" /> {showAddRole ? "Cancel Role Form" : "Create Custom Role"}
              </button>
            </div>

            {showAddRole && (
              <form onSubmit={handleCreateCustomRole} className="bg-[#fafbfc] border border-slate-200 p-5 rounded-xl space-y-4 shadow-inner">
                <strong className="text-slate-800 font-display block text-xs">Define New Custom Capability</strong>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold block">Role/Delegate Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., SAA Assistant, Photography Chair"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold block">Permission Scopes (Comma-separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g., Edit Web Content, Read Feedbacks"
                      value={newScopeText}
                      onChange={(e) => setNewScopeText(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Functional Role Description</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="Provide description of member responsibility parameters..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:border-tm-blue"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-tm-maroon hover:opacity-95 text-white font-bold rounded uppercase tracking-wider font-display text-[10px]"
                >
                  Deploy Delegated Role Access
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-sm hover:border-slate-350 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="bg-tm-maroon/10 text-tm-maroon text-[9px] font-bold py-0.5 px-2 rounded tracking-widest uppercase">
                        DELEGATED
                      </span>
                      <button 
                        onClick={() => handleDeleteCustomRole(role.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-display font-semibold text-slate-800 text-xs mt-1.5">{role.title}</h4>
                    <p className="text-slate-500 leading-normal text-[11px] font-sans">{role.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {role.scopes.map((s, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-655 font-semibold text-[9px] px-2 py-0.5 rounded font-sans">
                        • {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Active Meeting Control and Pre-flight description */}
        <div className="space-y-6 text-xs">
          
          {/* Current Meeting State Delegation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Active Session Delegation</h3>
            <p className="text-slate-400 text-[10px] italic">Assign instant control access to administrative live panels.</p>

            <div className="space-y-4 pt-2">
              
              {/* Box 1: Stage controller */}
              <div className="p-3.5 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-tm-blue" />
                  <span className="font-semibold text-slate-700 text-xs">Stage View Controller</span>
                </div>
                <p className="text-[11px] text-slate-500">Responsible for toggling speaker screens and live presentation spotlight.</p>
                
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-sans">
                  <span className="font-bold text-slate-600">{selectedController}</span>
                  <button 
                    onClick={() => {
                      const newN = prompt("Reassign static controller name:", selectedController);
                      if (newN) setSelectedController(newN);
                    }}
                    className="text-tm-blue hover:underline font-bold"
                  >
                    Reassign
                  </button>
                </div>
              </div>

              {/* Box 2: Mast Timer */}
              <div className="p-3.5 border border-slate-200 rounded-xl space-y-2.5">
                <div className="font-semibold text-slate-755 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-tm-maroon" />
                  <span>Master Timer Delegate</span>
                </div>
                <p className="text-slate-500 text-[11px]">Triggers the physical red, yellow, and green traffic lights signals for speakers.</p>
                
                <select
                  value={selectedTimerController}
                  onChange={(e) => setSelectedTimerController(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg outline-none focus:border-tm-blue text-xs"
                >
                  <option value="mr">Marcus Rodriguez</option>
                  <option value="dc">David Chen</option>
                  <option value="sj">Sarah Jenkins</option>
                </select>
              </div>

            </div>
          </div>

          {/* Logic rules check box info */}
          <div className="bg-indigo-50/50 border border-indigo-200/40 rounded-xl p-5 text-indigo-950 leading-relaxed space-y-2.5 font-sans">
            <h4 className="font-display font-semibold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-indigo-800" /> Permission Guidelines Policy
            </h4>
            
            <ul className="space-y-2 font-sans pl-1.5 list-disc text-indigo-900 leading-normal">
              <li><strong>Admin privilege:</strong> Edit meeting numbers, guest roster files, and seal archives.</li>
              <li><strong>TMOD cockpit:</strong> Reorder timeline segments and adjust planned minutes.</li>
              <li><strong>Evaluator:</strong> Access private speech criteria logs and submit pathways evaluations.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
