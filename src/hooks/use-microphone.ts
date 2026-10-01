"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicState =
  | "idle"
  | "requesting"
  | "ready"
  | "talking"
  | "denied"
  | "error";

type UseMicrophoneOptions = {
  onLevel?: (level: number) => void;
};

export function useMicrophone(options: UseMicrophoneOptions = {}) {
  const { onLevel } = options;
  const [micState, setMicState] = useState<MicState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopLevelLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopLevelLoop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, [stopLevelLoop]);

  const startLevelLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || !onLevel) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i]!;
      const level = Math.min(100, Math.round((sum / data.length / 255) * 140));
      onLevel(level);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onLevel]);

  const ensureMic = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current) {
      return streamRef.current;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicState("error");
      setErrorMessage("This browser does not support microphone capture.");
      return null;
    }

    setMicState("requesting");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (onLevel) {
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        startLevelLoop();
      }

      setMicState("ready");
      return stream;
    } catch (err) {
      releaseStream();
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicState("denied");
        setErrorMessage(
          "Microphone access was blocked. Allow the mic in your browser settings, then try Talk again.",
        );
      } else if (name === "NotFoundError") {
        setMicState("error");
        setErrorMessage("No microphone was found on this device.");
      } else {
        setMicState("error");
        setErrorMessage("Could not open the microphone. Check your device and try again.");
      }
      return null;
    }
  }, [onLevel, releaseStream, startLevelLoop]);

  const startTalking = useCallback(async () => {
    const stream = await ensureMic();
    if (!stream) return null;
    setMicState("talking");
    return stream;
  }, [ensureMic]);

  const stopTalking = useCallback(() => {
    if (micState === "talking") {
      releaseStream();
      setMicState("idle");
    }
  }, [micState, releaseStream]);

  const resetMic = useCallback(() => {
    releaseStream();
    setMicState("idle");
    setErrorMessage(null);
  }, [releaseStream]);

  useEffect(() => () => releaseStream(), [releaseStream]);

  return {
    micState,
    errorMessage,
    ensureMic,
    startTalking,
    stopTalking,
    resetMic,
    getStream: () => streamRef.current,
    releaseStream,
  };
}
