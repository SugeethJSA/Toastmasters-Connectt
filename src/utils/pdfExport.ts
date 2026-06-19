interface ExportData {
  clubName: string;
  meetingNumber: number;
  date: string;
  theme: string;
  wordOfDay: string;
  phraseOfDay: string;
  toastmasterOfTheDay: string;
  generalEvaluator: string;
  tableTopicsMaster: string;
  timer: string;
  ahCounter: string;
  grammarian: string;
  sergeantAtArms: string;
  editorialSummary?: string;
  approved?: boolean;
  approvedBy?: string;
  attendance?: { name: string; role: string; type: string }[];
  timerLogs?: { speaker: string; role: string; timeString: string; signal: string }[];
  evaluations?: { evaluator: string; speaker: string; speechTitle: string }[];
  guestList?: string[];
}

export function generateMomPDF(data: ExportData) {
  const attendanceCount = data.attendance?.length || 0;
  const memberCount = data.attendance?.filter((a) => a.type === "member").length || 0;
  const guestCount = (data.attendance?.filter((a) => a.type === "guest").length || 0) + (data.guestList?.length || 0);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Minutes of Meeting #${data.meetingNumber}</title>
<style>
  @page { margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #1a1a1a; background: #fff; }
  .header { text-align: center; border-bottom: 3px double #004165; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 18pt; color: #004165; letter-spacing: 2px; margin-bottom: 4px; }
  .header h2 { font-size: 14pt; color: #8b1a1a; font-weight: normal; margin-bottom: 4px; }
  .header .seal { font-size: 10pt; color: #666; margin-top: 12px; font-style: italic; }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 11pt; color: #004165; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  .approved-stamp { text-align: center; margin-top: 30px; padding: 20px; border: 2px solid #004165; display: inline-block; width: 100%; }
  .approved-stamp h3 { color: #004165; font-size: 14pt; letter-spacing: 3px; }
  .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
  .summary { white-space: pre-wrap; font-size: 10pt; line-height: 1.7; padding: 12px; background: #fafafa; border-left: 3px solid #004165; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>TOASTMASTERS INTERNATIONAL</h1>
  <h2>${data.clubName}</h2>
  <p>Meeting #${data.meetingNumber} &mdash; ${data.date}</p>
  <div class="seal">"${data.theme}"</div>
</div>

<div class="section">
  <h3>Meeting Details</h3>
  <table>
    <tr><td><strong>Theme:</strong></td><td>${data.theme}</td></tr>
    <tr><td><strong>Word of the Day:</strong></td><td>${data.wordOfDay}</td></tr>
    <tr><td><strong>Phrase of the Day:</strong></td><td>${data.phraseOfDay}</td></tr>
  </table>
</div>

<div class="section">
  <h3>Officers &amp; Role Holders</h3>
  <table>
    <tr><th>Role</th><th>Assigned To</th></tr>
    <tr><td>Toastmaster of the Day</td><td>${data.toastmasterOfTheDay}</td></tr>
    <tr><td>General Evaluator</td><td>${data.generalEvaluator}</td></tr>
    <tr><td>Table Topics Master</td><td>${data.tableTopicsMaster}</td></tr>
    <tr><td>Timer</td><td>${data.timer}</td></tr>
    <tr><td>Ah-Counter</td><td>${data.ahCounter}</td></tr>
    <tr><td>Grammarian</td><td>${data.grammarian}</td></tr>
    <tr><td>Sergeant-at-Arms</td><td>${data.sergeantAtArms}</td></tr>
  </table>
</div>

${data.attendance && data.attendance.length > 0 ? `
<div class="section">
  <h3>Attendance (${attendanceCount} present)</h3>
  <table>
    <tr><th>Name</th><th>Role</th></tr>
    ${data.attendance.map((a) => `<tr><td>${a.name}</td><td>${a.role === "guest" ? "Guest" : "Member"}</td></tr>`).join("")}
  </table>
</div>` : ""}

${data.guestList && data.guestList.length > 0 ? `
<div class="section">
  <h3>Walk-in Guests</h3>
  <p>${data.guestList.join(", ")}</p>
</div>` : ""}

${data.timerLogs && data.timerLogs.length > 0 ? `
<div class="section">
  <h3>Timer Log</h3>
  <table>
    <tr><th>Speaker</th><th>Role</th><th>Time</th></tr>
    ${data.timerLogs.map((t) => `<tr><td>${t.speaker}</td><td>${t.role}</td><td>${t.timeString}</td></tr>`).join("")}
  </table>
</div>` : ""}

${data.evaluations && data.evaluations.length > 0 ? `
<div class="section">
  <h3>Evaluations</h3>
  <table>
    <tr><th>Evaluator</th><th>Speaker</th><th>Speech Title</th></tr>
    ${data.evaluations.map((e) => `<tr><td>${e.evaluator}</td><td>${e.speaker}</td><td>${e.speechTitle}</td></tr>`).join("")}
  </table>
</div>` : ""}

${data.editorialSummary ? `
<div class="section">
  <h3>Secretary's Summary</h3>
  <div class="summary">${data.editorialSummary}</div>
</div>` : ""}

${data.approved ? `
<div class="approved-stamp">
  <h3>APPROVED</h3>
  <p>Signed: ${data.approvedBy || "President"}</p>
</div>` : `
<div class="approved-stamp" style="border-color: #999;">
  <h3 style="color: #999;">NOT YET APPROVED</h3>
  <p>Awaits executive seal</p>
</div>`}

<div class="footer">
  <p>Generated by Toastmasters Connect &mdash; Sophrosyne VIT Area F4 District 120</p>
  <p>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
</div>

<script>
window.onload = function() { window.print(); };
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
