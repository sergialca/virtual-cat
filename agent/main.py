import asyncio
import json
import os
import sys

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, cli
from livekit.plugins import openai, silero

load_dotenv()

DATA_TOPIC = "cat-ui"


async def publish(room: rtc.Room, payload: dict) -> None:
    data = json.dumps(payload).encode("utf-8")
    await room.local_participant.publish_data(
        data, reliable=True, topic=DATA_TOPIC
    )


class CatAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are Dada, a friendly 2D cartoon cat voice assistant. "
                "Reply in concise, warm Spanish unless the user speaks English. "
                "Occasionally use playful cat interjections like miau. "
                "Keep answers short enough to speak aloud comfortably."
            ),
        )


server = AgentServer()


@server.rtc_session(agent_name="virtual-cat")
async def entrypoint(ctx: JobContext) -> None:
    if not os.getenv("OPENAI_API_KEY"):
        print(
            "OPENAI_API_KEY is not set. Configure agent/.env or use LiveKit Inference plugins.",
            file=sys.stderr,
        )
        return

    await ctx.connect()

    session = AgentSession(
        stt=openai.STT(),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="nova"),
        vad=silero.VAD.load(),
    )

    def emit(payload: dict) -> None:
        asyncio.create_task(publish(ctx.room, payload))

    @session.on("user_input_transcribed")
    def _on_user_transcript(ev) -> None:
        emit(
            {
                "type": "transcript",
                "role": "user",
                "text": ev.transcript,
                "final": ev.is_final,
            },
        )
        if ev.is_final:
            emit({"type": "state", "value": "listening"})

    @session.on("agent_speech_started")
    def _on_agent_speech_started(_ev) -> None:
        emit({"type": "state", "value": "talking"})

    @session.on("agent_speech_stopped")
    def _on_agent_speech_stopped(_ev) -> None:
        emit({"type": "state", "value": "idle"})

    @session.on("conversation_item_added")
    def _on_conversation_item(ev) -> None:
        item = ev.item
        if getattr(item, "role", None) != "assistant":
            return
        text = getattr(item, "text_content", None) or ""
        if not text:
            return
        emit(
            {
                "type": "transcript",
                "role": "assistant",
                "text": text,
                "final": True,
            },
        )

    emit({"type": "state", "value": "idle"})
    await session.start(agent=CatAssistant(), room=ctx.room)


def run() -> None:
    cli.run_app(server)


if __name__ == "__main__":
    run()
