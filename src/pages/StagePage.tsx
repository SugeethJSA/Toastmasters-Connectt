import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StageView } from "../components/StageView";
import { Meeting, TimelineItem } from "../types";
import { INITIAL_MEETING } from "../mockData";
import { useTimerSync } from "../hooks/useTimerSync";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const StagePage: React.FC = () => {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting>(INITIAL_MEETING);
  const [activeTimelineItem, setActiveTimelineItem] = useState<TimelineItem | null>(
    INITIAL_MEETING.timeline.find(item => item.role === "Prepared Speaker 1") || null
  );

  const { liveTimerState, setLiveTimerState, sendTimerControl, stageTopic, sendTopicControl, sendSpotlightControl } = useTimerSync((spotlight) => {
    if (spotlight) {
      setActiveTimelineItem({
        id: spotlight.id,
        role: spotlight.role,
        player: spotlight.player,
        segment: spotlight.segment as any,
        time: spotlight.time || "",
        durationMin: spotlight.durationMin || 0,
        completed: spotlight.completed || false,
        title: spotlight.title,
        photoUrl: spotlight.photoUrl,
        quote: spotlight.quote,
      });
    }
  });

  // Fetch latest meeting data from server every second
  useEffect(() => {
    const fetchMeeting = () => {
      fetch(`${API_BASE}/api/meetings/active`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.meeting) {
            setMeeting(data.meeting);
            let activeItem = null;
            if (data.meeting.activeTimelineItemId) {
              activeItem = data.meeting.timeline.find((item: any) => item.id === data.meeting.activeTimelineItemId);
            }
            if (!activeItem) {
              activeItem = data.meeting.timeline.find((item: any) => item.segment === "PREPARED_SPEECH");
            }
            setActiveTimelineItem(activeItem || null);
          }
        })
        .catch(() => {});
    };

    fetchMeeting();
    const intervalId = setInterval(fetchMeeting, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Listen for Escape key to navigate back
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-tm-dark overflow-hidden">
      <StageView
        meeting={meeting}
        setMeeting={setMeeting}
        activeTimelineItem={activeTimelineItem}
        liveTimerState={liveTimerState}
        setLiveTimerState={setLiveTimerState}
        sendTimerControl={sendTimerControl}
        stageTopic={stageTopic}
        sendTopicControl={sendTopicControl}
        isFullScreen={true}
      />
    </div>
  );
};
