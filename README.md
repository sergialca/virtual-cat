# Virtual cat (Kinetic Cat)

2D talking-cat voice UI with **LiveKit Agents** for realtime speech (STT → LLM → TTS). The cat is drawn in the browser and animated from mic + agent state—not a vendor video avatar.

## Package manager

Use **pnpm only** (`packageManager` in `package.json`). Do not use npm or yarn.

```bash
corepack enable
pnpm install
cp .env.example .env   # optional — omit LiveKit keys for demo mode
pnpm dev
```

Open **http://127.0.0.1:43123**

### Demo mode

If `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are unset, the app runs in **demo mode**: Talk still requires the microphone; Stop triggers a mock transcript so you can test the cat UI without cloud keys.

### Live voice

Credentials come from the same LiveKit Cloud project as the deployed agent. Next.js reads them from `.env` or `.env.local` (local overrides `.env`) only when the dev server starts.

1. In [LiveKit Cloud → Settings → Keys](https://cloud.livekit.io), open the project and copy the WebSocket URL, API key, and API secret together. Or write them with the CLI: `lk app env -w`. See [Agent server startup](https://docs.livekit.io/agents/server/startup-modes/).
2. Put those three values in `.env`. The key and secret are a pair: a secret from another project, or a revoked key, makes `/api/livekit/token` succeed locally and then LiveKit reject the session with **invalid token**.
3. Set `LIVEKIT_AGENT_NAME` to the worker's dispatch name. That is `agent_name` on `@server.rtc_session()` (this repo's source uses `virtual-cat`). A Cloud agent created with `lk agent init` keeps the name you passed there; changing it means editing the agent and redeploying. See [Agent dispatch](https://docs.livekit.io/agents/server/agent-dispatch/).
4. Restart `pnpm dev`. The token route puts that name on `RoomConfiguration.agents`, so the named agent is dispatched when the browser creates the room. The header should show **Agente en vivo** once the worker joins.

`agent_name` turns off automatic dispatch. Renaming only `LIVEKIT_AGENT_NAME` does not fix an invalid key or secret.

### GitHub Pages

The static site is at [https://sergialca.github.io/virtual-cat/](https://sergialca.github.io/virtual-cat/). Push the branch, then publish with `pnpm pages-deploy`. That starts the GitHub Actions workflow. A normal push does not deploy. GitHub Pages cannot run `/api/livekit/token`, so that deployment stays in demo mode. Live voice still needs `pnpm dev` or another Node host that can keep the API secret on the server.

```bash
pnpm pages-deploy
```

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
