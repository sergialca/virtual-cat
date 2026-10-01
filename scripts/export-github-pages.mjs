import { spawn } from "node:child_process";
import { mkdtemp, rename } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src", "app", "api");
const stashRoot = await mkdtemp(path.join(os.tmpdir(), "virtual-cat-api-"));
const stashedApi = path.join(stashRoot, "api");

let moved = false;

async function restoreApi() {
  if (!moved) return;
  await rename(stashedApi, apiDir);
  moved = false;
}

try {
  await rename(apiDir, stashedApi);
  moved = true;
} catch (err) {
  if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
    moved = false;
  } else {
    throw err;
  }
}

const child = spawn("pnpm", ["exec", "next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    GITHUB_PAGES: "true",
    NEXT_PUBLIC_BASE_PATH: "/virtual-cat",
  },
});

const code = await new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", (status) => resolve(status ?? 1));
});

await restoreApi();

if (code !== 0) {
  process.exit(code);
}
