import type { JudgeVerdict } from "./judge";
import { AgentConfig } from "./types";

export type { JudgeVerdict };

// Fallback threshold used ONLY when the judge call itself fails (network,
// rate limit, no key available) -- not the primary "changed" signal under
// normal operation. See lib/judge.ts for why raw character-diff magnitude
// alone can't reliably answer "did the behavior change": a one-word
// negation flip can score low while reversing intent, and a full paraphrase
// can score high while meaning the same thing. The judge exists to close
// that gap; this threshold is just a safety net so a flaky judge call
// degrades to the old heuristic instead of losing the result.
export const JUDGE_FALLBACK_THRESHOLD = 0.15;

// Client-side wrapper, mirrors lib/behavioral.ts's runBehavioral -- routes
// through /api/chat's sibling /api/judge so the server can resolve
// GEMINI_API_KEY the same way it does for every other provider call.
export async function runJudge(
  input: string,
  outputA: string,
  outputB: string,
  apiKey: string
): Promise<JudgeVerdict> {
  const res = await fetch("/api/judge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, outputA, outputB, apiKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Judge request failed.");
  return data as JudgeVerdict;
}

// The judge always calls Gemini directly, regardless of what provider the
// agent under test uses. Only forward the user's pasted BYOK key when at
// least one of the configs being compared is itself a Gemini config --
// otherwise it's an OpenAI/Anthropic key, and forwarding it would shadow a
// perfectly good server-side GEMINI_API_KEY (resolveApiKey prefers a
// client-supplied key over the env fallback, so a wrong key here would
// break the judge for every non-Gemini agent even when the server could
// have handled it).
export function geminiKeyFor(configs: AgentConfig[], byokKey: string): string {
  return configs.some((c) => c.provider === "gemini") ? byokKey : "";
}
