import { readFile } from "node:fs/promises";
import path from "node:path";
import { KineticCatScreen } from "@/components/kinetic-cat-screen";

export default async function Home() {
  const catSvg = await readFile(
    path.join(process.cwd(), "public", "cat_cartoon.xml"),
    "utf8",
  );

  return <KineticCatScreen catSvg={catSvg} />;
}
