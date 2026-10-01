import { readFile } from "node:fs/promises";
import path from "node:path";
import { TalkingCatStage } from "@/components/talking-cat-stage";

export default async function Home() {
  const catSvg = await readFile(
    path.join(process.cwd(), "public", "cat_cartoon.xml"),
    "utf8",
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border px-4 py-4 sm:px-8">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Virtual assistant
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
          Talking cat stage
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
          A first-slice desktop and phone layout for the 2D avatar. Talk is local
          UI only — no voice, LiveKit, or accounts yet.
        </p>
      </header>
      <main className="flex flex-1 justify-center px-4 py-8 sm:px-8 sm:py-12">
        <TalkingCatStage catSvg={catSvg} />
      </main>
    </div>
  );
}
