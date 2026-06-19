import { useEffect, useRef, useState, useCallback } from "react";

export interface SyncedTimerState {
  isRunning: boolean;
  seconds: number;
  signal: "NONE" | "GREEN" | "YELLOW" | "RED";
  speaker: string;
  role: string;
  minSeconds: number;
  yellowSeconds: number;
  maxSeconds: number;
}

export interface StageTopic {
  id: string;
  prompt: string;
  theme: string;
  assignedSpeaker?: string;
}

const defaultState: SyncedTimerState = {
  isRunning: false,
  seconds: 0,
  signal: "NONE",
  speaker: "",
  role: "Prepared Speaker 1",
  minSeconds: 300,
  yellowSeconds: 360,
  maxSeconds: 420,
};

function computeSignal(secs: number, min: number, yellow: number, max: number): SyncedTimerState["signal"] {
  if (secs >= max) return "RED";
  if (secs >= yellow) return "YELLOW";
  if (secs >= min) return "GREEN";
  return "NONE";
}

export function useTimerSync(onSpotlightUpdate?: (item: { id: string; role: string; player: string; segment: string; time?: string; durationMin?: number; title?: string; completed?: boolean; photoUrl?: string; quote?: string } | null) => void, onMeetingUpdate?: (meeting: any) => void, onPollsUpdate?: (polls: any[]) => void) {
  const [state, setState] = useState<SyncedTimerState>(defaultState);
  const [topic, setTopic] = useState<StageTopic | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Local timer tick — ALWAYS works regardless of WebSocket
  useEffect(() => {
    if (state.isRunning) {
      tickRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isRunning) return prev;
          const nextSecs = prev.seconds + 1;
          return {
            ...prev,
            seconds: nextSecs,
            signal: computeSignal(nextSecs, prev.minSeconds, prev.yellowSeconds, prev.maxSeconds),
          };
        });
      }, 1000);
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [state.isRunning]);

  // WebSocket sync — optional enhancement, non-blocking, stops retry after 3 failures
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let failCount = 0;

    const connect = () => {
      if (failCount >= 3) return;
      const apiBase = import.meta.env.VITE_API_URL || "";
      let url: string;
      if (apiBase) {
        const u = new URL(apiBase);
        url = `${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}/ws/timer`;
      } else {
        url = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/timer`;
      }

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type === "TIMER_STATE") {
          setState({
            isRunning: msg.isRunning ?? false,
            seconds: msg.seconds ?? 0,
            signal: msg.signal ?? "NONE",
            speaker: msg.speaker ?? "",
            role: msg.role ?? "",
            minSeconds: msg.minSeconds ?? 300,
            yellowSeconds: msg.yellowSeconds ?? 360,
            maxSeconds: msg.maxSeconds ?? 420,
          });
        } else if (msg.type === "TIMER_TICK") {
          setState(prev => ({
            ...prev,
            seconds: msg.seconds ?? prev.seconds,
            signal: msg.signal ?? prev.signal,
          }));
        } else if (msg.type === "TOPIC_STATE") {
          if (msg.topic) {
            setTopic({ id: msg.topic.id, prompt: msg.topic.prompt, theme: msg.topic.theme, assignedSpeaker: msg.topic.assignedSpeaker });
          } else {
            setTopic(null);
          }
        } else if (msg.type === "SPOTLIGHT_STATE") {
          if (onSpotlightUpdate) {
            onSpotlightUpdate(msg.spotlight || null);
          }
        } else if (msg.type === "MEETING_SYNC") {
          if (onMeetingUpdate && msg.meeting) {
            onMeetingUpdate(msg.meeting);
          }
        } else if (msg.type === "POLLS_UPDATE") {
          if (onPollsUpdate && msg.polls) {
            onPollsUpdate(msg.polls);
          }
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        failCount++;
        if (failCount < 3) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const setLiveTimerState = useCallback((value: any) => {
    const prev = stateRef.current;
    const next = typeof value === "function" ? value(prev) : value;
    setState(next);
  }, []);

  const sendTimerControl = useCallback((action: "start" | "pause" | "reset" | "config", overrides?: Partial<SyncedTimerState>) => {
    const msg: any = { type: "TIMER_CONTROL", action };
    if (overrides) Object.assign(msg, overrides);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const sendTopicControl = useCallback((action: "show" | "hide" | "clear", topicData?: StageTopic) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "TOPIC_CONTROL", action, topic: topicData }));
    }
    // Optimistic local update
    if (action === "show" && topicData) {
      setTopic(topicData);
    } else {
      setTopic(null);
    }
  }, []);

  const sendSpotlightControl = useCallback((item: { id: string; role: string; player: string; segment: string; time?: string; durationMin?: number; title?: string; completed?: boolean; photoUrl?: string; quote?: string } | null) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "SPOTLIGHT_CONTROL", action: item ? "set" : "clear", spotlight: item }));
    }
  }, []);

  return { liveTimerState: state, setLiveTimerState, sendTimerControl, stageTopic: topic, sendTopicControl, sendSpotlightControl };
}
