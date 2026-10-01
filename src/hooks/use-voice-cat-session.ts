"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  LocalAudioTrack,
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
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

function describeSessionError(err: unknown) {
  const message = err instanceof Error ? err.message : "LiveKit connection failed.";
  if (/invalid token/i.test(message)) {
    return "LiveKit rechazó la credencial. Copia la API key y el secret actuales del proyecto en .env y reinicia el servidor.";
  }
  return message;
}

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
  const [agentPresent, setAgentPresent] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);
  const playbackVolumeRef = useRef(1);
  const connectPromiseRef = useRef<Promise<Room | null> | null>(null);
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

  const releaseAgentAudio = useCallback(() => {
    for (const el of audioElementsRef.current) {
      el.pause();
      el.remove();
    }
    audioElementsRef.current = [];
    setAgentAudioPlaying(false);
  }, []);

  const attachAgentAudio = useCallback((track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    const el = track.attach();
    el.autoplay = true;
    el.volume = playbackVolumeRef.current;
    el.dataset.agentAudio = "true";
    document.body.append(el);
    audioElementsRef.current.push(el);
    const markTalking = () => {
      setAgentAudioPlaying(true);
      setCatState("talking");
    };
    el.addEventListener("play", markTalking);
    void el.play().then(markTalking).catch(() => undefined);
  }, []);

  const connectLiveKit = useCallback(async () => {
    if (roomRef.current?.state === ConnectionState.Connected) {
      return roomRef.current;
    }

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
      attachAgentAudio(track);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      for (const el of track.detach()) {
        el.remove();
        audioElementsRef.current = audioElementsRef.current.filter(
          (node) => node !== el,
        );
      }
    });
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      if (participant.identity !== room.localParticipant.identity) {
        setAgentPresent(true);
      }
    });
    room.on(RoomEvent.ParticipantDisconnected, () => {
      const others = room.remoteParticipants.size > 0;
      setAgentPresent(others);
    });
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const agentSpeaking = speakers.some(
        (speaker) => speaker.identity !== room.localParticipant.identity,
      );
      if (agentSpeaking) {
        setAgentAudioPlaying(true);
        setCatState("talking");
      } else if (localTrackRef.current) {
        setAgentAudioPlaying(false);
        setCatState("listening");
      }
    });

    await Promise.race([
      room.connect(body.url, body.token),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => {
          reject(new Error("LiveKit connection timed out."));
        }, 8000);
      }),
    ]);
    setAgentPresent(room.remoteParticipants.size > 0);
    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.audioTrackPublications.values()) {
        if (publication.track) attachAgentAudio(publication.track);
      }
    }
    setMode("livekit");
    return room;
  }, [attachAgentAudio, handleData]);

  useEffect(() => {
    let active = true;
    const pending = connectLiveKit()
      .then((room) => {
        if (!active) {
          void room?.disconnect();
          if (roomRef.current === room) roomRef.current = null;
          return null;
        }
        return room;
      })
      .catch((err: unknown) => {
        if (active) {
          setMode("error");
          setSessionError(describeSessionError(err));
        }
        return null;
      });
    connectPromiseRef.current = pending;

    return () => {
      active = false;
      if (mockTalkingTimer.current) {
        window.clearTimeout(mockTalkingTimer.current);
      }
      void pending.then((room) => {
        releaseAgentAudio();
        void room?.disconnect();
        if (room && roomRef.current === room) roomRef.current = null;
      });
    };
  }, [connectLiveKit, releaseAgentAudio]);

  const publishMic = useCallback(async (room: Room, stream: MediaStream) => {
    const mediaTrack = stream.getAudioTracks()[0];
    if (!mediaTrack) return;

    await room.startAudio();

    if (!localTrackRef.current) {
      localTrackRef.current = new LocalAudioTrack(mediaTrack);
      await room.localParticipant.publishTrack(localTrackRef.current, {
        source: Track.Source.Microphone,
      });
    } else {
      await localTrackRef.current.unmute();
    }

    setCatState("listening");
  }, []);

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

  const setPlaybackVolume = useCallback((value: number) => {
    const volume = Math.min(1, Math.max(0, value));
    playbackVolumeRef.current = volume;
    for (const el of audioElementsRef.current) {
      el.volume = volume;
    }
  }, []);

  const onTalkStart = useCallback(
    async (stream: MediaStream) => {
      const room = await connectPromiseRef.current;
      if (!room) {
        setCatState("listening");
        return;
      }
      await publishMic(room, stream);
    },
    [publishMic],
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
    agentPresent,
    onTalkStart,
    onTalkStop,
    resetSession,
    setPlaybackVolume,
  };
}
