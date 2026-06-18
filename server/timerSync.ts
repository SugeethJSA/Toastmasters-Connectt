import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";

interface TimerState {
  isRunning: boolean;
  seconds: number;
  signal: "NONE" | "GREEN" | "YELLOW" | "RED";
  speaker: string;
  role: string;
  minSeconds: number;
  yellowSeconds: number;
  maxSeconds: number;
}

interface StageTopic {
  id: string;
  prompt: string;
  theme: string;
  assignedSpeaker?: string;
}

const defaultState: TimerState = {
  isRunning: false,
  seconds: 0,
  signal: "NONE",
  speaker: "",
  role: "Prepared Speaker 1",
  minSeconds: 300,
  yellowSeconds: 360,
  maxSeconds: 420,
};

let state: TimerState = { ...defaultState };
let currentTopic: StageTopic | null = null;
let currentSpotlight: { id: string; role: string; player: string; segment: string; time?: string; durationMin?: number; title?: string; completed?: boolean; photoUrl?: string; quote?: string } | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;
const clients = new Set<WebSocket>();

function broadcast(message: object) {
  const data = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function computeSignal(secs: number, min: number, yellow: number, max: number): TimerState["signal"] {
  if (secs >= max) return "RED";
  if (secs >= yellow) return "YELLOW";
  if (secs >= min) return "GREEN";
  return "NONE";
}

function startTicking() {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    state.seconds += 1;
    state.signal = computeSignal(state.seconds, state.minSeconds, state.yellowSeconds, state.maxSeconds);
    broadcast({ type: "TIMER_TICK", seconds: state.seconds, signal: state.signal });
  }, 1000);
}

function stopTicking() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function processMessage(data: string) {
  let msg: any;
  try {
    msg = JSON.parse(data);
  } catch {
    return;
  }

  switch (msg.type) {
    case "TIMER_CONTROL":
      if (msg.action === "start") {
        state.isRunning = true;
        if (msg.speaker !== undefined) state.speaker = msg.speaker;
        if (msg.role !== undefined) state.role = msg.role;
        if (msg.minSeconds !== undefined) state.minSeconds = msg.minSeconds;
        if (msg.yellowSeconds !== undefined) state.yellowSeconds = msg.yellowSeconds;
        if (msg.maxSeconds !== undefined) state.maxSeconds = msg.maxSeconds;
        state.seconds = 0;
        state.signal = "NONE";
        startTicking();
        broadcast({ type: "TIMER_STATE", ...state });
      } else if (msg.action === "pause") {
        state.isRunning = false;
        stopTicking();
        broadcast({ type: "TIMER_STATE", ...state });
      } else if (msg.action === "reset") {
        state.isRunning = false;
        stopTicking();
        state.seconds = 0;
        state.signal = "NONE";
        if (msg.speaker !== undefined) state.speaker = msg.speaker;
        if (msg.role !== undefined) state.role = msg.role;
        if (msg.minSeconds !== undefined) state.minSeconds = msg.minSeconds;
        if (msg.yellowSeconds !== undefined) state.yellowSeconds = msg.yellowSeconds;
        if (msg.maxSeconds !== undefined) state.maxSeconds = msg.maxSeconds;
        broadcast({ type: "TIMER_STATE", ...state });
      } else if (msg.action === "config") {
        if (msg.speaker !== undefined) state.speaker = msg.speaker;
        if (msg.role !== undefined) state.role = msg.role;
        if (msg.minSeconds !== undefined) state.minSeconds = msg.minSeconds;
        if (msg.yellowSeconds !== undefined) state.yellowSeconds = msg.yellowSeconds;
        if (msg.maxSeconds !== undefined) state.maxSeconds = msg.maxSeconds;
        broadcast({ type: "TIMER_STATE", ...state });
      }
      break;
    case "TOPIC_CONTROL":
      if (msg.action === "show" && msg.topic) {
        currentTopic = msg.topic;
        broadcast({ type: "TOPIC_STATE", topic: currentTopic });
      } else if (msg.action === "hide" || msg.action === "clear") {
        currentTopic = null;
        broadcast({ type: "TOPIC_STATE", topic: null });
      }
      break;
    case "SPOTLIGHT_CONTROL":
      if (msg.action === "set" && msg.spotlight) {
        currentSpotlight = msg.spotlight;
        broadcast({ type: "SPOTLIGHT_STATE", spotlight: currentSpotlight });
      } else if (msg.action === "clear") {
        currentSpotlight = null;
        broadcast({ type: "SPOTLIGHT_STATE", spotlight: null });
      }
      break;
  }
}

export function attachTimerSync(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Manually handle upgrade to avoid conflicts with Vite's HMR WebSocket
  server.on("upgrade", (req: IncomingMessage, socket: any, head: Buffer) => {
    const url = req.url || "";
    if (url === "/ws/timer" || url.startsWith("/ws/timer?")) {
      wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: "TIMER_STATE", ...state }));
    if (currentTopic) {
      ws.send(JSON.stringify({ type: "TOPIC_STATE", topic: currentTopic }));
    }
    if (currentSpotlight) {
      ws.send(JSON.stringify({ type: "SPOTLIGHT_STATE", spotlight: currentSpotlight }));
    }

    ws.on("message", (raw: Buffer) => {
      processMessage(raw.toString());
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  console.log("WebSocket timer sync attached at /ws/timer");
}
