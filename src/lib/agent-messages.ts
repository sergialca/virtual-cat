export type CatAnimationState = "idle" | "listening" | "talking";

export type TranscriptEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
  at: number;
};

export type AgentDataMessage =
  | { type: "state"; value: CatAnimationState }
  | {
      type: "transcript";
      role: "user" | "assistant";
      text: string;
      final: boolean;
    };

export function parseAgentData(payload: Uint8Array): AgentDataMessage | null {
  try {
    const raw = new TextDecoder().decode(payload);
    const parsed = JSON.parse(raw) as AgentDataMessage;
    if (parsed.type === "state" || parsed.type === "transcript") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeAgentData(message: AgentDataMessage): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(message));
}
