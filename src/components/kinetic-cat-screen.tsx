"use client";

import { useState } from "react";
import {
  AudioLines,
  Mic,
  MicOff,
  PawPrint,
  RotateCcw,
  SlidersHorizontal,
  Square,
  UserRound,
  Volume1,
  Volume2,
} from "lucide-react";
import { cn } from "cn";
import { useMicrophone } from "@/hooks/use-microphone";
import type { MicFailure, MicState } from "@/lib/microphone";

const WAVE_HEIGHTS = [
  10, 16, 26, 18, 34, 22, 40, 28, 16, 36, 24, 42, 18, 32, 14, 28, 38, 20, 30,
  16,
];

const SAMPLE_LINE =
  "Hey — I’m the stand-in cat. Real voice and animation aren’t wired yet, so this is just a placeholder line.";

type CaptionStatus = "idle" | "talking" | "error";

const MIC_STATE_COPY: Record<
  MicState,
  { label: string; detail: string }
> = {
  idle: {
    label: "Mic idle",
    detail: "Not asked yet. Talk will open the browser microphone prompt.",
  },
  requesting: {
    label: "Requesting microphone",
    detail: "Allow the microphone in the browser prompt to start talking.",
  },
  ready: {
    label: "Mic ready",
    detail: "Permission granted. Press Talk to start capture.",
  },
  talking: {
    label: "Talking",
    detail: "Capture is active. Press Stop to release the microphone.",
  },
  denied: {
    label: "Microphone blocked",
    detail:
      "This site cannot hear you until the mic is allowed. In the address bar, open site settings (lock or tune icon) → Microphone → Allow, then press Talk again.",
  },
  error: {
    label: "Microphone error",
    detail:
      "The microphone could not be opened. Check the device, close other apps using it, then allow this site in browser settings and press Talk again.",
  },
};

function micHelp(state: MicState, failure: MicFailure | null) {
  if (state === "error" && failure === "missing") {
    return {
      label: "No microphone",
      detail:
        "No microphone was found. Plug one in (or enable it in system settings), then press Talk again. If the browser still blocks it, allow Microphone for this site in the address-bar site settings.",
    };
  }
  return MIC_STATE_COPY[state];
}

export function KineticCatScreen({ catSvg }: { catSvg: string }) {
  const microphone = useMicrophone();
  const [captionStatus, setCaptionStatus] = useState<CaptionStatus>("idle");
  const [caption, setCaption] = useState<string | null>(null);
  const [volume, setVolume] = useState(85);
  const [spatial, setSpatial] = useState(false);

  const micCopy = micHelp(microphone.state, microphone.failure);
  const isTalking = microphone.isTalking;
  const talkBlocked =
    microphone.state === "requesting" || microphone.state === "talking";
  const stopEnabled = microphone.state === "talking";

  async function handleTalk() {
    if (talkBlocked) {
      return;
    }

    const started = await microphone.startTalking();
    if (started) {
      setCaptionStatus("talking");
      setCaption(SAMPLE_LINE);
    }
  }

  function handleStop() {
    if (!stopEnabled) {
      return;
    }
    microphone.stopTalking();
    if (captionStatus === "talking") {
      setCaptionStatus("idle");
    }
  }

  function handleFailLine() {
    setCaptionStatus("error");
    setCaption(null);
  }

  function handleReset() {
    microphone.stopTalking();
    setCaptionStatus("idle");
    setCaption(null);
    setVolume(85);
    setSpatial(false);
  }

  const stageStatus = isTalking ? "Mochi is talking" : "Mochi is idle";
  const headerMic =
    microphone.state === "talking"
      ? "Capturando"
      : microphone.state === "requesting"
        ? "Pidiendo mic"
        : microphone.state === "ready"
          ? "Mic listo"
          : microphone.state === "denied"
            ? "Mic bloqueado"
            : microphone.state === "error"
              ? "Mic error"
              : "Mic en espera";

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-canvas px-5 pt-4 pb-6"
      data-mic-state={microphone.state}
      data-mic-capture={isTalking ? "on" : "off"}
      data-caption-status={captionStatus}
    >
      <header className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-[0_8px_16px_-6px_rgba(31,34,50,0.45)]">
          <PawPrint className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[1.15rem] leading-6 font-bold tracking-[-0.01em] text-ink">
            Kinetic Cat
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 font-heading text-[10px] font-bold tracking-[0.08em] text-online uppercase">
            <span className="size-1.5 rounded-full bg-online" aria-hidden />
            AI Assistant Online
          </p>
        </div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full text-ink"
          aria-label="Ajustes"
        >
          <SlidersHorizontal className="size-5" />
        </button>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border-2 border-ink text-ink"
          aria-label="Cuenta"
        >
          <UserRound className="size-5" />
        </button>
      </header>

      <div className="mt-5 flex justify-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-heading text-[10px] font-bold tracking-[0.08em] text-ink uppercase shadow-card">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isTalking ? "bg-coral" : "bg-ink-soft",
            )}
            aria-hidden
          />
          Kinetic Cat AI
          <span aria-hidden>•</span>
          <span>{headerMic}</span>
          {microphone.state === "denied" || microphone.state === "error" ? (
            <MicOff className="size-3.5 text-coral" aria-hidden />
          ) : (
            <AudioLines className="size-3.5 text-coral" aria-hidden />
          )}
        </p>
      </div>

      <p className="mx-auto mt-4 max-w-[20.5rem] rounded-[1.35rem] bg-white px-5 py-3 text-center font-body text-[15px] leading-6 text-ink shadow-card">
        {isTalking
          ? "¡Miau! Te escucho. Habla cuando quieras."
          : "¡Miau! Activa el micrófono para hablar conmigo."}
      </p>

      <div
        role="img"
        aria-label="2D cat avatar"
        data-talking={isTalking ? "true" : "false"}
        className="cat-cartoon mx-auto mt-2 h-44 w-36 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: catSvg }}
      />
      <p className="mt-1 text-center font-heading text-sm font-medium text-ink-soft">
        {stageStatus}
      </p>

      <section
        aria-label="Microphone"
        className="mt-3 rounded-[1.35rem] border border-line bg-white px-4 pt-4 pb-4 shadow-card"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="flex items-center gap-1.5 font-heading text-[11px] font-bold tracking-[0.04em] text-ink-soft uppercase">
            <Mic className="size-3.5 text-coral" aria-hidden />
            {micCopy.label}
          </p>
          <p className="font-body text-[11px] text-ink-soft">
            {isTalking ? "48kHz live" : "No capture"}
          </p>
        </div>

        <p
          className={cn(
            "mt-2 px-1 font-body text-[13px] leading-5",
            microphone.state === "denied" || microphone.state === "error"
              ? "text-[#93000a]"
              : "text-ink-soft",
          )}
        >
          {micCopy.detail}
        </p>

        <Waveform active={isTalking} />

        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => void handleTalk()}
            disabled={talkBlocked}
            aria-pressed={isTalking}
            data-testid="talk-button"
            className="inline-flex h-14 min-w-28 items-center justify-center gap-2 rounded-full bg-coral px-6 font-heading text-base font-bold text-white shadow-coral transition-transform enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mic className="size-5" aria-hidden />
            Talk
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!stopEnabled}
            data-testid="stop-button"
            className="inline-flex h-14 min-w-28 items-center justify-center gap-2 rounded-full border border-ink bg-white px-6 font-heading text-base font-bold text-ink transition-transform enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Square className="size-4 fill-current" aria-hidden />
            Stop
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={spatial}
            onClick={() => setSpatial((value) => !value)}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-3 font-heading text-[13px] font-semibold",
              spatial ? "bg-coral/10 text-coral" : "bg-chip text-ink-soft",
            )}
          >
            <AudioLines className="size-3.5" aria-hidden />
            Audio Espacial
          </button>
          <button
            type="button"
            onClick={handleFailLine}
            data-testid="simulate-miss"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-chip px-3 font-heading text-[13px] font-semibold text-ink-soft"
          >
            Simulate miss
          </button>
        </div>
      </section>

      <section
        aria-label="Volumen de voz"
        className="mt-3 rounded-[1.35rem] border border-line bg-white px-4 py-3.5 shadow-card"
      >
        <div className="flex items-center gap-2">
          <Volume2 className="size-4 text-coral" aria-hidden />
          <h2 className="font-heading text-[15px] font-bold tracking-[-0.01em] text-ink">
            Volumen de Voz
          </h2>
          <span className="ml-auto rounded-full bg-chip px-2 py-0.5 font-heading text-[10px] font-bold tracking-[0.04em] text-ink-soft uppercase">
            ANC Activo
          </span>
          <span className="font-heading text-sm font-bold text-coral">
            {volume}%
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Volume1 className="size-4 shrink-0 text-ink-soft" aria-hidden />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            aria-label="Volumen de voz"
            onChange={(event) => setVolume(Number(event.target.value))}
            className="voice-volume"
            style={{ ["--volume" as string]: `${volume}%` }}
          />
          <AudioLines className="size-4 shrink-0 text-ink-soft" aria-hidden />
        </div>
      </section>

      <section
        aria-live="polite"
        aria-label="Captions"
        className="mt-5 min-h-28 rounded-[1.25rem] border border-dashed border-line bg-white px-4 py-3.5 shadow-card"
      >
        <p className="mb-1 font-heading text-[10px] font-bold tracking-[0.08em] text-ink-soft uppercase">
          Captions
        </p>
        {captionStatus === "idle" && !caption ? (
          <p className="font-body text-sm leading-6 text-ink-soft">
            No line yet. Press Talk for a placeholder caption. Nothing is
            recorded or streamed from this screen.
          </p>
        ) : captionStatus === "error" ? (
          <p className="font-body text-sm leading-6 text-[#93000a]">
            Mochi didn’t get a line that time. Press Talk to try again — this
            stage has no live connection yet, so a miss is just a UI state.
          </p>
        ) : (
          <p className="font-body text-sm leading-6 text-ink">{caption}</p>
        )}
      </section>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-white px-2 font-heading text-[11px] font-semibold whitespace-nowrap text-ink shadow-card"
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          Reiniciar
        </button>
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div
      className="flex h-16 items-center justify-center gap-[3px]"
      aria-hidden
    >
      {WAVE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          data-paused={active ? undefined : "true"}
          className="mic-bar w-[3px] rounded-full bg-coral"
          style={{
            height,
            animationDelay: `${(index % 8) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
