"use client";

import { useState } from "react";
import {
  AudioLines,
  Copy,
  Download,
  Languages,
  Mic,
  PawPrint,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
  Volume1,
  Volume2,
} from "lucide-react";
import { cn } from "cn";

const WAVE_HEIGHTS = [
  10, 16, 26, 18, 34, 22, 40, 28, 16, 36, 24, 42, 18, 32, 14, 28, 38, 20, 30,
  16,
];

const USER_LINE =
  "Hola Dada, ¿puedes resumirme una noticia interesante?";
const ASSISTANT_LINE = "¡Claro que sí! ...";
const LIVE_LINE = "Explícame como se hundió el Titanic";

export function KineticCatScreen({ catSvg }: { catSvg: string }) {
  const [listening, setListening] = useState(true);
  const [volume, setVolume] = useState(85);
  const [spatial, setSpatial] = useState(false);
  const [copied, setCopied] = useState(false);

  const transcript = [USER_LINE, ASSISTANT_LINE, LIVE_LINE].join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function handleExport() {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transcripcion-kinetic-cat.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setListening(true);
    setVolume(85);
    setSpatial(false);
    setCopied(false);
  }

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
          <span className="size-1.5 rounded-full bg-coral" aria-hidden />
          Kinetic Cat AI
          <span aria-hidden>•</span>
          <span>{listening ? "Escuchando" : "En pausa"}</span>
          <AudioLines className="size-3.5 text-coral" aria-hidden />
        </p>
      </div>

      <p className="mx-auto mt-4 max-w-[20.5rem] rounded-[1.35rem] bg-white px-5 py-3 text-center font-body text-[15px] leading-6 text-ink shadow-card">
        ¡Miau! Te escucho perfectamente. Dime
        <br />
        qué transacción auditamos hoy.
      </p>

      <div
        role="img"
        aria-label="Avatar del gato Kinetic Cat"
        data-talking={listening ? "true" : "false"}
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
          <p className="font-body text-[11px] text-ink-soft">-18 dB • 48kHz</p>
        </div>

        <Waveform active={listening} />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setListening((value) => !value)}
            aria-pressed={listening}
            className="inline-flex h-14 min-w-40 items-center justify-center gap-2 rounded-full bg-coral px-8 font-heading text-base font-bold text-white shadow-coral transition-transform hover:-translate-y-px"
          >
            <Mic className="size-5" aria-hidden />
            Talk
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
            Cifrado E2E
          </span>
        </div>

        <div className="mt-3 rounded-[1.25rem] bg-ink px-4 py-3.5 text-white shadow-card">
          <p className="font-body text-[15px] leading-6">{USER_LINE}</p>
        </div>
        <p className="mt-2 text-center font-body text-[11px] text-ink-soft">
          <Mic className="mr-1 inline size-3 align-[-1px]" aria-hidden />
          Grabado por voz • 10:42 AM
        </p>

        <div className="mt-3 flex items-start gap-2">
          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-coral text-white">
            <PawPrint className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 rounded-[1.25rem] border border-line bg-white px-3.5 py-2.5 shadow-card">
            <p className="font-heading text-[13px] font-bold text-ink">
              Dada{" "}
              <span className="font-body text-[11px] font-normal text-ink-soft">
                • 1.4ms
              </span>
            </p>
            <p className="mt-0.5 font-body text-[15px] leading-6 text-ink">
              {ASSISTANT_LINE}
            </p>
          </div>
        </div>
        <p className="mt-2 pl-10 font-body text-[11px] text-ink-soft">
          Sintetizado por audio neural
        </p>

        <div className="mt-3 rounded-[1.25rem] border border-line bg-white px-4 py-3 shadow-card">
          <p className="flex items-center gap-2 font-heading text-[10px] font-bold tracking-[0.08em] text-coral uppercase">
            <span
              className="size-1.5 animate-pulse rounded-full bg-coral"
              aria-hidden
            />
            Transcribiendo...
          </p>
          <p className="mt-1.5 font-body text-[15px] leading-6 text-ink">
            “{LIVE_LINE}”
          </p>
        </div>
      </section>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-white px-2 font-heading text-[11px] font-semibold whitespace-nowrap text-ink shadow-card"
        >
          <Copy className="size-3.5 shrink-0" aria-hidden />
          {copied ? "Copiado" : "Copiar texto"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-white px-2 font-heading text-[11px] font-semibold whitespace-nowrap text-ink shadow-card"
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
