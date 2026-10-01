import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function liveKitConfigured() {
  return Boolean(
    process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET &&
      process.env.LIVEKIT_URL,
  );
}

export async function GET() {
  if (!liveKitConfigured()) {
    return NextResponse.json({
      configured: false,
      mock: true,
    });
  }

  const roomName = `mochi-${crypto.randomUUID().slice(0, 8)}`;
  const identity = `user-${crypto.randomUUID().slice(0, 8)}`;

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity,
      name: "You",
    },
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const jwt = await token.toJwt();

  return NextResponse.json({
    configured: true,
    mock: false,
    token: jwt,
    url: process.env.LIVEKIT_URL,
    roomName,
    identity,
  });
}
