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

Fill `.env` with LiveKit Cloud (or self-hosted) credentials and model provider keys.

## Run

```bash
source .venv/bin/activate
python main.py dev
```

Dispatch: agent joins rooms created when the web app mints a token. Without keys, the web app stays in **demo mode** (mic + mock replies).

## Mock / no keys

If `OPENAI_API_KEY` is unset, the agent exits with a clear message. Use LiveKit Inference or set OpenAI for the default pipeline plugins.
