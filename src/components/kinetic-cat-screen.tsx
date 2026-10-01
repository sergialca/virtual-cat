"use client";

import { useMemo, useState } from "react";
import {
  AudioLines,
  Copy,
  Download,
  Languages,
  Mic,
  MicOff,
  PawPrint,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
  Volume1,
  Volume2,
} from "lucide-react";
import { cn } from "cn";
import { useMicrophone, type MicState } from "@/hooks/use-microphone";
import { useVoiceCatSession } from "@/hooks/use-voice-cat-session";

const WAVE_HEIGHTS = [
  10, 16, 26, 18, 34, 22, 40, 28, 16, 36, 24, 42, 18, 32, 14, 28, 38, 20, 30,
  16,
];

function micStatusLabel(state: MicState): string {
  switch (state) {
    case "idle":
      return "Micrófono inactivo";
    case "requesting":
      return "Pidiendo permiso…";
    case "ready":
      return "Micrófono listo";
    case "talking":
      return "Escuchando";
    case "denied":
      return "Micrófono bloqueado";
    case "error":
      return "Error de micrófono";
    default:
      return "Micrófono";
  }
}

export function KineticCatScreen({ catSvg }: { catSvg: string }) {
  const [volume, setVolume] = useState(85);
  const [spatial, setSpatial] = useState(false);
  const [copied, setCopied] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const {
    micState,
    errorMessage: micError,
    startTalking,
    stopTalking,
    resetMic,
  } = useMicrophone({ onLevel: setMicLevel });

  const {
    mode,
    catState,
    transcripts,
    livePartial,
    sessionError,
    onTalkStart,
    onTalkStop,
    resetSession,
  } = useVoiceCatSession();

  const isTalking = micState === "talking";
  const catAnimating = catState === "listening" || catState === "talking";

  const transcriptText = useMemo(() => {
    const lines = transcripts.filter((t) => t.final).map((t) => t.text);
    if (livePartial) lines.push(livePartial);
    return lines.join("\n");
  }, [transcripts, livePartial]);

  const lastUser = [...transcripts].reverse().find((t) => t.role === "user" && t.final);
  const lastAssistant = [...transcripts]
    .reverse()
    .find((t) => t.role === "assistant" && t.final);

  const statusLine =
    mode === "mock"
      ? "Modo demo — conecta LiveKit para voz real"
      : mode === "livekit"
        ? "Agente en vivo"
        : mode === "error"
          ? "Sin conexión al agente"
          : "Conectando…";

  const greeting =
    micState === "denied" || micState === "error"
      ? micError ?? "No pude usar el micrófono."
      : isTalking
        ? "Te escucho… suelta Stop cuando termines."
        : "¡Miau! Pulsa Talk y permite el micrófono para hablar conmigo.";

  async function handleTalkToggle() {
    if (isTalking) {
      stopTalking();
      await onTalkStop();
      return;
    }
    const stream = await startTalking();
    if (stream) {
      await onTalkStart(stream);
    }
  }

  async function handleCopy() {
    if (!transcriptText) return;
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function handleExport() {
    if (!transcriptText) return;
    const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transcripcion-kinetic-cat.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    stopTalking();
    resetMic();
    resetSession();
    setVolume(85);
    setSpatial(false);
    setCopied(false);
    setMicLevel(0);
  }

  const talkDisabled = micState === "requesting";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-canvas px-5 pt-4 pb-6">
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
            {statusLine}
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
              isTalking ? "bg-coral animate-pulse" : "bg-ink-soft",
            )}
            aria-hidden
          />
          Kinetic Cat AI
          <span aria-hidden>•</span>
          <span>{micStatusLabel(micState)}</span>
          <AudioLines className="size-3.5 text-coral" aria-hidden />
        </p>
      </div>

      <p
        className={cn(
          "mx-auto mt-4 max-w-[20.5rem] rounded-[1.35rem] bg-white px-5 py-3 text-center font-body text-[15px] leading-6 shadow-card",
          micState === "denied" || micState === "error"
            ? "text-coral"
            : "text-ink",
        )}
        role="status"
      >
        {greeting}
      </p>

      {sessionError ? (
        <p className="mt-2 text-center font-body text-[13px] text-coral" role="alert">
          {sessionError}
        </p>
      ) : null}

      <div
        role="img"
        aria-label="Avatar del gato Kinetic Cat"
        data-talking={catAnimating ? "true" : "false"}
        className="cat-cartoon mx-auto mt-2 h-44 w-36 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: catSvg }}
      />

      <section
        aria-label="Entrada de micrófono"
        className="rounded-[1.35rem] border border-line bg-white px-4 pt-4 pb-4 shadow-card"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="flex items-center gap-1.5 font-heading text-[11px] font-bold tracking-[0.04em] text-ink-soft uppercase">
            <Mic className="size-3.5 text-coral" aria-hidden />
            HD Mic Input
          </p>
          <p className="font-body text-[11px] text-ink-soft">
            {isTalking ? `${micLevel}% nivel` : "Pulsa Talk para habilitar"}
          </p>
        </div>

        <Waveform active={isTalking} />

        <div className="flex justify-center">
          <button
            type="button"
            disabled={talkDisabled}
            onClick={() => void handleTalkToggle()}
            aria-pressed={isTalking}
            className={cn(
              "inline-flex h-14 min-w-40 items-center justify-center gap-2 rounded-full px-8 font-heading text-base font-bold text-white shadow-coral transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
              isTalking ? "bg-ink" : "bg-coral",
            )}
          >
            {micState === "requesting" ? (
              <>
                <Mic className="size-5 animate-pulse" aria-hidden />
                Permiso…
              </>
            ) : isTalking ? (
              <>
                <MicOff className="size-5" aria-hidden />
                Stop
              </>
            ) : (
              <>
                <Mic className="size-5" aria-hidden />
                Talk
              </>
            )}
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
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-chip px-3 font-heading text-[13px] font-semibold text-ink-soft"
          >
            <Languages className="size-3.5" aria-hidden />
            Español (LatAm)
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

      <section aria-label="Transcripción en vivo" className="mt-5">
        <div className="flex items-center gap-2 px-0.5">
          <AudioLines className="size-4 text-coral" aria-hidden />
          <h2 className="font-heading text-[1.15rem] font-bold tracking-[-0.01em] text-ink">
            Transcripción en Vivo
          </h2>
          <span className="ml-auto font-heading text-[10px] font-bold tracking-[0.08em] text-ink-soft uppercase">
            {mode === "livekit" ? "En vivo" : "Demo"}
          </span>
        </div>

        {!lastUser && !lastAssistant && !livePartial ? (
          <div className="mt-3 rounded-[1.25rem] border border-dashed border-line bg-white px-4 py-6 text-center shadow-card">
            <p className="font-body text-[15px] leading-6 text-ink-soft">
              Aún no hay transcripción. Habla con Talk y verás tus mensajes aquí.
            </p>
          </div>
        ) : null}

        {lastUser ? (
          <>
            <div className="mt-3 rounded-[1.25rem] bg-ink px-4 py-3.5 text-white shadow-card">
              <p className="font-body text-[15px] leading-6">{lastUser.text}</p>
            </div>
            <p className="mt-2 text-center font-body text-[11px] text-ink-soft">
              <Mic className="mr-1 inline size-3 align-[-1px]" aria-hidden />
              Grabado por voz
            </p>
          </>
        ) : null}

        {lastAssistant ? (
          <>
            <div className="mt-3 flex items-start gap-2">
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-coral text-white">
                <PawPrint className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 rounded-[1.25rem] border border-line bg-white px-3.5 py-2.5 shadow-card">
                <p className="font-heading text-[13px] font-bold text-ink">
                  Dada
                </p>
                <p className="mt-0.5 font-body text-[15px] leading-6 text-ink">
                  {lastAssistant.text}
                </p>
              </div>
            </div>
            <p className="mt-2 pl-10 font-body text-[11px] text-ink-soft">
              Sintetizado por audio neural
            </p>
          </>
        ) : null}

        {livePartial ? (
          <div className="mt-3 rounded-[1.25rem] border border-line bg-white px-4 py-3 shadow-card">
            <p className="flex items-center gap-2 font-heading text-[10px] font-bold tracking-[0.08em] text-coral uppercase">
              <span
                className="size-1.5 animate-pulse rounded-full bg-coral"
                aria-hidden
              />
              Transcribiendo...
            </p>
            <p className="mt-1.5 font-body text-[15px] leading-6 text-ink">
              “{livePartial}”
            </p>
          </div>
        ) : null}
      </section>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!transcriptText}
          onClick={() => void handleCopy()}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-white px-2 font-heading text-[11px] font-semibold whitespace-nowrap text-ink shadow-card disabled:opacity-50"
        >
          <Copy className="size-3.5 shrink-0" aria-hidden />
          {copied ? "Copiado" : "Copiar texto"}
        </button>
        <button
          type="button"
          disabled={!transcriptText}
          onClick={handleExport}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-white px-2 font-heading text-[11px] font-semibold whitespace-nowrap text-ink shadow-card disabled:opacity-50"
        >
          <Download className="size-3.5 shrink-0" aria-hidden />
          Exportar audio
        </button>
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
