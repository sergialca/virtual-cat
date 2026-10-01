# Virtual cat (Kinetic Cat)

2D talking-cat voice UI with **LiveKit Agents** for realtime speech (STT → LLM → TTS). The cat is drawn in the browser and animated from mic + agent state—not a vendor video avatar.

## Package manager

Use **pnpm only** (`packageManager` in `package.json`). Do not use npm or yarn.

```bash
corepack enable
pnpm install
cp .env.example .env.local   # optional — omit LiveKit keys for demo mode
pnpm dev
```

Open **http://127.0.0.1:43123**

### Demo mode

If `LIVEKIT_*` env vars are unset, the app runs in **demo mode**: Talk still requires the microphone; Stop triggers a mock transcript so you can test the cat UI without cloud keys.

### Live voice

1. Add LiveKit credentials to `.env.local` (see `.env.example`).
2. Configure and run the Python agent in [`agent/`](agent/README.md).
3. Restart `pnpm dev`. The header should show live agent status when connected.

## Scripts

```bash
pnpm lint
pnpm build
pnpm start
```

## Architecture

- **Next.js** — cat stage, mic-gated Talk/Stop, captions, token route at `/api/livekit/token`
- **LiveKit room** — browser publishes mic; agent publishes audio + data (transcripts, `idle` / `listening` / `talking`)
- **Python agent** — `AgentSession` with OpenAI STT/LLM/TTS by default (swap plugins as needed)
