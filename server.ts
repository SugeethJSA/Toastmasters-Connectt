import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import { attachTimerSync } from "./server/timerSync";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = reportAppErrors(express());
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "toastmasters-connect-secret-key-change-in-production";

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Express Error wrapping utilities
function reportAppErrors(expressApp: any) {
  return expressApp;
}

// --- USER AUTHENTICATION MODELS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["member", "officer", "admin", "guest"], default: "member" },
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
  photoUrl: { type: String, default: "" },
  quote: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre("save", function() {
  this.updatedAt = new Date();
});

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// --- MONGODB CONNECTION & SCHEMAS ---
const MONGODB_URI = process.env.MONGODB_URI;
let dbConnected = false;

// Stable in-memory serverside fallback store
let inMemoryMeetingCache: any = null;
let inMemoryUsers: any[] = [];

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
  name: { type: String },
  meetingLink: { type: String },
  toastmasterOfTheDay: { type: String, required: true },
  generalEvaluator: { type: String, required: true },
  tableTopicsMaster: { type: String, required: true },
  timer: { type: String, required: true },
  ahCounter: { type: String, required: true },
  grammarian: { type: String, required: true },
  sergeantAtArms: { type: String, required: true },
  wordOfDay: { type: String, required: true },
  wordOfDayDefinition: { type: String, required: true },
  phraseOfDay: { type: String, required: true },
  phraseOfDayMeaning: { type: String, required: true },
  timeline: [TimelineItemSchema],
  activeTimelineItemId: { type: String },
  liveTimerState: {
    isRunning: { type: Boolean, default: false },
    seconds: { type: Number, default: 0 },
    signal: { type: String, default: "NONE" },
    speaker: { type: String, default: "" },
    role: { type: String, default: "" },
    minSeconds: { type: Number, default: 0 },
    yellowSeconds: { type: Number, default: 0 },
    maxSeconds: { type: Number, default: 0 },
  },
  guestList: [String],
  status: { type: String, default: "IN_PROGRESS" },
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
  meetCode: { type: String, default: "123456" }
}, { timestamps: true });

const MeetingModel = mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);

// --- AUTH MIDDLEWARE ---
interface AuthRequest extends express.Request {
  user?: any;
}

const authenticateToken = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    let user: any = null;

    if (dbConnected) {
      user = await (UserModel as any).findById(decoded.userId).select("-password");
    } else {
      user = inMemoryUsers.find((u: any) => u._id === decoded.userId);
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

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

// Retrieve Active Session (Protected)
app.get("/api/meetings/active", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const activeMeeting = await (MeetingModel as any).findOne({ clubId: req.user.clubId }).sort({ updatedAt: -1 });
      if (activeMeeting) {
        return res.json({ meeting: activeMeeting, source: "mongodb" });
      }
    }
    return res.json({ meeting: inMemoryMeetingCache, source: dbConnected ? "mongodb_empty" : "server_cache" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve meeting state", details: err.message });
  }
});

// Sync Meeting Session (Protected)
app.post("/api/meetings/sync", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const meetingData = req.body;

    if (dbConnected) {
      const synced = await (MeetingModel as any).findOneAndUpdate(
        { id: meetingData.id, clubId: req.user.clubId },
        { ...meetingData, clubId: req.user.clubId },
        { upsert: true, new: true }
      );
      inMemoryMeetingCache = meetingData; // Only update cache after DB succeeds
      return res.json({ success: true, meeting: synced, source: "mongodb" });
    }
    inMemoryMeetingCache = meetingData; // Update cache for fallback mode (no DB)
    return res.json({ success: true, meeting: inMemoryMeetingCache, source: "server_cache" });
  } catch (err: any) {
    console.error("Database sync occurred error code:", err);
    // Don't update cache on error — existing cache stays intact
    res.status(500).json({ error: "Failed to persist meeting layout to MongoDB", details: err.message });
  }
});

// Get all meetings for club (Protected)
app.get("/api/meetings", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const meetings = await (MeetingModel as any).find({ clubId: req.user.clubId }).sort({ updatedAt: -1 });
      return res.json({ meetings, source: "mongodb" });
    }
    return res.json({ meetings: [], source: "server_cache" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve meetings", details: err.message });
  }
});

// Get meeting by ID (Protected)
app.get("/api/meetings/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const meeting = await (MeetingModel as any).findOne({ id: req.params.id, clubId: req.user.clubId });
      if (meeting) {
        return res.json({ meeting, source: "mongodb" });
      }
    }
    res.status(404).json({ error: "Meeting not found" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve meeting", details: err.message });
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

// --- AUTH ROUTES ---
// Register (supports both MongoDB and in-memory fallback)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, photoUrl, quote } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const emailLower = email.toLowerCase();
    let user: any;

    if (dbConnected) {
      const existing = await (UserModel as any).findOne({ email: emailLower });
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = await (UserModel as any).create({
        email: emailLower, password: hashedPassword, name, role: "member", clubId: "sophrosyne-vit-f4-120", photoUrl, quote
      });
    } else {
      const existing = inMemoryUsers.find(u => u.email === emailLower);
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = {
        _id: "mem-" + Date.now(),
        email: emailLower, password: hashedPassword, name, role: "member",
        clubId: "sophrosyne-vit-f4-120", photoUrl, quote, isActive: true, lastLogin: null
      };
      inMemoryUsers.push(user);
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, clubId: user.clubId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// Login (supports both MongoDB and in-memory fallback)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailLower = email.toLowerCase();
    let user: any;

    if (dbConnected) {
      user = await (UserModel as any).findOne({ email: emailLower });
    } else {
      user = inMemoryUsers.find(u => u.email === emailLower);
    }

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    if (dbConnected) {
      user.lastLogin = new Date();
      await user.save();
    } else {
      user.lastLogin = new Date();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, clubId: user.clubId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role, photoUrl: user.photoUrl, quote: user.quote },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  res.json({ success: true });
});

// Get current user
app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Seed default users (for dev / first-time setup)
app.post("/api/auth/seed", async (req, res) => {
  try {
    const defaultUsers = [
      { email: "admin@toastmasters.club", password: "admin123", name: "Club Admin", role: "admin" },
      { email: "sarah@toastmasters.club", password: "member123", name: "Sarah Jenkins", role: "officer" },
      { email: "audrey@toastmasters.club", password: "member123", name: "Audrey Chen", role: "member" },
      { email: "david@toastmasters.club", password: "member123", name: "David Vance", role: "member" },
    ];

    const created: any[] = [];

    for (const u of defaultUsers) {
      if (dbConnected) {
        const existing = await (UserModel as any).findOne({ email: u.email });
        if (!existing) {
          const hashed = await bcrypt.hash(u.password, 10);
          const user = await (UserModel as any).create({ ...u, password: hashed, clubId: "sophrosyne-vit-f4-120" });
          created.push({ email: user.email, name: user.name, role: user.role });
        }
      } else {
        // In-memory fallback - store in a simple array
        if (!inMemoryUsers.some((x: any) => x.email === u.email)) {
          const hashed = await bcrypt.hash(u.password, 10);
          inMemoryUsers.push({ email: u.email, password: hashed, name: u.name, role: u.role, clubId: "sophrosyne-vit-f4-120", photoUrl: "", quote: "", isActive: true });
          created.push({ email: u.email, name: u.name, role: u.role });
        }
      }
    }

    res.json({ message: "Seed complete", usersCreated: created.length, users: created });
  } catch (err: any) {
    res.status(500).json({ error: "Seed failed", details: err.message });
  }
});

// Get all registered users (Protected)
app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const users = await (UserModel as any).find({ clubId: req.user.clubId }).select("-password");
      return res.json({ users });
    }
    const safeUsers = inMemoryUsers.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
    return res.json({ users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
});

// Create user
app.post("/api/users", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const { email, password, name, role, photoUrl, quote } = req.body;
    if (!email || !name) return res.status(400).json({ error: "Email and name are required" });

    const emailLower = email.toLowerCase();
    const userRole = role || "member";
    const userPwd = password || "toastmasters123";

    if (dbConnected) {
      const existing = await (UserModel as any).findOne({ email: emailLower });
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(userPwd, 10);
      const user = await (UserModel as any).create({
        email: emailLower, password: hashedPassword, name, role: userRole, clubId: req.user.clubId, photoUrl, quote
      });
      return res.status(201).json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } else {
      const existing = inMemoryUsers.find(u => u.email === emailLower);
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(userPwd, 10);
      const user = {
        _id: "mem-" + Date.now(),
        email: emailLower, password: hashedPassword, name, role: userRole,
        clubId: req.user.clubId, photoUrl, quote, isActive: true, lastLogin: null
      };
      inMemoryUsers.push(user);
      return res.status(201).json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
});

// Delete user
app.delete("/api/users/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (UserModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    } else {
      inMemoryUsers = inMemoryUsers.filter((u: any) => u._id !== req.params.id);
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
});

// Update user profile (e.g. photo)
app.patch("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { photoUrl } = req.body;
    if (dbConnected) {
      const updated = await (UserModel as any).findByIdAndUpdate(req.params.id, { photoUrl }, { new: true }).select("-password");
      return res.json({ success: true, user: updated });
    } else {
      const u = inMemoryUsers.find((x: any) => x._id === req.params.id);
      if (u) {
        u.photoUrl = photoUrl;
        return res.json({ success: true, user: u });
      }
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
  }
});

// Fetch active polls for public voting by meetCode (Unprotected)
app.get("/api/meetings/vote/:meetCode", async (req, res) => {
  try {
    let meeting: any = null;
    if (dbConnected) {
      meeting = await (MeetingModel as any).findOne({ meetCode: req.params.meetCode });
    } else {
      if (inMemoryMeetingCache && inMemoryMeetingCache.meetCode === req.params.meetCode) {
        meeting = inMemoryMeetingCache;
      }
    }
    
    if (!meeting) return res.status(404).json({ error: "Meeting not found with that code" });
    
    res.json({
      meeting: {
        id: meeting.id,
        number: meeting.number,
        theme: meeting.theme,
        meetCode: meeting.meetCode,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch meeting", details: err.message });
  }
});

// Cast a vote on a poll (Unprotected - public voting)
let inMemoryVotes: Record<string, Record<string, string[]>> = {}; // meetCode -> { pollId: [optionId, ...] }

app.post("/api/polls/vote", async (req, res) => {
  try {
    const { meetCode, pollId, optionId } = req.body;

    if (!meetCode || !pollId || !optionId) {
      return res.status(400).json({ error: "meetCode, pollId, and optionId are required" });
    }

    // Initialize vote store for this meeting/poll
    if (!inMemoryVotes[meetCode]) inMemoryVotes[meetCode] = {};
    if (!inMemoryVotes[meetCode][pollId]) inMemoryVotes[meetCode][pollId] = [];

    // Check if already voted (prevent duplicate)
    // In production, you'd use a fingerprint/IP/cookie. For now, we allow multiple
    // but track count. A real app would use voter tokens.
    inMemoryVotes[meetCode][pollId].push(optionId);

    // Aggregate results
    const optionCounts: Record<string, number> = {};
    inMemoryVotes[meetCode][pollId].forEach((oid: string) => {
      optionCounts[oid] = (optionCounts[oid] || 0) + 1;
    });

    res.json({
      success: true,
      message: "Vote recorded",
      results: optionCounts,
      totalVotes: inMemoryVotes[meetCode][pollId].length,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record vote", details: err.message });
  }
});

// 1. Generate Minutes of Meeting (MOM) Editorial summary using Gemini
app.post("/api/gemini/generate-mom", authenticateToken, async (req: AuthRequest, res) => {
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

Meeting ID/Number: Sophrosyne VIT Area F4 District 120 Meeting #${meetingDetails.number || "124"}
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
app.post("/api/gemini/generate-topics", authenticateToken, async (req: AuthRequest, res) => {
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
app.post("/api/gemini/assist-speech", authenticateToken, async (req: AuthRequest, res) => {
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
  const httpServer = createServer(app);
  attachTimerSync(httpServer);

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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Toastmasters Connect server running on ports/channels over http://localhost:${PORT}`);
  });
};

startServer().catch((e) => {
  console.error("Failed to start server:", e);
});
