"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  classifyGetUserMediaError,
  readMicrophonePermission,
  stopMediaStream,
  type MicFailure,
  type MicState,
} from "@/lib/microphone";

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
  video: false,
};

export function useMicrophone() {
  const [state, setState] = useState<MicState>("idle");
  const [failure, setFailure] = useState<MicFailure | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generationRef = useRef(0);
  const grantedRef = useRef(false);

  const releaseStream = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const applyPermission = (value: PermissionState) => {
      if (value === "denied") {
        grantedRef.current = false;
        releaseStream();
        setFailure("denied");
        setState("denied");
        return;
      }
      if (value === "granted") {
        grantedRef.current = true;
        setFailure(null);
        setState((current) =>
          current === "talking" || current === "requesting" ? current : "ready",
        );
      }
    };

    void (async () => {
      const permission = await readMicrophonePermission();
      if (cancelled || permission === "unsupported") {
        return;
      }

      applyPermission(permission);

      try {
        permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        permissionStatus.onchange = () => {
          applyPermission(permissionStatus!.state);
        };
      } catch {
        permissionStatus = null;
      }
    })();

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [releaseStream]);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const startTalking = useCallback(async () => {
    if (state === "talking" || state === "requesting") {
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setFailure("error");
      setState("error");
      return false;
    }

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    releaseStream();
    setFailure(null);
    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        AUDIO_CONSTRAINTS,
      );
      if (generationRef.current !== generation) {
        stopMediaStream(stream);
        return false;
      }

      const liveTracks = stream
        .getAudioTracks()
        .filter((track) => track.readyState === "live");
      if (liveTracks.length === 0) {
        stopMediaStream(stream);
        setFailure("missing");
        setState("error");
        return false;
      }

      streamRef.current = stream;
      grantedRef.current = true;
      for (const track of liveTracks) {
        track.addEventListener("ended", () => {
          if (generationRef.current !== generation) {
            return;
          }
          releaseStream();
          setState("ready");
        });
      }
      setFailure(null);
      setState("talking");
      return true;
    } catch (error) {
      if (generationRef.current !== generation) {
        return false;
      }

      const kind = classifyGetUserMediaError(error);
      setFailure(kind);
      setState(kind === "denied" ? "denied" : "error");
      return false;
    }
  }, [releaseStream, state]);

  const stopTalking = useCallback(() => {
    generationRef.current += 1;
    releaseStream();
    setFailure(null);
    setState(grantedRef.current ? "ready" : "idle");
  }, [releaseStream]);

  return {
    state,
    failure,
    startTalking,
    stopTalking,
    isTalking: state === "talking",
    isRequesting: state === "requesting",
  };
}
