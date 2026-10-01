export type MicState =
  | "idle"
  | "requesting"
  | "ready"
  | "talking"
  | "denied"
  | "error";

export type MicFailure = "denied" | "missing" | "error";

export function classifyGetUserMediaError(error: unknown): MicFailure {
  const name =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";

  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  ) {
    return "denied";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "missing";
  }

  return "error";
}

export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export async function readMicrophonePermission(): Promise<
  PermissionState | "unsupported"
> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state;
  } catch {
    return "unsupported";
  }
}
