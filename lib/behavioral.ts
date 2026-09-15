import { AgentConfig } from "./types";

// Client-side helper for running a message against a specific agent config
// via the existing /api/chat route. Shared by behavioral diff, pinned
// regression tests, bisect, and fork compare — every feature that needs to
// ask "what does this config actually produce for this input."
export async function runBehavioral(
  config: AgentConfig,
  message: string,
  apiKey: string
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, message, apiKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data.response as string;
}
