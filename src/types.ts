export enum MeetingSegment {
  PREPARED_SPEECH = "PREPARED_SPEECH",
  TABLE_TOPICS = "TABLE_TOPICS",
  EVALUATION = "EVALUATION",
  BUSINESS = "BUSINESS"
}

export interface TimelineItem {
  id: string;
  time: string; // e.g., "19:05"
  durationMin: number; // in minutes
  role: string; // e.g., "Toastmaster of the Day", "Speaker 1"
  player: string; // Name of person
  title?: string; // Optional speech title
  segment: MeetingSegment;
  completed: boolean;
  photoUrl?: string; // photo path or URL
  quote?: string; // optional speaker introduction quote or motto
}

export interface Meeting {
  id: string;
  number: number;
  date: string;
  theme: string;
  name?: string;
  meetingLink?: string;
  wordOfDay: string;
  wordOfDayDefinition: string;
  phraseOfDay: string;
  phraseOfDayMeaning: string;
  toastmasterOfTheDay: string;
  generalEvaluator: string;
  tableTopicsMaster: string;
  timer: string;
  ahCounter: string;
  grammarian: string;
  sergeantAtArms: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  timeline: TimelineItem[];
  guestList: string[];
  meetCode?: string;
  activeTimelineItemId?: string;
  liveTimerState?: {
    isRunning: boolean;
    seconds: number;
    signal: "NONE" | "GREEN" | "YELLOW" | "RED";
    speaker: string;
    role: string;
    minSeconds: number;
    yellowSeconds: number;
    maxSeconds: number;
  };
}

export interface TimerLog {
  id: string;
  speaker: string;
  role: string;
  segment: MeetingSegment;
  timeString: string; // e.g. "05:42"
  seconds: number;
  signal: "NONE" | "GREEN" | "YELLOW" | "RED";
  minSeconds: number;
  maxSeconds: number;
  timestamp: string;
}

export interface FillerCount {
  ah: number;
  um: number;
  er: number;
  well: number;
  so: number;
  repeats: number;
}

export interface AhCounterLog {
  id: string;
  speaker: string;
  role: string;
  counts: FillerCount;
  notes?: string;
}

export interface GrammarianUse {
  speaker: string;
  role: string;
  wodUsedCount: number;
  podUsedCount: number;
  elegantWordsLog: string[];
  fillerMistakesLog: string[];
}

export interface TableTopicsPrompt {
  id: string;
  prompt: string;
  theme: string;
  assignedSpeaker?: string;
  started?: boolean;
}

export interface EvaluationItem {
  id: string;
  evaluator: string;
  speaker: string;
  speechTitle: string;
  projectLevel: string; // e.g. "Level 1: Evaluation and Feedback"
  scores: {
    clarity: number; // 1-5
    vocalVariety: number; // 1-5
    eyeContact: number; // 1-5
    gestures: number; // 1-5
    audienceAwareness: number; // 1-5
    comfortLevel: number; // 1-5
    subjectMatter: number; // 1-5
  };
  positives: string;
  improvements: string;
  summarizedFeedback: string;
  submittedAt?: string;
}

export interface SAAPoll {
  id: string;
  question: string;
  options: { id: string; name: string; votes: number }[];
  active: boolean;
  type: "BEST_SPEAKER" | "BEST_TABLE_TOPICS" | "BEST_EVALUATOR" | "BEST_ROLE_PLAYER" | "BEST_TAG_TEAM" | "CUSTOM";
  totalVotes: number;
}

export interface MinutesOfMeeting {
  id: string;
  meetingId: string;
  meetingNumber: number;
  date: string;
  theme: string;
  wordOfDay: string;
  phraseOfDay: string;
  attendance: {
    membersCount: number;
    guests: string[];
  };
  timerSummary: TimerLog[];
  ahCounterSummary: AhCounterLog[];
  grammarianSummary: GrammarianUse[];
  votingResults: {
    bestSpeaker: string;
    bestTableTopics: string;
    bestEvaluator: string;
  };
  editorialSummary: string; // AI generated or custom edited description
  approved: boolean;
  approvedBy?: string; // President or Administrator
}
