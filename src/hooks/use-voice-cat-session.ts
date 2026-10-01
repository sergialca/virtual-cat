"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  LocalAudioTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import {
  type AgentDataMessage,
  type CatAnimationState,
  type TranscriptEntry,
  parseAgentData,
} from "@/lib/agent-messages";

type TokenResponse =
  | { configured: false; mock: true }
  | {
      configured: true;
      mock: false;
      token: string;
      url: string;
      roomName: string;
      identity: string;
    };

export type VoiceMode = "loading" | "mock" | "livekit" | "error";

const MOCK_ASSISTANT =
  "¡Miau! En modo demo no hay agente en la nube, pero ya escuché tu micrófono. Cuando conectes LiveKit, te responderé de verdad.";

export function useVoiceCatSession() {
  const [mode, setMode] = useState<VoiceMode>("loading");
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [catState, setCatState] = useState<CatAnimationState>("idle");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [livePartial, setLivePartial] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [agentAudioPlaying, setAgentAudioPlaying] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const mockTalkingTimer = useRef<number | null>(null);

  const upsertTranscript = useCallback((msg: AgentDataMessage & { type: "transcript" }) => {
    setTranscripts((prev) => {
      const key = `${msg.role}-${msg.final ? "final" : "partial"}`;
      const existingIndex = prev.findIndex(
        (t) => t.role === msg.role && !t.final && !msg.final,
      );

      if (!msg.final && existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex]!,
          text: msg.text,
        };
        return next;
      }

      if (msg.final) {
        const withoutPartials = prev.filter(
          (t) => !(t.role === msg.role && !t.final),
        );
        return [
          ...withoutPartials,
          {
            id: `${key}-${Date.now()}`,
            role: msg.role,
            text: msg.text,
            final: true,
            at: Date.now(),
          },
        ];
      }

      return [
        ...prev,
        {
          id: `${key}-${Date.now()}`,
          role: msg.role,
          text: msg.text,
          final: false,
          at: Date.now(),
        },
      ];
    });
  }, []);

  const handleData = useCallback(
    (payload: Uint8Array) => {
      const message = parseAgentData(payload);
      if (!message) return;
      if (message.type === "state") {
        setCatState(message.value);
        return;
      }
      upsertTranscript(message);
      if (!message.final) {
        setLivePartial(message.text);
      } else {
        setLivePartial(null);
      }
    },
    [upsertTranscript],
  );

  const connectLiveKit = useCallback(async () => {
    const res = await fetch("/api/livekit/token");
    if (!res.ok) {
      throw new Error("Could not mint a LiveKit token.");
    }
    const body = (await res.json()) as TokenResponse;

    if (!body.configured) {
      setMode("mock");
      return null;
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    room.on(RoomEvent.ConnectionStateChanged, setConnectionState);
    room.on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
      if (topic && topic !== "cat-ui") return;
      handleData(payload);
    });
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        el.onplay = () => {
          setAgentAudioPlaying(true);
          setCatState("talking");
        };
        el.onended = () => {
          setAgentAudioPlaying(false);
          setCatState("idle");
        };
        void el.play().catch(() => undefined);
      }
    });

    await room.connect(body.url, body.token);
    setMode("livekit");
    return room;
  }, [handleData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await connectLiveKit();
      } catch (err) {
        if (!cancelled) {
          setMode("error");
          setSessionError(
            err instanceof Error ? err.message : "LiveKit connection failed.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (mockTalkingTimer.current) {
        window.clearTimeout(mockTalkingTimer.current);
      }
      void roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [connectLiveKit]);

  const publishMic = useCallback(async (stream: MediaStream) => {
    const room = roomRef.current;
    if (!room || mode !== "livekit") return;

    const mediaTrack = stream.getAudioTracks()[0];
    if (!mediaTrack) return;

    if (!localTrackRef.current) {
      localTrackRef.current = new LocalAudioTrack(mediaTrack);
      await room.localParticipant.publishTrack(localTrackRef.current);
    } else {
      await localTrackRef.current.unmute();
    }

    setCatState("listening");
  }, [mode]);

  const unpublishMic = useCallback(async () => {
    const room = roomRef.current;
    if (room && localTrackRef.current) {
      await room.localParticipant.unpublishTrack(localTrackRef.current);
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }
    if (!agentAudioPlaying) {
      setCatState("idle");
    }
  }, [agentAudioPlaying]);

  const runMockTurn = useCallback(() => {
    setCatState("listening");
    window.setTimeout(() => {
      const userLine = "Hola Dada, ¿estás en modo demo?";
      setTranscripts((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: userLine,
          final: true,
          at: Date.now(),
        },
      ]);
      setLivePartial("Generando respuesta...");
      setCatState("talking");
      mockTalkingTimer.current = window.setTimeout(() => {
        setLivePartial(null);
        setTranscripts((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: MOCK_ASSISTANT,
            final: true,
            at: Date.now(),
          },
        ]);
        setCatState("idle");
      }, 1800);
    }, 600);
  }, []);

  const onTalkStart = useCallback(
    async (stream: MediaStream) => {
      if (mode === "mock") {
        setCatState("listening");
        return;
      }
      if (mode === "livekit") {
        await publishMic(stream);
      }
    },
    [mode, publishMic],
  );

  const onTalkStop = useCallback(async () => {
    if (mode === "mock") {
      runMockTurn();
      return;
    }
    await unpublishMic();
  }, [mode, runMockTurn, unpublishMic]);

  const resetSession = useCallback(() => {
    setTranscripts([]);
    setLivePartial(null);
    setCatState("idle");
    setSessionError(null);
  }, []);

  return {
    mode,
    connectionState,
    catState,
    transcripts,
    livePartial,
    sessionError,
    onTalkStart,
    onTalkStop,
    resetSession,
  };
}
