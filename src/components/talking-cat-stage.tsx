"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CaptionStatus = "idle" | "talking" | "error";

const SAMPLE_LINE =
  "Hey — I’m the stand-in cat. Real voice and animation aren’t wired yet, so this is just a placeholder line.";

export function TalkingCatStage({ catSvg }: { catSvg: string }) {
  const [status, setStatus] = useState<CaptionStatus>("idle");
  const [caption, setCaption] = useState<string | null>(null);

  function handleTalk() {
    if (status === "talking") {
      setStatus("idle");
      return;
    }

    setStatus("talking");
    setCaption(SAMPLE_LINE);
  }

  function handleFailLine() {
    setStatus("error");
    setCaption(null);
  }

  const isTalking = status === "talking";

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section
        aria-label="Avatar stage"
        className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 shadow-sm"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.03_85),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-4">
          <CartoonCat svg={catSvg} talking={isTalking} />
          <p className="text-sm font-medium text-muted-foreground">
            {isTalking ? "Mochi is talking" : "Mochi is idle"}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="lg"
          variant={isTalking ? "secondary" : "default"}
          onClick={handleTalk}
          aria-pressed={isTalking}
        >
          {isTalking ? "Stop" : "Talk"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleFailLine}
        >
          Simulate miss
        </Button>
      </div>

      <section
        aria-live="polite"
        aria-label="Captions"
        className="min-h-28 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3"
      >
        <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Captions
        </p>
        {status === "idle" && !caption ? (
          <p className="text-sm text-muted-foreground">
            No line yet. Press Talk for a placeholder caption. Nothing is
            recorded or streamed from this screen.
          </p>
        ) : status === "error" ? (
          <p className="text-sm text-destructive">
            Mochi didn’t get a line that time. Press Talk to try again — this
            stage has no live connection yet, so a miss is just a UI state.
          </p>
        ) : (
          <p className="text-sm leading-6 text-foreground">{caption}</p>
        )}
      </section>
    </div>
  );
}

function CartoonCat({ svg, talking }: { svg: string; talking: boolean }) {
  return (
    <div
      role="img"
      aria-label="2D cat avatar"
      data-talking={talking ? "true" : "false"}
      className="cat-cartoon h-56 w-48 [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
