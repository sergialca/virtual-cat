# Virtual cat LiveKit agent

Python `AgentSession` (STT → LLM → TTS) for the browser cat UI. Publishes transcripts and animation state on the LiveKit data channel.

## Setup

```bash
cd agent
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
```

Fill `.env` with the same LiveKit Cloud project URL, API key, and API secret as the web app (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`). The CLI can write them: `lk app env -w`. See [Agent server startup](https://docs.livekit.io/agents/server/startup-modes/).

## Run

```bash
source .venv/bin/activate
python main.py dev
```

## Dispatch name

`agent/main.py` registers the worker with `agent_name="virtual-cat"`. That string is the dispatch name, not the name shown in the room. With `agent_name` set, LiveKit assigns this worker only when something dispatches it explicitly. See [Agent dispatch](https://docs.livekit.io/agents/server/agent-dispatch/).

The web app does that in `/api/livekit/token` by adding `RoomAgentDispatch` to the participant token. `LIVEKIT_AGENT_NAME` in the web `.env` must match this `agent_name` exactly. Dispatch from the token runs only when the room is created, so each Talk session uses a new room name.

If the Cloud deployment was scaffolded with `lk agent init` under a different name (for example `cat-1388`), either set `LIVEKIT_AGENT_NAME` to that name or change `@server.rtc_session(agent_name=...)` and redeploy. Editing the env var does not rename an already deployed worker.

## Mock / no keys

If `OPENAI_API_KEY` is unset, the agent exits with a clear message. Use LiveKit Inference or set OpenAI for the default pipeline plugins.
