import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = reportAppErrors(express());
const PORT = 3000;

app.use(express.json());

// Express Error wrapping utilities
function reportAppErrors(expressApp: any) {
  return expressApp;
}

// --- MONGODB CONNECTION & SCHEMAS ---
const MONGODB_URI = process.env.MONGODB_URI;
let dbConnected = false;

// Stable in-memory serverside fallback store
let inMemoryMeetingCache: any = null;

const TimelineItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  time: { type: String, required: true },
  durationMin: { type: Number, required: true },
  role: { type: String, required: true },
  player: { type: String, required: true },
  title: { type: String },
  segment: { type: String, required: true },
  completed: { type: Boolean, default: false },
  photoUrl: { type: String },
  quote: { type: String }
});

const MeetingSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: Number, required: true },
  date: { type: String, required: true },
  theme: { type: String, required: true },
  toastmasterOfTheDay: { type: String, required: true },
  generalEvaluator: { type: String, required: true },
  tableTopicsMaster: { type: String, required: true },
  timer: { type: String, required: true },
  ahCounter: { type: String, required: true },
  grammarian: { type: String, required: true },
  wordOfDay: { type: String, required: true },
  wordOfDayDefinition: { type: String, required: true },
  phraseOfDay: { type: String, required: true },
  phraseOfDayMeaning: { type: String, required: true },
  timeline: [TimelineItemSchema],
  guestList: [String],
  status: { type: String, default: "IN_PROGRESS" }
}, { timestamps: true });

const MeetingModel = mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      dbConnected = true;
      console.log("SUCCESS: Connected to MongoDB Database");
    })
    .catch((err) => {
      console.warn("WARNING: MongoDB Connection Error (Running memory cache):", err.message);
    });
} else {
  console.log("INFO: MONGODB_URI environment parameter not defined. Initializing sandbox in-memory persistence layer.");
}

// Initialize Gemini SDK with User-Agent set according to instructions
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to custom local simulation generator.");
}

// REST APIs

// Retrieve Active Session
app.get("/api/meetings/active", async (req, res) => {
  try {
    if (dbConnected) {
      const activeMeeting = await MeetingModel.findOne().sort({ updatedAt: -1 });
      if (activeMeeting) {
        return res.json({ meeting: activeMeeting, source: "mongodb" });
      }
    }
    return res.json({ meeting: inMemoryMeetingCache, source: dbConnected ? "mongodb_empty" : "server_cache" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve meeting state", details: err.message });
  }
});

// Sync Meeting Session 
app.post("/api/meetings/sync", async (req, res) => {
  try {
    const meetingData = req.body;
    inMemoryMeetingCache = meetingData; // Update active server cache

    if (dbConnected) {
      const synced = await (MeetingModel as any).findOneAndUpdate(
        { id: meetingData.id },
        meetingData,
        { upsert: true, new: true }
      );
      return res.json({ success: true, meeting: synced, source: "mongodb" });
    }
    return res.json({ success: true, meeting: inMemoryMeetingCache, source: "server_cache" });
  } catch (err: any) {
    console.error("Database sync occurred error code:", err);
    res.status(500).json({ error: "Failed to persist meeting layout to MongoDB", details: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    aiEnabled: !!ai,
    mongodbConnected: dbConnected,
    storageEngine: dbConnected ? "MongoDB Cloud Atlas" : "In-Memory Fallback Server Session"
  });
});

// 1. Generate Minutes of Meeting (MOM) Editorial summary using Gemini
app.post("/api/gemini/generate-mom", async (req, res) => {
  const { meetingDetails, timerLogs, ahCounterLogs, grammarianLogs } = req.body;

  if (!ai) {
    // Simulator fallback
    const simulatedMOM = `Official Minutes of Meeting #${meetingDetails.number || 124}
Theme: "${meetingDetails.theme || "Pioneering the Future"}"
Date: ${meetingDetails.date || "June 17, 2026"}

The meeting commenced on time spearheaded by Toastmaster of the Day ${meetingDetails.toastmasterOfTheDay || "Sarah Jenkins"}.
- Word of the Day: "${meetingDetails.wordOfDay || "Metanoia"}" was actively utilized across roles, highlighting our grammatical dedication.
- Prepared Speeches: Handled with exceptional clarity; speakers demonstrated outstanding vocal range and met their critical timing boundaries.
- Table Topics Master ${meetingDetails.tableTopicsMaster || "David Vance"} introduced interactive prompts challenging members to speak on their feet, reinforcing comfort level and impromptu speaking skills.
- Evaluations: Constructive guidance aligned with the Pathways program was delivered, highlighting eye contact and structured vocal variety.
- Overall: Active engagement with a guest attendance of ${meetingDetails.guestList?.length || 3} newcomers, who expressed great interest in official club membership.`;
    return res.json({ text: simulatedMOM, source: "mocked" });
  }

  try {
    const prompt = `
You are an expert Toastmasters secretary and club mentor. Draft a highly professional, inspiring and detailed "Minutes of the Meeting (MOM) Summary" in a narrative editorial style.
Use the following club meeting information:

Meeting ID/Number: Friday Club Meeting #${meetingDetails.number || "124"}
Meeting Date: ${meetingDetails.date}
Theme: "${meetingDetails.theme}"
Word of the Day: "${meetingDetails.wordOfDay}" (Definition: ${meetingDetails.wordOfDayDefinition})
Phrase of the Day: "${meetingDetails.phraseOfDay}" (Meaning: ${meetingDetails.phraseOfDayMeaning})
TMOD (Toastmaster of the Day): ${meetingDetails.toastmasterOfTheDay}
General Evaluator: ${meetingDetails.generalEvaluator}
Table Topics Master: ${meetingDetails.tableTopicsMaster}
Timer: ${meetingDetails.timer}
Ah-Counter: ${meetingDetails.ahCounter}
Grammarian: ${meetingDetails.grammarian}
Guest List: ${meetingDetails.guestList?.join(", ") || "None"}

--- Segments & Performance Logs ---
Timer logs of recorded speeches/evaluations:
${JSON.stringify(timerLogs, null, 2)}

Ah-Counter logs for speakers (filler word tally):
${JSON.stringify(ahCounterLogs, null, 2)}

Grammarian usage notes:
${JSON.stringify(grammarianLogs, null, 2)}

Your output should contain three sections:
1. "Meeting Highlights & Theme Exploration": Discuss the theme in Toastmasters context and note the participation.
2. "Educational Progress Summary": Analyze the timer details and grammar details constructively, illustrating how speakers maintained timing discipline or improved filler counts.
3. "Action Items & Future Milestones": Club business, guest welcomes, and planning the next meeting.

Maintain an encouraging, official, clear, and professional tone suitable for distribution in a Toastmasters Newsletter. Let's make it concise yet detailed within 400 words.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text, source: "gemini" });
  } catch (err: any) {
    console.error("Gemini MOM generation failed:", err);
    res.status(500).json({ error: "Failed to generate AI summary", details: err.message });
  }
});

// 2. Generate Table Topics prompts using Gemini based on a custom theme
app.post("/api/gemini/generate-topics", async (req, res) => {
  const { theme, count = 5 } = req.body;

  if (!ai) {
    // Simulator fallback
    const simulatedPrompts = [
      { id: "1", prompt: `If you could travel back to the exact day this club was founded, what advice would you give your past self regarding public speaking?`, theme },
      { id: "2", prompt: `The theme is "${theme}". How can you apply the concept of "${theme}" to overcome your biggest fear today?`, theme },
      { id: "3", prompt: `Some think "${theme}" is an illusion. Do you lean towards logic or imagination when evaluating paths of change?`, theme },
      { id: "4", prompt: `Share a story about an unexpected adventure that perfectly captured "${theme}".`, theme },
      { id: "5", prompt: `If you were Toastmaster President for one month, how would "${theme}" shape your club leadership agenda?`, theme }
    ];
    return res.json({ prompts: simulatedPrompts, source: "mocked" });
  }

  try {
    const prompt = `
You are a Toastmasters Table Topics Master. Provide a JSON array containing exactly ${count} highly creative, deeply thought-provoking, and diverse Table Topics prompts related to the meeting theme: "${theme}".
Each prompt should encourage an impromptu speech of 1 to 2 minutes, following Toastmasters public speaking education values.

Your response MUST be a valid JSON array matching this format:
[
  { "id": "t1", "prompt": "Prompt text...", "theme": "${theme}" },
  { "id": "t2", "prompt": "Prompt text...", "theme": "${theme}" }
]
Ensure the response is STRICTLY fine valid JSON without markdown wrapping if possible, or using responseMimeType "application/json".
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    try {
      const data = JSON.parse(response.text || "[]");
      res.json({ prompts: data, source: "gemini" });
    } catch (parseErr) {
      // Fallback if formatting was slightly off
      res.json({ text: response.text, source: "gemini_raw" });
    }
  } catch (err: any) {
    console.error("Gemini table topics generation failed:", err);
    res.status(500).json({ error: "Failed to generate Table Topics prompts", details: err.message });
  }
});

// 3. AI Assist to write speech scripts or pathways evaluator help
app.post("/api/gemini/assist-speech", async (req, res) => {
  const { contentType, title, draftText, targetRole } = req.body;

  if (!ai) {
    // Simulator fallback
    const simulatedResponse = `AI Assist Draft for ${targetRole || "Speaker"}:
---
Here is an elegant structure for your 1-minute speech on "${title || "Universal Values"}":

1. **The Hook (0-15s)**: Grab attention immediately. "Do you remember the first time someone active in leadership truly listened to your aspirations?"
2. **The Body (15-45s)**: Share your personal story in alignment with the draft details: "${draftText || "Focus on building mentorship and dynamic teams"}". Try to incorporate a single powerful metaphor.
3. **The Call to Action (45-60s)**: Issue a clear invitation. "Let us take metanoia not just as a word, but as our club's compass."
`;
    return res.json({ text: simulatedResponse, source: "mocked" });
  }

  try {
    const prompt = `
You are an expert public speaking coach and Toastmasters mentor. Assist the user in writing or refining a segment of their speech/evaluation.

Content Type requested: ${contentType || "Speech outline"}
Speech / Project Title: "${title || "Untitled Response"}"
Draft / Bullet points of user's idea: "${draftText || "Impromptu speech structure"}"
Target Role / Segment: ${targetRole || "Table Topics Speaker"}

Provide a highly targeted, structured, and polished draft. It should include:
- A brief narrative script recommendation that incorporates the user's idea.
- Practical delivery advice (e.g., vocal variety suggestions, body gestures, pauses).
- Highlighting how to incorporate the Word/Phrase of the day elegantly.

Keep it strictly aligned with standard Toastmasters educational guidelines, encouraging, modern, and readable within 250 words.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text, source: "gemini" });
  } catch (err: any) {
    console.error("Gemini AI Speech Assist failed:", err);
    res.status(500).json({ error: "Failed to provide AI Speech Assist", details: err.message });
  }
});

// Vite Integration
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Mode Middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware");
  } else {
    // Serve Static Build Files in Production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Toastmasters Connect server running on ports/channels over http://localhost:${PORT}`);
  });
};

startServer().catch((e) => {
  console.error("Failed to start server:", e);
});
