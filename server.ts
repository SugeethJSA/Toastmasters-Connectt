import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import { attachTimerSync, broadcastMeetingUpdate, broadcastPollsUpdate } from "./server/timerSync";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = reportAppErrors(express());
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? (() => { console.error("FATAL: JWT_SECRET environment variable is required in production mode."); process.exit(1); })() : "dev-secret-do-not-use-in-production");

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = isProduction
  ? process.env.ALLOWED_ORIGINS?.split(",") || ["https://your-club-domain.com"]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: "Too many votes, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Express Error wrapping utilities
function reportAppErrors(expressApp: any) {
  return expressApp;
}

// --- CLUB MODEL ---
const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  timezone: { type: String, default: "America/New_York" },
  district: { type: String, default: "" },
  area: { type: String, default: "" },
  clubNumber: { type: String, default: "" },
  meetingDay: { type: String, default: "Friday" },
  meetingTime: { type: String, default: "19:00" },
  meetingLink: { type: String, default: "" },
  location: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  description: { type: String, default: "" },
  createdBy: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ClubSchema.pre("save", function() {
  this.updatedAt = new Date();
});

const ClubModel = mongoose.models.Club || mongoose.model("Club", ClubSchema);
let inMemoryClubs: any[] = [];

// --- USER AUTHENTICATION MODELS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["member", "officer", "admin", "guest"], default: "member" },
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
  photoUrl: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  phone: { type: String, default: "" },
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

// --- NOTIFICATION SCHEMA ---
const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ["role_assigned", "meeting_reminder", "member_approved", "mom_published", "vote_alert", "general"], default: "general" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: "" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
let inMemoryNotifications: any[] = [];

// --- PATHWAY SCHEMA ---
const PathwaySchema = new mongoose.Schema({
  clubId: { type: String, required: true },
  memberId: { type: String, required: true },
  memberName: { type: String, default: "" },
  pathwayName: { type: String, required: true },
  level: { type: Number, default: 1 },
  projectsCompleted: { type: Number, default: 0 },
  totalProjects: { type: Number, default: 14 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["active", "completed", "paused"], default: "active" }
}, { timestamps: true });

// Education milestone (DTM, etc.)
const EducationAwardSchema = new mongoose.Schema({
  clubId: { type: String, required: true },
  memberId: { type: String, required: true },
  award: { type: String, required: true },
  dateAwarded: { type: Date, default: Date.now },
  notes: { type: String, default: "" }
}, { timestamps: true });

const PathwayModel = mongoose.models.Pathway || mongoose.model("Pathway", PathwaySchema);
const EducationAwardModel = mongoose.models.EducationAward || mongoose.model("EducationAward", EducationAwardSchema);
let inMemoryPathways: any[] = [];
let inMemoryAwards: any[] = [];

const PATHWAY_LIST = [
  "Dynamic Leadership", "Effective Coaching", "Innovative Planning",
  "Leadership Development", "Motivational Strategies", "Persuasive Influence",
  "Presentation Mastery", "Strategic Relationships", "Team Collaboration",
  "Visionary Communication", "Engaging Humor", "Connect with Storytelling",
  "Connect with Technology", "Deliver with Impact", "Facilitate Difficult Conversations",
  "Navigate Change", "Navigate Leadership", "Prepare to Lead",
  "Spark your Speaking", "Stand-up and Be Heard"
];

// --- FINANCE SCHEMAS ---
const DuesRecordSchema = new mongoose.Schema({
  clubId: { type: String, required: true },
  memberId: { type: String, required: true },
  memberName: { type: String, default: "" },
  period: { type: String, required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null },
  method: { type: String, enum: ["cash", "bank_transfer", "upi", "other"], default: "cash" },
  notes: { type: String, default: "" }
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
  clubId: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: "other" },
  incurredAt: { type: Date, default: Date.now },
  paidBy: { type: String, default: "" },
  notes: { type: String, default: "" }
}, { timestamps: true });

const DuesRecordModel = mongoose.models.DuesRecord || mongoose.model("DuesRecord", DuesRecordSchema);
const ExpenseModel = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
let inMemoryDues: any[] = [];
let inMemoryExpenses: any[] = [];

// --- DCP GOAL SCHEMA ---
const DcpGoalSchema = new mongoose.Schema({
  clubId: { type: String, required: true },
  year: { type: String, default: "2025-2026" },
  number: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, enum: ["education", "membership", "training", "administration"], required: true },
  target: { type: Number, default: 1 },
  current: { type: Number, default: 0 },
  achieved: { type: Boolean, default: false },
  notes: { type: String, default: "" }
}, { timestamps: true });

const DcpGoalModel = mongoose.models.DcpGoal || mongoose.model("DcpGoal", DcpGoalSchema);
let inMemoryDcpGoals: any[] = [];

const DEFAULT_DCP_GOALS = [
  { number: 1, title: "Level 1 Completions", description: "Members who complete Level 1 in any pathway", category: "education", target: 4 },
  { number: 2, title: "Level 2 Completions", description: "Members who complete Level 2 in any pathway", category: "education", target: 2 },
  { number: 3, title: "Level 3 Completions", description: "Members who complete Level 3 in any pathway", category: "education", target: 1 },
  { number: 4, title: "Level 4 Completions", description: "Members who complete Level 4 in any pathway", category: "education", target: 1 },
  { number: 5, title: "Level 5 / DTM Completions", description: "Members who complete Level 5 or earn DTM", category: "education", target: 1 },
  { number: 6, title: "Net Member Growth", description: "Net increase in active membership (new - lost)", category: "membership", target: 5 },
  { number: 7, title: "New Members Added", description: "New members joined during the year", category: "membership", target: 4 },
  { number: 8, title: "Officers Trained", description: "Club officers trained in each training period (cumulative)", category: "training", target: 4 },
  { number: 9, title: "Officer List Submitted", description: "Club officer list submitted on time to World Headquarters", category: "administration", target: 1 },
  { number: 10, title: "Dues Paid On Time", description: "Club membership renewals submitted with dues on time", category: "administration", target: 1 },
];

async function seedDcpGoals(clubId: string, year: string = "2025-2026") {
  if (dbConnected) {
    const existing = await (DcpGoalModel as any).findOne({ clubId, year });
    if (existing) return;
    for (const g of DEFAULT_DCP_GOALS) {
      await (DcpGoalModel as any).create({ ...g, clubId, year, current: 0, achieved: false, notes: "" });
    }
  } else {
    if (inMemoryDcpGoals.some((g: any) => g.clubId === clubId && g.year === year)) return;
    for (const g of DEFAULT_DCP_GOALS) {
      inMemoryDcpGoals.push({ _id: "dcp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 4), ...g, clubId, year, current: 0, achieved: false, notes: "", createdAt: new Date() });
    }
  }
}

// --- GUEST SCHEMA ---
const GuestSchema = new mongoose.Schema({
  clubId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  source: { type: String, default: "" },
  homeClub: { type: String, default: "" },
  visitedMeetings: [{ type: String }],
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now },
  followUpStatus: { type: String, enum: ["pending", "contacted", "joined", "not_interested"], default: "pending" },
  followUpNotes: { type: String, default: "" },
  interests: { type: String, default: "" },
  addedBy: { type: String, default: "" }
}, { timestamps: true });

const GuestModel = mongoose.models.Guest || mongoose.model("Guest", GuestSchema);
let inMemoryGuests: any[] = [];

// Nodemailer SMTP transporter
let transporter: any = null;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "noreply@toastmastersconnect.app";

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// --- INVITE CODE SCHEMA ---
const InviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true },
  usedBy: { type: String, default: null },
  usedAt: { type: Date, default: null },
  maxUses: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const InviteCodeModel = mongoose.models.InviteCode || mongoose.model("InviteCode", InviteCodeSchema);
let inMemoryInviteCodes: any[] = [];

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// --- MONGODB CONNECTION & SCHEMAS ---
const MONGODB_URI = process.env.MONGODB_URI;
let dbConnected = false;

// Stable in-memory serverside fallback store
let inMemoryMeetingCache: any = null;
let inMemoryUsers: any[] = [];
let inMemoryArchiveCache: any[] = [];

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

const TimerLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  speaker: { type: String, required: true },
  role: { type: String, required: true },
  segment: { type: String, required: true },
  timeString: { type: String, required: true },
  seconds: { type: Number, required: true },
  signal: { type: String, default: "NONE" },
  minSeconds: { type: Number, default: 0 },
  maxSeconds: { type: Number, default: 0 },
  timestamp: { type: String }
});

const AhCounterLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  speaker: { type: String, required: true },
  role: { type: String, required: true },
  counts: {
    ah: { type: Number, default: 0 },
    um: { type: Number, default: 0 },
    er: { type: Number, default: 0 },
    well: { type: Number, default: 0 },
    so: { type: Number, default: 0 },
    repeats: { type: Number, default: 0 }
  },
  notes: { type: String }
});

const GrammarianUseSchema = new mongoose.Schema({
  speaker: { type: String, required: true },
  role: { type: String, required: true },
  wodUsedCount: { type: Number, default: 0 },
  podUsedCount: { type: Number, default: 0 },
  elegantWordsLog: [String],
  fillerMistakesLog: [String]
});

const EvaluationItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  evaluator: { type: String, required: true },
  speaker: { type: String, required: true },
  speechTitle: { type: String, required: true },
  projectLevel: { type: String, default: "Level 1: Evaluation and Feedback" },
  scores: {
    clarity: { type: Number, default: 0 },
    vocalVariety: { type: Number, default: 0 },
    eyeContact: { type: Number, default: 0 },
    gestures: { type: Number, default: 0 },
    audienceAwareness: { type: Number, default: 0 },
    comfortLevel: { type: Number, default: 0 },
    subjectMatter: { type: Number, default: 0 }
  },
  positives: { type: String, default: "" },
  improvements: { type: String, default: "" },
  summarizedFeedback: { type: String, default: "" },
  submittedAt: { type: String }
});

const SAAPollOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const SAAPollSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ id: String, name: String, votes: { type: Number, default: 0 } }],
  active: { type: Boolean, default: true },
  type: { type: String, default: "CUSTOM" },
  totalVotes: { type: Number, default: 0 }
});

const AttendanceRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: "member" },
  checkedInAt: { type: String, required: true },
  type: { type: String, default: "member" }
});

const MeetingSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: Number, required: true },
  date: { type: String, required: true },
  theme: { type: String, required: true },
  name: { type: String },
  meetingLink: { type: String },
  toastmasterOfTheDay: { type: String, required: true },
  presidingOfficer: { type: String, default: "" },
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
  meetCode: { type: String, default: "123456" },
  timerLogs: [TimerLogSchema],
  ahLogs: [AhCounterLogSchema],
  grammarianLogs: [GrammarianUseSchema],
  evaluations: [EvaluationItemSchema],
  polls: [SAAPollSchema],
  attendance: [AttendanceRecordSchema],
  geReport: {
    meetingRating: { type: Number, default: 3 },
    overallAssessment: { type: String, default: "" },
    items: [{
      role: { type: String },
      rolePlayer: { type: String },
      rating: { type: Number, default: 3 },
      positiveFeedback: { type: String, default: "" },
      improvementFeedback: { type: String, default: "" }
    }]
  }
}, { timestamps: true });

const MeetingModel = mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);

const SecretaryNoteSchema = new mongoose.Schema({
  timelineItemId: { type: String, required: true },
  note: { type: String, default: "" }
}, { _id: false });

const ArchiveMeetingSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: Number, required: true },
  date: { type: String, required: true },
  theme: { type: String, required: true },
  wordOfDay: { type: String, default: "" },
  phraseOfDay: { type: String, default: "" },
  wordOfDayDefinition: { type: String, default: "" },
  phraseOfDayMeaning: { type: String, default: "" },
  editorialSummary: { type: String, default: "" },
  approved: { type: Boolean, default: false },
  approvedBy: { type: String },
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
  toastmasterOfTheDay: { type: String },
  generalEvaluator: { type: String },
  tableTopicsMaster: { type: String },
  presidingOfficer: { type: String, default: "" },
  timer: { type: String },
  ahCounter: { type: String },
  grammarian: { type: String },
  sergeantAtArms: { type: String },
  timeline: [TimelineItemSchema],
  guestList: [String],
  timerLogs: [TimerLogSchema],
  ahLogs: [AhCounterLogSchema],
  grammarianLogs: [GrammarianUseSchema],
  evaluations: [EvaluationItemSchema],
  polls: [SAAPollSchema],
  attendance: [AttendanceRecordSchema],
  secretaryNotes: [SecretaryNoteSchema],
  geReport: {
    meetingRating: { type: Number, default: 3 },
    overallAssessment: { type: String, default: "" },
    items: [{
      role: { type: String },
      rolePlayer: { type: String },
      rating: { type: Number, default: 3 },
      positiveFeedback: { type: String, default: "" },
      improvementFeedback: { type: String, default: "" }
    }]
  }
}, { timestamps: true });

const ArchiveMeetingModel = mongoose.models.ArchiveMeeting || mongoose.model("ArchiveMeeting", ArchiveMeetingSchema);

// Meeting Template Schema
const MeetingTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  theme: { type: String, default: "" },
  wordOfDay: { type: String, default: "" },
  wordOfDayDefinition: { type: String, default: "" },
  phraseOfDay: { type: String, default: "" },
  phraseOfDayMeaning: { type: String, default: "" },
  timeline: [TimelineItemSchema],
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
  createdBy: { type: String },
}, { timestamps: true });

const MeetingTemplateModel = mongoose.models.MeetingTemplate || mongoose.model("MeetingTemplate", MeetingTemplateSchema);
let inMemoryTemplates: any[] = [];

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

async function resolveUserId(identifier: string): Promise<string | null> {
  const normal = identifier.trim().toLowerCase();
  if (dbConnected) {
    const user = await (UserModel as any).findOne({
      $or: [{ email: normal }, { name: { $regex: new RegExp(`^${normal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }]
    });
    return user ? (user._id.toString?.() || user._id) : null;
  }
  const user = inMemoryUsers.find((u: any) =>
    u.email.toLowerCase() === normal || u.name.toLowerCase() === normal
  );
  return user ? user._id : null;
}

// Sync Meeting Session (Protected)
async function notifyRoleAssignment(oldMeeting: any, newMeeting: any) {
  const oldRolePlayers = oldMeeting?.rolePlayers || oldMeeting?.podium || [];
  const newRolePlayers = newMeeting?.rolePlayers || newMeeting?.podium || [];
  const roles: string[] = ["tmod", "toastmaster", "generalEvaluator", "grammarian", "ahCounter", "timer", "speaker1", "speaker2", "speaker3", "evaluator1", "evaluator2", "evaluator3", "tableTopicsMaster", "presidingOfficer"];

  const oldMap = new Map<string, string>();
  for (const rp of oldRolePlayers) oldMap.set(rp.role || rp.name, rp.player || "");
  for (const key of roles) {
    if (oldMeeting?.[key]) oldMap.set(key, oldMeeting[key]);
  }

  const newMap = new Map<string, string>();
  for (const rp of newRolePlayers) newMap.set(rp.role || rp.name, rp.player || "");
  for (const key of roles) {
    if (newMeeting?.[key]) newMap.set(key, newMeeting[key]);
  }

  for (const [role, player] of newMap.entries()) {
    const oldPlayer = oldMap.get(role) || "";
    if (player && player !== oldPlayer) {
      const userId = await resolveUserId(player);
      if (!userId) continue;
      const meetingName = newMeeting?.title || newMeeting?.name || "Upcoming Meeting";
      await createNotification(
        userId,
        "role_assigned",
        `Role Assigned: ${role}`,
        `You have been assigned as ${role} for ${meetingName}`,
        "/"
      );
    }
  }
}

app.post("/api/meetings/sync", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const meetingData = req.body;

    if (dbConnected) {
      const oldMeeting = await (MeetingModel as any).findOne({ id: meetingData.id, clubId: req.user.clubId });
      const synced = await (MeetingModel as any).findOneAndUpdate(
        { id: meetingData.id, clubId: req.user.clubId },
        { ...meetingData, clubId: req.user.clubId },
        { upsert: true, returnDocument: 'after' }
      );
      await notifyRoleAssignment(oldMeeting, meetingData);
      inMemoryMeetingCache = meetingData;
      broadcastMeetingUpdate(meetingData);
      return res.json({ success: true, meeting: synced, source: "mongodb" });
    }
      const oldInMem = inMemoryMeetingCache;
      inMemoryMeetingCache = meetingData;
      await notifyRoleAssignment(oldInMem, meetingData);
      broadcastMeetingUpdate(inMemoryMeetingCache);
      return res.json({ success: true, meeting: inMemoryMeetingCache, source: "server_cache" });
  } catch (err: any) {
    console.error("Database sync occurred error code:", err);
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

// Archive Meeting Records (Protected)
app.get("/api/meetings/archive", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const archived = await (ArchiveMeetingModel as any).find({ clubId: req.user.clubId }).sort({ number: -1 });
      return res.json({ archived });
    }
    return res.json({ archived: inMemoryArchiveCache });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch archive", details: err.message });
  }
});

app.post("/api/meetings/archive", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const record = { ...req.body, clubId: req.user.clubId };
    if (dbConnected) {
      const existing = await (ArchiveMeetingModel as any).findOne({ id: record.id });
      if (existing) {
        const updated = await (ArchiveMeetingModel as any).findOneAndUpdate(
          { id: record.id }, record, { returnDocument: 'after' }
        );
        return res.json({ success: true, archived: updated });
      }
      const created = await (ArchiveMeetingModel as any).create(record);
      return res.json({ success: true, archived: created });
    }
    const idx = inMemoryArchiveCache.findIndex((m: any) => m.id === record.id);
    if (idx >= 0) {
      inMemoryArchiveCache[idx] = record;
    } else {
      inMemoryArchiveCache.push(record);
    }
    return res.json({ success: true, archived: record });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save archive record", details: err.message });
  }
});

// Meeting Template Endpoints
app.get("/api/templates", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const templates = await (MeetingTemplateModel as any).find({ clubId: req.user.clubId }).sort({ updatedAt: -1 });
      return res.json({ templates });
    }
    return res.json({ templates: inMemoryTemplates });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch templates", details: err.message });
  }
});

app.post("/api/templates", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const template = { ...req.body, clubId: req.user.clubId, createdBy: req.user.name || req.user.email };
    if (dbConnected) {
      const created = await (MeetingTemplateModel as any).create(template);
      return res.json({ success: true, template: created });
    }
    inMemoryTemplates.push(template);
    return res.json({ success: true, template });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save template", details: err.message });
  }
});

app.delete("/api/templates/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (MeetingTemplateModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    inMemoryTemplates = inMemoryTemplates.filter((t: any) => t.id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete template", details: err.message });
  }
});

// Apply a template to the current meeting
app.post("/api/templates/:id/apply", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    let template: any;
    if (dbConnected) {
      template = await (MeetingTemplateModel as any).findById(req.params.id);
    } else {
      template = inMemoryTemplates.find((t: any) => t.id === req.params.id);
    }
    if (!template) return res.status(404).json({ error: "Template not found" });

    // Merge template data into current meeting
    const meeting = dbConnected
      ? await (MeetingModel as any).findOne({ clubId: req.user.clubId }).sort({ updatedAt: -1 })
      : inMemoryMeetingCache;

    if (!meeting) return res.status(404).json({ error: "No active meeting found" });

    const updates: any = {
      timeline: template.timeline,
      theme: template.theme || meeting.theme,
      wordOfDay: template.wordOfDay || meeting.wordOfDay,
      wordOfDayDefinition: template.wordOfDayDefinition || meeting.wordOfDayDefinition,
      phraseOfDay: template.phraseOfDay || meeting.phraseOfDay,
      phraseOfDayMeaning: template.phraseOfDayMeaning || meeting.phraseOfDayMeaning,
    };

    if (dbConnected) {
      const updated = await (MeetingModel as any).findOneAndUpdate(
        { _id: meeting._id }, updates, { returnDocument: 'after' }
      );
      return res.json({ success: true, meeting: updated });
    }
    Object.assign(inMemoryMeetingCache, updates);
    broadcastMeetingUpdate(inMemoryMeetingCache);
    return res.json({ success: true, meeting: inMemoryMeetingCache });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to apply template", details: err.message });
  }
});

// Analytics endpoint: aggregate meeting stats from archive + current meeting
app.get("/api/analytics", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const archive = dbConnected
      ? await (ArchiveMeetingModel as any).find({ clubId: req.user.clubId })
      : inMemoryArchiveCache;
    const current = dbConnected
      ? await (MeetingModel as any).findOne({ clubId: req.user.clubId }).sort({ updatedAt: -1 })
      : inMemoryMeetingCache;

    const totalMeetings = archive.length + (current ? 1 : 0);
    const totalTimerLogs = archive.reduce((sum: number, m: any) => sum + (m.timerLogs?.length || 0), 0) + (current?.timerLogs?.length || 0);
    const totalEvaluations = archive.reduce((sum: number, m: any) => sum + (m.evaluations?.length || 0), 0) + (current?.evaluations?.length || 0);
    const totalAttendance = archive.reduce((sum: number, m: any) => sum + (m.attendance?.length || 0), 0) + (current?.attendance?.length || 0);
    const approvedCount = archive.filter((m: any) => m.approved).length;

    // Attendance trend: last 6 months
    const months = "Jun May Apr Mar Feb Jan Dec Nov Oct Sep Aug Jul".split(" ");
    const attendanceTrend = months.map((month) => ({
      month,
      count: archive.filter((m: any) => {
        const mDate = new Date(m.date);
        return mDate.getMonth() === months.indexOf(month) && mDate.getFullYear() === 2026;
      }).reduce((sum: number, m: any) => sum + (m.attendance?.length || 0), 0),
    }));

    // Recent milestones (from evaluations in archive)
    const milestones = archive
      .flatMap((m: any) =>
        (m.evaluations || []).map((e: any) => ({
          name: e.speaker,
          evaluator: e.evaluator,
          speechTitle: e.speechTitle,
          meetingNumber: m.number,
          date: m.date,
        }))
      )
      .slice(0, 10);

    res.json({
      totalMeetings,
      totalTimerLogs,
      totalEvaluations,
      totalAttendance,
      approvedCount,
      attendanceTrend,
      milestones,
      currentMeeting: current ? {
        number: current.number,
        theme: current.theme,
        date: current.date,
        attendanceCount: current.attendance?.length || 0,
        timerLogCount: current.timerLogs?.length || 0,
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch analytics", details: err.message });
  }
});

// Timer Preset endpoints
let inMemoryTimerPresets: any[] = [
  { id: "preset-prepared", name: "Prepared Speech", minSeconds: 300, yellowSeconds: 360, maxSeconds: 420, segment: "PREPARED_SPEECH" },
  { id: "preset-tt", name: "Table Topics", minSeconds: 60, yellowSeconds: 90, maxSeconds: 120, segment: "TABLE_TOPICS" },
  { id: "preset-eval", name: "Evaluation", minSeconds: 120, yellowSeconds: 150, maxSeconds: 180, segment: "EVALUATION" },
  { id: "preset-icebreaker", name: "Icebreaker (4-6 min)", minSeconds: 240, yellowSeconds: 300, maxSeconds: 360, segment: "PREPARED_SPEECH" },
  { id: "preset-long", name: "Long Speech (8-10 min)", minSeconds: 480, yellowSeconds: 540, maxSeconds: 600, segment: "PREPARED_SPEECH" },
];

const TimerPresetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  minSeconds: { type: Number, required: true },
  yellowSeconds: { type: Number, required: true },
  maxSeconds: { type: Number, required: true },
  segment: { type: String, default: "PREPARED_SPEECH" },
  clubId: { type: String, default: "sophrosyne-vit-f4-120" },
}, { timestamps: true });

const TimerPresetModel = mongoose.models.TimerPreset || mongoose.model("TimerPreset", TimerPresetSchema);

app.get("/api/timer-presets", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const presets = await (TimerPresetModel as any).find({ clubId: req.user.clubId });
      return res.json({ presets });
    }
    return res.json({ presets: inMemoryTimerPresets });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch presets", details: err.message });
  }
});

app.post("/api/timer-presets", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const preset = { ...req.body, clubId: req.user.clubId };
    if (dbConnected) {
      const created = await (TimerPresetModel as any).create(preset);
      return res.json({ success: true, preset: created });
    }
    inMemoryTimerPresets.push(preset);
    return res.json({ success: true, preset });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save preset", details: err.message });
  }
});

app.delete("/api/timer-presets/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (TimerPresetModel as any).findOneAndDelete({ id: req.params.id });
      return res.json({ success: true });
    }
    inMemoryTimerPresets = inMemoryTimerPresets.filter((p: any) => p.id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete preset", details: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    mongodbConnected: dbConnected,
    storageEngine: dbConnected ? "MongoDB Cloud Atlas" : "In-Memory Fallback Server Session"
  });
});

// --- CLUB ENDPOINTS ---

// Get club details
app.get("/api/clubs/:slug", async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    if (dbConnected) {
      const club = await (ClubModel as any).findOne({ slug });
      if (!club) return res.status(404).json({ error: "Club not found" });
      return res.json({ club });
    }
    const club = inMemoryClubs.find((c: any) => c.slug === slug);
    if (!club) return res.status(404).json({ error: "Club not found" });
    return res.json({ club });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch club", details: err.message });
  }
});

// Get current user's club
app.get("/api/club", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    if (dbConnected) {
      let club = await (ClubModel as any).findOne({ slug: clubId });
      if (!club) {
        club = await (ClubModel as any).create({ name: clubId, slug: clubId });
      }
      return res.json({ club });
    }
    let club = inMemoryClubs.find((c: any) => c.slug === clubId);
    if (!club) {
      club = { name: clubId, slug: clubId, timezone: "America/New_York", isActive: true };
      inMemoryClubs.push(club);
    }
    return res.json({ club });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch club", details: err.message });
  }
});

// Update club settings (admin only)
app.patch("/api/club", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const allowed = ["name", "timezone", "district", "area", "clubNumber", "meetingDay", "meetingTime", "meetingLink", "location", "logoUrl", "description"];
    const updates: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const clubId = req.user.clubId;
    if (dbConnected) {
      const club = await (ClubModel as any).findOneAndUpdate(
        { slug: clubId },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (!club) return res.status(404).json({ error: "Club not found" });
      return res.json({ club });
    }
    const idx = inMemoryClubs.findIndex((c: any) => c.slug === clubId);
    if (idx === -1) return res.status(404).json({ error: "Club not found" });
    Object.assign(inMemoryClubs[idx], updates);
    return res.json({ club: inMemoryClubs[idx] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update club", details: err.message });
  }
});

// --- NOTIFICATION ENDPOINTS ---

// Get notifications for current user
app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (dbConnected) {
      const notifications = await (NotificationModel as any).find({ userId }).sort({ createdAt: -1 }).limit(50);
      return res.json({ notifications });
    }
    const userNotifs = inMemoryNotifications
      .filter((n: any) => n.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
    return res.json({ notifications: userNotifs });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch notifications", details: err.message });
  }
});

// Mark notification as read
app.patch("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (NotificationModel as any).findByIdAndUpdate(req.params.id, { read: true });
      return res.json({ success: true });
    }
    const n = inMemoryNotifications.find((n: any) => n._id === req.params.id);
    if (n) n.read = true;
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update notification", details: err.message });
  }
});

// Mark all notifications as read
app.patch("/api/notifications/read-all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (dbConnected) {
      await (NotificationModel as any).updateMany({ userId, read: false }, { read: true });
      return res.json({ success: true });
    }
    inMemoryNotifications.forEach((n: any) => {
      if (n.userId === userId) n.read = true;
    });
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to mark all as read", details: err.message });
  }
});

// Send a test email (admin only)
app.post("/api/notifications/test-email", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ error: "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS env vars." });
    }
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: req.user.email,
      subject: "Toastmasters Connect - Test Email",
      text: "This is a test email from your Toastmasters Connect club management system.",
    });
    res.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// Helper to create a notification (used by other parts of the server)
async function createNotification(userId: string, type: string, title: string, message: string, link: string = "") {
  const notif: any = { userId, type, title, message, link, read: false, createdAt: new Date() };
  if (dbConnected) {
    notif._id = (await (NotificationModel as any).create(notif))._id;
  } else {
    notif._id = "notif-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    inMemoryNotifications.push(notif);
  }
  return notif;
}

// --- PATHWAY ENDPOINTS ---

app.get("/api/pathways", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    if (dbConnected) {
      const pathways = await (PathwayModel as any).find({ clubId }).sort({ memberName: 1 });
      const awards = await (EducationAwardModel as any).find({ clubId }).sort({ dateAwarded: -1 });
      return res.json({ pathways, awards });
    }
    const clubPathways = inMemoryPathways.filter((p: any) => p.clubId === clubId);
    const clubAwards = inMemoryAwards.filter((a: any) => a.clubId === clubId);
    return res.json({ pathways: clubPathways, awards: clubAwards });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch pathways", details: err.message });
  }
});

app.post("/api/pathways", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const data = { ...req.body, clubId: req.user.clubId };
    if (dbConnected) {
      const created = await (PathwayModel as any).create(data);
      return res.status(201).json({ pathway: created });
    }
    const entry = { _id: "pw-" + Date.now(), ...data, createdAt: new Date() };
    inMemoryPathways.push(entry);
    return res.status(201).json({ pathway: entry });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create pathway", details: err.message });
  }
});

app.patch("/api/pathways/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const updated = await (PathwayModel as any).findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: "Pathway not found" });
      return res.json({ pathway: updated });
    }
    const idx = inMemoryPathways.findIndex((p: any) => p._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Pathway not found" });
    Object.assign(inMemoryPathways[idx], req.body);
    return res.json({ pathway: inMemoryPathways[idx] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update pathway", details: err.message });
  }
});

app.delete("/api/pathways/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (PathwayModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    inMemoryPathways = inMemoryPathways.filter((p: any) => p._id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete pathway", details: err.message });
  }
});

app.get("/api/pathways/list", (_req, res) => {
  res.json({ pathways: PATHWAY_LIST });
});

app.get("/api/education-awards", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    if (dbConnected) {
      const awards = await (EducationAwardModel as any).find({ clubId }).sort({ dateAwarded: -1 });
      return res.json({ awards });
    }
    return res.json({ awards: inMemoryAwards.filter((a: any) => a.clubId === clubId) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch awards", details: err.message });
  }
});

app.post("/api/education-awards", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const data = { ...req.body, clubId: req.user.clubId };
    if (dbConnected) {
      const created = await (EducationAwardModel as any).create(data);
      return res.status(201).json({ award: created });
    }
    const entry = { _id: "award-" + Date.now(), ...data, createdAt: new Date() };
    inMemoryAwards.push(entry);
    return res.status(201).json({ award: entry });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create award", details: err.message });
  }
});

app.delete("/api/education-awards/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (EducationAwardModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    inMemoryAwards = inMemoryAwards.filter((a: any) => a._id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete award", details: err.message });
  }
});

// --- FINANCE ENDPOINTS ---

app.get("/api/dues", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    if (dbConnected) {
      const dues = await (DuesRecordModel as any).find({ clubId }).sort({ memberName: 1 });
      return res.json({ dues });
    }
    return res.json({ dues: inMemoryDues.filter((d: any) => d.clubId === clubId) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch dues", details: err.message });
  }
});

app.post("/api/dues", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const data = { ...req.body, clubId: req.user.clubId };
    if (dbConnected) {
      const created = await (DuesRecordModel as any).create(data);
      return res.status(201).json({ due: created });
    }
    const entry = { _id: "due-" + Date.now(), ...data, createdAt: new Date() };
    inMemoryDues.push(entry);
    return res.status(201).json({ due: entry });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create dues record", details: err.message });
  }
});

app.patch("/api/dues/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const updated = await (DuesRecordModel as any).findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: "Dues record not found" });
      return res.json({ due: updated });
    }
    const idx = inMemoryDues.findIndex((d: any) => d._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Dues record not found" });
    Object.assign(inMemoryDues[idx], req.body);
    return res.json({ due: inMemoryDues[idx] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update dues", details: err.message });
  }
});

app.delete("/api/dues/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (DuesRecordModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    inMemoryDues = inMemoryDues.filter((d: any) => d._id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete dues record", details: err.message });
  }
});

app.get("/api/expenses", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    if (dbConnected) {
      const expenses = await (ExpenseModel as any).find({ clubId }).sort({ incurredAt: -1 });
      return res.json({ expenses });
    }
    return res.json({ expenses: inMemoryExpenses.filter((e: any) => e.clubId === clubId) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch expenses", details: err.message });
  }
});

app.post("/api/expenses", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const data = { ...req.body, clubId: req.user.clubId };
    if (dbConnected) {
      const created = await (ExpenseModel as any).create(data);
      return res.status(201).json({ expense: created });
    }
    const entry = { _id: "exp-" + Date.now(), ...data, createdAt: new Date() };
    inMemoryExpenses.push(entry);
    return res.status(201).json({ expense: entry });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create expense", details: err.message });
  }
});

app.delete("/api/expenses/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (ExpenseModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    inMemoryExpenses = inMemoryExpenses.filter((e: any) => e._id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete expense", details: err.message });
  }
});

app.patch("/api/expenses/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const updated = await (ExpenseModel as any).findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: "Expense not found" });
      return res.json({ expense: updated });
    }
    const idx = inMemoryExpenses.findIndex((e: any) => e._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Expense not found" });
    Object.assign(inMemoryExpenses[idx], req.body);
    return res.json({ expense: inMemoryExpenses[idx] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update expense", details: err.message });
  }
});

// --- GUEST ENDPOINTS ---

app.get("/api/guests", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    if (dbConnected) {
      const guests = await (GuestModel as any).find({ clubId }).sort({ lastVisit: -1 });
      return res.json({ guests });
    }
    return res.json({ guests: inMemoryGuests.filter((g: any) => g.clubId === clubId) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch guests", details: err.message });
  }
});

app.post("/api/guests", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = { ...req.body, clubId: req.user.clubId, addedBy: req.user.name || req.user.email };
    if (dbConnected) {
      const created = await (GuestModel as any).create(data);
      return res.status(201).json({ guest: created });
    }
    const entry = { _id: "guest-" + Date.now(), ...data, createdAt: new Date() };
    inMemoryGuests.push(entry);
    return res.status(201).json({ guest: entry });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create guest", details: err.message });
  }
});

app.patch("/api/guests/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const updated = await (GuestModel as any).findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: "Guest not found" });
      return res.json({ guest: updated });
    }
    const idx = inMemoryGuests.findIndex((g: any) => g._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Guest not found" });
    Object.assign(inMemoryGuests[idx], req.body);
    return res.json({ guest: inMemoryGuests[idx] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update guest", details: err.message });
  }
});

app.delete("/api/guests/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      await (GuestModel as any).findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    }
    inMemoryGuests = inMemoryGuests.filter((g: any) => g._id !== req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete guest", details: err.message });
  }
});

// --- DCP ENDPOINTS ---

app.get("/api/dcp/goals", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    const year = (req.query.year as string) || "2025-2026";
    if (dbConnected) {
      const goals = await (DcpGoalModel as any).find({ clubId, year }).sort({ number: 1 });
      return res.json({ goals });
    }
    const goals = inMemoryDcpGoals.filter((g: any) => g.clubId === clubId && g.year === year).sort((a: any, b: any) => a.number - b.number);
    return res.json({ goals });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch DCP goals", details: err.message });
  }
});

app.patch("/api/dcp/goals/:id", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const updated = await (DcpGoalModel as any).findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: "Goal not found" });
      return res.json({ goal: updated });
    }
    const idx = inMemoryDcpGoals.findIndex((g: any) => g._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Goal not found" });
    Object.assign(inMemoryDcpGoals[idx], req.body);
    return res.json({ goal: inMemoryDcpGoals[idx] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update DCP goal", details: err.message });
  }
});

app.post("/api/dcp/goals/reset", authenticateToken, requireRole("admin"), async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    const year = (req.body.year as string) || "2025-2026";
    if (dbConnected) {
      await (DcpGoalModel as any).deleteMany({ clubId, year });
    }
    inMemoryDcpGoals = inMemoryDcpGoals.filter((g: any) => !(g.clubId === clubId && g.year === year));
    await seedDcpGoals(clubId, year);
    const goals = dbConnected
      ? await (DcpGoalModel as any).find({ clubId, year }).sort({ number: 1 })
      : inMemoryDcpGoals.filter((g: any) => g.clubId === clubId && g.year === year).sort((a: any, b: any) => a.number - b.number);
    return res.json({ goals });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reset DCP goals", details: err.message });
  }
});

// --- ROLES HISTORY ENDPOINT ---

app.get("/api/roles/history", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId;
    const meetings: any[] = [];

    if (dbConnected) {
      const current = await (MeetingModel as any).findOne({ clubId }).sort({ updatedAt: -1 });
      if (current) meetings.push(current);
      const archived = await (ArchiveMeetingModel as any).find({ clubId });
      meetings.push(...archived);
    } else {
      if (inMemoryMeetingCache) meetings.push(inMemoryMeetingCache);
      meetings.push(...inMemoryArchiveCache);
    }

    const history: Record<string, Record<string, number>> = {};

    const addRole = (person: string, role: string) => {
      if (!person || !person.trim()) return;
      if (!history[person]) history[person] = { Total: 0 };
      history[person][role] = (history[person][role] || 0) + 1;
      history[person].Total = (history[person].Total || 0) + 1;
    };

    const namedRoles = ["toastmasterOfTheDay", "presidingOfficer", "generalEvaluator", "tableTopicsMaster", "timer", "ahCounter", "grammarian", "sergeantAtArms"];

    for (const m of meetings) {
      for (const role of namedRoles) {
        addRole(m[role], role.replace(/([A-Z])/g, ' $1').trim());
      }
      if (m.timeline) {
        for (const item of m.timeline) {
          if (item.segment === "PREPARED_SPEECH") addRole(item.player, "Speaker");
          else if (item.segment === "EVALUATION") addRole(item.player, "Evaluator");
          else if (item.segment === "TABLE_TOPICS") addRole(item.player, "Table Topics Speaker");
          else addRole(item.player, item.role || "Other");
        }
      }
      if (m.rolePlayers || m.podium) {
        const players = m.rolePlayers || m.podium || [];
        for (const rp of players) {
          addRole(rp.player, rp.role || "Other");
        }
      }
    }

    return res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch roles history", details: err.message });
  }
});

// --- EXPORT ENDPOINT ---

function toCSV(headers: string[], rows: any[], extractors: ((row: any) => string)[]): string {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const headerLine = headers.map(h => esc(h)).join(",");
  const dataLines = rows.map(r => extractors.map(fn => esc(fn(r))).join(","));
  return [headerLine, ...dataLines].join("\n");
}

app.get("/api/export/:entity", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const clubId = req.user.clubId || "";
    const { entity } = req.params;
    let csv = "";

    if (entity === "members") {
      const users = dbConnected ? await (UserModel as any).find({ clubId }).select("-password") : [];
      csv = toCSV(
        ["Name", "Email", "Role", "Phone", "Joined"],
        users,
        [(u: any) => u.name, (u: any) => u.email, (u: any) => u.role, (u: any) => u.phone || "", (u: any) => u.createdAt?.toISOString?.()?.slice(0,10) || ""]
      );
    } else if (entity === "guests") {
      const guests = dbConnected ? await (GuestModel as any).find({ clubId }) : inMemoryGuests.filter((g: any) => g.clubId === clubId);
      csv = toCSV(
        ["Name", "Email", "Phone", "Source", "Home Club", "Status", "First Visit", "Last Visit", "Interests"],
        guests,
        [(g: any) => g.name, (g: any) => g.email, (g: any) => g.phone, (g: any) => g.source, (g: any) => g.homeClub,
         (g: any) => g.followUpStatus, (g: any) => g.firstVisit?.toISOString?.()?.slice(0,10) || g.firstVisit?.slice?.(0,10) || "",
         (g: any) => g.lastVisit?.toISOString?.()?.slice(0,10) || g.lastVisit?.slice?.(0,10) || "", (g: any) => g.interests]
      );
    } else if (entity === "dues") {
      const dues = dbConnected ? await (DuesRecordModel as any).find({ clubId }) : inMemoryDues.filter((d: any) => d.clubId === clubId);
      csv = toCSV(
        ["Member", "Period", "Amount", "Paid", "Paid At", "Method", "Notes"],
        dues,
        [(d: any) => d.memberName, (d: any) => d.period, (d: any) => d.amount?.toString(),
         (d: any) => d.paid ? "Yes" : "No", (d: any) => d.paidAt?.toISOString?.()?.slice(0,10) || d.paidAt?.slice?.(0,10) || "",
         (d: any) => d.method, (d: any) => d.notes]
      );
    } else if (entity === "expenses") {
      const expenses = dbConnected ? await (ExpenseModel as any).find({ clubId }) : inMemoryExpenses.filter((e: any) => e.clubId === clubId);
      csv = toCSV(
        ["Description", "Amount", "Category", "Date", "Paid By", "Notes"],
        expenses,
        [(e: any) => e.description, (e: any) => e.amount?.toString(), (e: any) => e.category,
         (e: any) => e.incurredAt?.toISOString?.()?.slice(0,10) || e.incurredAt?.slice?.(0,10) || "", (e: any) => e.paidBy, (e: any) => e.notes]
      );
    } else if (entity === "pathways") {
      const pathways = dbConnected ? await (PathwayModel as any).find({ clubId }) : inMemoryPathways.filter((p: any) => p.clubId === clubId);
      csv = toCSV(
        ["Member", "Pathway", "Level", "Progress", "Status", "Started"],
        pathways,
        [(p: any) => p.memberName, (p: any) => p.pathwayName, (p: any) => `Level ${p.level}`,
         (p: any) => `${p.projectsCompleted}/${p.totalProjects}`, (p: any) => p.status,
         (p: any) => p.startedAt?.toISOString?.()?.slice(0,10) || p.startedAt?.slice?.(0,10) || ""]
      );
    } else if (entity === "awards") {
      const awards = dbConnected ? await (EducationAwardModel as any).find({ clubId }) : inMemoryAwards.filter((a: any) => a.clubId === clubId);
      csv = toCSV(
        ["Member", "Award", "Date Awarded", "Notes"],
        awards,
        [(a: any) => a.memberId, (a: any) => a.award, (a: any) => a.dateAwarded?.toISOString?.()?.slice(0,10) || a.dateAwarded?.slice?.(0,10) || "", (a: any) => a.notes]
      );
    } else {
      return res.status(400).json({ error: `Unknown entity: ${entity}. Available: members, guests, dues, expenses, pathways, awards` });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${entity}-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: "Export failed", details: err.message });
  }
});

// Photo upload endpoint
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "")),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post("/api/upload/photo", authenticateToken, upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// --- AUTH ROUTES ---
// Register (supports both MongoDB and in-memory fallback)
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { email, password, name, inviteCode, photoUrl, quote } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code is required. Ask a club officer to provide one." });
    }

    const emailLower = email.toLowerCase();

    // Validate invite code
    let validCode = false;
    if (dbConnected) {
      const codeDoc = await (InviteCodeModel as any).findOne({ code: inviteCode, isActive: true });
      if (codeDoc && codeDoc.currentUses < codeDoc.maxUses) {
        validCode = true;
        codeDoc.currentUses += 1;
        codeDoc.usedBy = emailLower;
        codeDoc.usedAt = new Date();
        if (codeDoc.currentUses >= codeDoc.maxUses) {
          codeDoc.isActive = false;
        }
        await codeDoc.save();
      }
    } else {
      const idx = inMemoryInviteCodes.findIndex((c: any) => c.code === inviteCode && c.isActive && c.currentUses < c.maxUses);
      if (idx !== -1) {
        validCode = true;
        inMemoryInviteCodes[idx].currentUses += 1;
        inMemoryInviteCodes[idx].usedBy = emailLower;
        inMemoryInviteCodes[idx].usedAt = new Date();
        if (inMemoryInviteCodes[idx].currentUses >= inMemoryInviteCodes[idx].maxUses) {
          inMemoryInviteCodes[idx].isActive = false;
        }
      }
    }

    if (!validCode) {
      return res.status(400).json({ error: "Invalid or expired invite code. Please contact a club officer." });
    }

    let user: any;

    if (dbConnected) {
      const existing = await (UserModel as any).findOne({ email: emailLower });
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = await (UserModel as any).create({
        email: emailLower, password: hashedPassword, name, role: "member", clubId: "sophrosyne-vit-f4-120",
        photoUrl, quote, isActive: false
      });
    } else {
      const existing = inMemoryUsers.find(u => u.email === emailLower);
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user = {
        _id: "mem-" + Date.now(),
        email: emailLower, password: hashedPassword, name, role: "member",
        clubId: "sophrosyne-vit-f4-120", photoUrl, quote, isActive: false, lastLogin: null
      };
      inMemoryUsers.push(user);
    }

    res.status(201).json({
      success: true,
      pending: true,
      message: "Account created! Your registration is pending approval by a club officer. You'll be able to log in once approved."
    });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// Login (supports both MongoDB and in-memory fallback)
app.post("/api/auth/login", authLimiter, async (req, res) => {
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

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account is pending approval by a club officer. Please check back later.", pending: true });
    }

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
  const user = req.user;
  let clubName = "";
  if (dbConnected) {
    const club = await (ClubModel as any).findOne({ slug: user.clubId }).select("name");
    if (club) clubName = club.name;
  } else {
    const club = inMemoryClubs.find((c: any) => c.slug === user.clubId);
    if (club) clubName = club.name;
  }
  res.json({ user: { ...user.toObject ? user.toObject() : user, clubName } });
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

// --- PROFILE ENDPOINTS ---

app.get("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (dbConnected) {
      const user = await (UserModel as any).findById(userId).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user });
    }
    return res.json({ user: req.user });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch profile", details: err.message });
  }
});

app.patch("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const allowed = ["name", "phone", "avatarUrl", "photoUrl", "quote"];
    const updates: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (dbConnected) {
      const updated = await (UserModel as any).findByIdAndUpdate(userId, updates, { returnDocument: 'after' }).select("-password");
      if (!updated) return res.status(404).json({ error: "User not found" });
      return res.json({ user: updated });
    }
    Object.assign(req.user, updates);
    return res.json({ user: req.user });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
});

app.post("/api/profile/change-password", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const userId = req.user._id || req.user.id;
    if (dbConnected) {
      const user = await (UserModel as any).findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return res.json({ success: true, message: "Password changed successfully" });
    }
    const memUser = inMemoryUsers.find((u: any) => u._id === userId);
    if (!memUser) return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(currentPassword, memUser.password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
    memUser.password = await bcrypt.hash(newPassword, 10);
    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to change password", details: err.message });
  }
});

// --- INVITE CODE ENDPOINTS ---

// Generate invite codes (admin/officer only)
app.post("/api/invite-codes", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const { count, maxUses } = req.body;
    const numCodes = Math.min(Math.max(parseInt(count) || 1, 1), 50);
    const usesPerCode = Math.min(Math.max(parseInt(maxUses) || 1, 1), 100);
    const codes: string[] = [];

    for (let i = 0; i < numCodes; i++) {
      const code = generateInviteCode();
      codes.push(code);

      if (dbConnected) {
        await (InviteCodeModel as any).create({
          code,
          createdBy: req.user.email,
          maxUses: usesPerCode
        });
      } else {
        inMemoryInviteCodes.push({
          code,
          createdBy: req.user.email,
          usedBy: null,
          usedAt: null,
          maxUses: usesPerCode,
          currentUses: 0,
          isActive: true,
          createdAt: new Date()
        });
      }
    }

    res.status(201).json({ codes, count: codes.length, maxUses: usesPerCode });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate codes", details: err.message });
  }
});

// List invite codes (admin/officer only)
app.get("/api/invite-codes", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    if (dbConnected) {
      const codes = await (InviteCodeModel as any).find().sort({ createdAt: -1 }).limit(100);
      return res.json({ codes });
    }
    const sorted = [...inMemoryInviteCodes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
    return res.json({ codes: sorted });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch codes", details: err.message });
  }
});

// Approve or reject a pending user (admin/officer only)
app.patch("/api/users/:id/approval", authenticateToken, requireRole("admin", "officer"), async (req: AuthRequest, res) => {
  try {
    const { approve } = req.body;

    if (dbConnected) {
      const user = await (UserModel as any).findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (approve) {
        user.isActive = true;
        await user.save();
        return res.json({ success: true, message: "User approved", user: { id: user._id, name: user.name, email: user.email, isActive: true } });
      } else {
        await (UserModel as any).findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: "User rejected and removed" });
      }
    } else {
      const idx = inMemoryUsers.findIndex((u: any) => u._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "User not found" });
      if (approve) {
        inMemoryUsers[idx].isActive = true;
        return res.json({ success: true, message: "User approved", user: { id: inMemoryUsers[idx]._id, name: inMemoryUsers[idx].name, email: inMemoryUsers[idx].email, isActive: true } });
      } else {
        inMemoryUsers.splice(idx, 1);
        return res.json({ success: true, message: "User rejected and removed" });
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update user", details: err.message });
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

// Update user profile (e.g. photo, role, active status)
app.patch("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const allowedUpdates: any = {};
    // Any authenticated user can update their own photo/quote
    if (req.body.photoUrl !== undefined) allowedUpdates.photoUrl = req.body.photoUrl;
    if (req.body.quote !== undefined) allowedUpdates.quote = req.body.quote;
    // Only admin/officer can update role and isActive
    if (req.user.role === "admin" || req.user.role === "officer") {
      if (req.body.role !== undefined) allowedUpdates.role = req.body.role;
      if (req.body.isActive !== undefined) allowedUpdates.isActive = req.body.isActive;
      if (req.body.name !== undefined) allowedUpdates.name = req.body.name;
    }
    if (dbConnected) {
      const updated = await (UserModel as any).findByIdAndUpdate(req.params.id, allowedUpdates, { returnDocument: 'after' }).select("-password");
      return res.json({ success: true, user: updated });
    } else {
      const u = inMemoryUsers.find((x: any) => x._id === req.params.id);
      if (u) {
        Object.assign(u, allowedUpdates);
        const { password, ...safe } = u;
        return res.json({ success: true, user: safe });
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
        polls: meeting.polls || []
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch meeting", details: err.message });
  }
});

// Cast a vote on a poll (Unprotected - public voting)
let inMemoryVotes: Record<string, Record<string, string[]>> = {}; // meetCode -> { pollId: [optionId, ...] }

app.post("/api/polls/vote", voteLimiter, async (req, res) => {
  try {
    const { meetCode, pollId, optionId } = req.body;

    if (!meetCode || !pollId || !optionId) {
      return res.status(400).json({ error: "meetCode, pollId, and optionId are required" });
    }

    // Record vote in memory store
    if (!inMemoryVotes[meetCode]) inMemoryVotes[meetCode] = {};
    if (!inMemoryVotes[meetCode][pollId]) inMemoryVotes[meetCode][pollId] = [];
    inMemoryVotes[meetCode][pollId].push(optionId);

    // Update the meeting's polls array in cache so the dashboard sees live results
    const meeting = dbConnected
      ? await (MeetingModel as any).findOne({ meetCode })
      : inMemoryMeetingCache && inMemoryMeetingCache.meetCode === meetCode ? inMemoryMeetingCache : null;

    if (meeting && meeting.polls) {
      const targetPoll = meeting.polls.find((p: any) => p.id === pollId);
      if (targetPoll) {
        const targetOption = targetPoll.options.find((o: any) => o.id === optionId);
        if (targetOption) {
          targetOption.votes = (targetOption.votes || 0) + 1;
        }
        targetPoll.totalVotes = targetPoll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
      }
      if (dbConnected) {
        await (MeetingModel as any).findOneAndUpdate({ meetCode }, { polls: meeting.polls });
      }
      if (meeting) broadcastPollsUpdate(meeting.polls || []);
    }

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

// Get live poll results for a meeting
app.get("/api/polls/results/:meetCode", async (req, res) => {
  try {
    const meeting = dbConnected
      ? await (MeetingModel as any).findOne({ meetCode: req.params.meetCode })
      : inMemoryMeetingCache && inMemoryMeetingCache.meetCode === req.params.meetCode ? inMemoryMeetingCache : null;
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json({ polls: meeting.polls || [] });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch poll results", details: err.message });
  }
});

// Generate Table Topics prompts based on a custom theme
app.post("/api/gemini/generate-topics", authenticateToken, async (req: AuthRequest, res) => {
  const { theme, count = 5 } = req.body;

  const simulatedPrompts = Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    prompt: `If you could explore the theme "${theme}" through a 2-minute impromptu speech, what personal story would you share to illustrate its meaning?`,
    theme
  }));
  return res.json({ prompts: simulatedPrompts, source: "mocked" });
});

// Vite Integration
const startServer = async () => {
  const httpServer = createServer(app);
  attachTimerSync(httpServer);

  // Auto-seed default club
  const defaultClubSlug = "sophrosyne-vit-f4-120";
  const defaultClubName = "Sophrosyne VIT Area F4 District 120";
  if (dbConnected) {
    const existing = await (ClubModel as any).findOne({ slug: defaultClubSlug });
    if (!existing) {
      await (ClubModel as any).create({
        name: defaultClubName,
        slug: defaultClubSlug,
        timezone: "America/New_York",
        district: "120",
        area: "F4",
        meetingDay: "Friday",
        meetingTime: "19:00",
      });
    }
  } else if (!inMemoryClubs.some((c: any) => c.slug === defaultClubSlug)) {
    inMemoryClubs.push({
      name: defaultClubName,
      slug: defaultClubSlug,
      timezone: "America/New_York",
      district: "120",
      area: "F4",
      meetingDay: "Friday",
      meetingTime: "19:00",
      location: "",
      logoUrl: "",
      description: "",
      isActive: true,
    });
  }

  // Auto-seed default users on startup (in-memory fallback)
  if (!dbConnected) {
    const defaultSeeds = [
      { email: "admin@toastmasters.club", password: "admin123", name: "Club Admin", role: "admin" },
      { email: "sarah@toastmasters.club", password: "member123", name: "Sarah Jenkins", role: "officer" },
      { email: "audrey@toastmasters.club", password: "member123", name: "Audrey Chen", role: "member" },
      { email: "david@toastmasters.club", password: "member123", name: "David Vance", role: "member" },
    ];
    for (const u of defaultSeeds) {
      if (!inMemoryUsers.some((x: any) => x.email === u.email)) {
        const hashed = await bcrypt.hash(u.password, 10);
        inMemoryUsers.push({ email: u.email, password: hashed, name: u.name, role: u.role, clubId: defaultClubSlug, photoUrl: "", quote: "", isActive: true });
      }
    }
  }

  // DCP seed
  if (dbConnected) {
    const dcpExists = await (DcpGoalModel as any).findOne({ clubId: defaultClubSlug });
    if (!dcpExists) await seedDcpGoals(defaultClubSlug);
  } else {
    await seedDcpGoals(defaultClubSlug);
  }

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
  httpServer.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use. Another instance of the server is still running.`);
      console.error(`   Run: npx kill-port ${PORT}  (or close the other terminal running npm run dev)\n`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log("HTTP server closed.");
    });
    if (dbConnected) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
