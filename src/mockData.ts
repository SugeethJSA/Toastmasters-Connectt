import { Meeting, TimerLog, AhCounterLog, GrammarianUse, TableTopicsPrompt, EvaluationItem, SAAPoll, MeetingSegment } from "./types";

export const INITIAL_SPEAKERS = [
  "Audrey Chen",
  "Sarah Jenkins",
  "David Vance",
  "Marcus Brody",
  "Helen Ramirez",
  "Pranav Patel",
  "Grace Brewster",
  "Jameson Vance",
  "Theresa May"
];

export const INITIAL_ROLE_PLAYERS = [
  { name: "Audrey Chen", role: "Toastmaster of the Day" },
  { name: "Pranav Patel", role: "General Evaluator" },
  { name: "Grace Brewster", role: "Grammarian" },
  { name: "Marcus Brody", role: "Ah-Counter" },
  { name: "Theresa May", role: "Timer" },
  { name: "Jameson Vance", role: "Table Topics Master" }
];

export const INITIAL_MEETING: Meeting = {
  id: "meet-124",
  number: 124,
  date: "June 17, 2026",
  theme: "Unlocking Inner Metanoia",
  name: "Sophrosyne VIT Toastmasters",
  meetingLink: "",
  wordOfDay: "Metanoia",
  wordOfDayDefinition: "The journey of changing one's mind, heart, self, or way of life to achieve spiritual transformation.",
  phraseOfDay: "Pave the Path",
  phraseOfDayMeaning: "To create circumstances or provide resources that make it easier for others to succeed.",
  toastmasterOfTheDay: "Sarah Jenkins",
  presidingOfficer: "",
  generalEvaluator: "Pranav Patel",
  tableTopicsMaster: "Jameson Vance",
  timer: "Theresa May",
  ahCounter: "Marcus Brody",
  grammarian: "Grace Brewster",
  sergeantAtArms: "Helen Ramirez",
  status: "SCHEDULED",
  timeline: [
    {
      id: "time-1",
      time: "19:00",
      durationMin: 5,
      role: "Sergeant-at-Arms",
      player: "Helen Ramirez",
      title: "President Introduction & Meeting Warmup",
      segment: MeetingSegment.BUSINESS,
      completed: true,
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      quote: "Welcome speech-craft pioneers! Our dedication today shapes the public stages of tomorrow."
    },
    {
      id: "time-2",
      time: "19:05",
      durationMin: 7,
      role: "Toastmaster of the Day",
      player: "Sarah Jenkins",
      title: "Meeting Introduction & Team Overview",
      segment: MeetingSegment.BUSINESS,
      completed: true,
      photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
      quote: "As TMOD of today's assembly, my vision is to weave metanoia into every single narrative we build."
    },
    {
      id: "time-3",
      time: "19:12",
      durationMin: 7,
      role: "Speaker 1",
      player: "Audrey Chen",
      title: "The Art of Slowing Down",
      segment: MeetingSegment.PREPARED_SPEECH,
      completed: false,
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      quote: "In an accelerated corporate landscape, intentional pause is not a weakness — it is a superpower."
    },
    {
      id: "time-4",
      time: "19:19",
      durationMin: 7,
      role: "Speaker 2",
      player: "David Vance",
      title: "Code and Compassion: Inside LLMs",
      segment: MeetingSegment.PREPARED_SPEECH,
      completed: false,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      quote: "The next digital frontier isn't pure logic; it is teaching models to appreciate the nuances of human speech."
    },
    {
      id: "time-5",
      time: "19:26",
      durationMin: 15,
      role: "Table Topics Master",
      player: "Jameson Vance",
      title: "Impromptu Journey Prompts",
      segment: MeetingSegment.TABLE_TOPICS,
      completed: false,
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      quote: "Impromptu speech challenges our comfort zone — but it is the exact place where authentic confidence is forged."
    },
    {
      id: "time-6",
      time: "19:41",
      durationMin: 6,
      role: "Evaluator 1",
      player: "Helen Ramirez",
      title: "Audrey's Speech Evaluation",
      segment: MeetingSegment.EVALUATION,
      completed: false,
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      quote: "Evaluation is a gift of constructive insight that lets us rebuild our public craft line-by-line."
    },
    {
      id: "time-7",
      time: "19:47",
      durationMin: 6,
      role: "Evaluator 2",
      player: "Marcus Brody",
      title: "David's Speech Evaluation",
      segment: MeetingSegment.EVALUATION,
      completed: false,
      photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      quote: "Constructive feedback bridges speakers from where they are to the inspiring pathway ahead."
    },
    {
      id: "time-8",
      time: "19:53",
      durationMin: 7,
      role: "General Evaluator",
      player: "Pranav Patel",
      title: "Grammarian, Ah-Counter, and Time Reports",
      segment: MeetingSegment.EVALUATION,
      completed: false,
      photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
      quote: "A professional meeting starts with discipline and closes with a comprehensive review of our active team."
    }
  ],
  guestList: ["Alice Sterling", "Bob Henderson", "Claire Jenkins"],
  meetCode: "123456"
};

export const INITIAL_TIMER_LOGS: TimerLog[] = [
  {
    id: "log-1",
    speaker: "Helen Ramirez",
    role: "Sergeant-at-Arms",
    segment: MeetingSegment.BUSINESS,
    timeString: "04:52",
    seconds: 292,
    signal: "GREEN",
    minSeconds: 240, // 4 mins
    maxSeconds: 300, // 5 mins
    timestamp: "19:05"
  },
  {
    id: "log-2",
    speaker: "Sarah Jenkins",
    role: "Toastmaster of the Day",
    segment: MeetingSegment.BUSINESS,
    timeString: "06:12",
    seconds: 372,
    signal: "YELLOW",
    minSeconds: 300, // 5 mins
    maxSeconds: 420, // 7 mins
    timestamp: "19:12"
  }
];

export const INITIAL_AH_LOGS: AhCounterLog[] = [
  {
    id: "ah-1",
    speaker: "Helen Ramirez",
    role: "Sergeant-at-Arms",
    counts: { ah: 2, um: 1, er: 0, well: 3, so: 1, repeats: 0 },
    notes: "Very confident welcome! Strong vocal pacing."
  },
  {
    id: "ah-2",
    speaker: "Sarah Jenkins",
    role: "Toastmaster of the Day",
    counts: { ah: 0, um: 2, er: 1, well: 0, so: 4, repeats: 1 },
    notes: "Frequent transitions using 'So'. Otherwise excelente."
  }
];

export const INITIAL_GRAMMAR_LOGS: GrammarianUse[] = [
  {
    speaker: "Helen Ramirez",
    role: "Sergeant-at-Arms",
    wodUsedCount: 1,
    podUsedCount: 0,
    elegantWordsLog: ["Aura of welcome", "Command of space", "Steadfast values"],
    fillerMistakesLog: ["we are going for next" , "to begin our today meeting"]
  },
  {
    speaker: "Sarah Jenkins",
    role: "Toastmaster of the Day",
    wodUsedCount: 3,
    podUsedCount: 1,
    elegantWordsLog: ["Catalyst of growth", "Melt away boundaries", "Intellectual harmony"],
    fillerMistakesLog: ["discussed about the roles", "like she said"]
  }
];

export const INITIAL_TOPICS: TableTopicsPrompt[] = [
  {
    id: "prompt-1",
    prompt: "If you could undergo a complete metanoia in any single area of your current career, what would it be and why?",
    theme: "Unlocking Inner Metanoia",
    assignedSpeaker: "Audrey Chen",
    started: true
  },
  {
    id: "prompt-2",
    prompt: "Think of a time when someone paved the path for you in a difficult moment. How can you pay that kindness forward today?",
    theme: "Unlocking Inner Metanoia",
    assignedSpeaker: "Bob Henderson (Guest)",
    started: false
  },
  {
    id: "prompt-3",
    prompt: "When taking a leap of faith into a new adventure, do you rely more on thorough planning or pure instinct?",
    theme: "Unlocking Inner Metanoia",
    started: false
  },
  {
    id: "prompt-4",
    prompt: "Describe what the silence right before you walk on stage feels like to you.",
    theme: "Unlocking Inner Metanoia",
    started: false
  }
];

export const INITIAL_EVALUATIONS: EvaluationItem[] = [
  {
    id: "eval-1",
    evaluator: "Helen Ramirez",
    speaker: "Audrey Chen",
    speechTitle: "The Art of Slowing Down",
    projectLevel: "Level 1: Evaluation and Feedback",
    scores: {
      clarity: 4,
      vocalVariety: 3,
      eyeContact: 5,
      gestures: 4,
      audienceAwareness: 4,
      comfortLevel: 4,
      subjectMatter: 5
    },
    positives: "Exceptional eye contact during the speech introduction. The pause after the first slide was incredibly effective to engage the room.",
    improvements: "Could enhance vocal variety, especially in the conclusion. Use higher pitch changes when describing the rapid flow of software cycles.",
    summarizedFeedback: "A cohesive, beautifully paced presentation. With minor vocal variety adjustments in high-impact stories, this is near perfect.",
    submittedAt: "June 17, 2026 19:45"
  }
];

export const INITIAL_POLLS: SAAPoll[] = [
  {
    id: "poll-1",
    question: "Cast your vote for Best Prepared Speaker",
    type: "BEST_SPEAKER",
    options: [
      { id: "opt-1", name: "Audrey Chen", votes: 4 },
      { id: "opt-2", name: "David Vance", votes: 6 }
    ],
    active: true,
    totalVotes: 10
  },
  {
    id: "poll-2",
    question: "Cast your vote for Best Table Topics Speaker",
    type: "BEST_TABLE_TOPICS",
    options: [
      { id: "opt-3", name: "Audrey Chen", votes: 2 },
      { id: "opt-4", name: "Bob Henderson (Guest)", votes: 5 },
      { id: "opt-5", name: "Claire Jenkins (Guest)", votes: 3 }
    ],
    active: true,
    totalVotes: 10
  },
  {
    id: "poll-3",
    question: "Cast your vote for Best Advisor / Evaluator",
    type: "BEST_EVALUATOR",
    options: [
      { id: "opt-6", name: "Helen Ramirez", votes: 5 },
      { id: "opt-7", name: "Marcus Brody", votes: 2 },
      { id: "opt-8", name: "Jameson Vance (GE)", votes: 3 }
    ],
    active: true,
    totalVotes: 10
  },
  {
    id: "poll-4",
    question: "Cast your vote for Best Role Player (TMOD / TTM)",
    type: "BEST_ROLE_PLAYER",
    options: [
      { id: "opt-9", name: "Sarah Jenkins (TMOD)", votes: 4 },
      { id: "opt-10", name: "Pranav Patel (TTM)", votes: 5 }
    ],
    active: true,
    totalVotes: 9
  },
  {
    id: "poll-5",
    question: "Cast your vote for Best Tag Team Player",
    type: "BEST_TAG_TEAM",
    options: [
      { id: "opt-11", name: "Grace Brewster & Theresa May", votes: 3 },
      { id: "opt-12", name: "Audrey Chen & David Vance", votes: 6 }
    ],
    active: true,
    totalVotes: 9
  }
];

export const PAST_MEETINGS_ARCHIVE = [
  {
    id: "meet-123",
    number: 123,
    date: "June 10, 2026",
    theme: "Resilience in Motion",
    wordOfDay: "Ebullient",
    phraseOfDay: "Spur of the moment",
    editorialSummary: "Minutes of Sophrosyne VIT Area F4 District 120 Meeting #123. TMOD Sarah Jenkins facilitated standard segments on theme 'Resilience in Motion'. Prepared speaker David Vance delivered a brilliant presentation on blockchain metrics timing out at exactly 5:12 (Green Signal), followed by Audrey Chen with dynamic evaluations. The Grammarian report congratulated Jameson for active use of 'Ebullient'. Business section approved standard membership approvals for our 2 newest guests.",
    approved: true,
    approvedBy: "David Vance (President)"
  },
  {
    id: "meet-122",
    number: 122,
    date: "June 03, 2026",
    theme: "Navigating Uncharted Waters",
    wordOfDay: "Sovereignty",
    phraseOfDay: "Sail close to the wind",
    editorialSummary: "Meeting #122 explored professional transitions of public sector roles. Audrey Chen served as General Evaluator. Total table topic assignments drew 6 active speakers. Ah counter logged incredibly low numbers (average card size reduced by 12%). Approved unanimously by the executive committee.",
    approved: true,
    approvedBy: "David Vance (President)"
  }
];
