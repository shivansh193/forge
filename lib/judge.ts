import { gemini } from "./providers/gemini";

export interface JudgeVerdict {
  same: boolean;
  reason: string;
}

// A cheap, fast Gemini model on near-zero temperature -- this call is a
// binary classifier, not a creative task, and we want consistent verdicts
// across repeated bisect/regression runs on the same pair of outputs rather
// than the model getting inventive about edge cases.
const JUDGE_MODEL = "gemini-flash-lite-latest";
const JUDGE_TEMPERATURE = 0;

const JUDGE_SYSTEM_PROMPT = `You are a behavioral regression classifier for an AI agent testing tool. You will be given a user message that was sent to an AI agent, and two responses (RESPONSE A and RESPONSE B) that two different versions of the agent produced for that same message.

Decide whether RESPONSE A and RESPONSE B represent the SAME underlying behavior and intent, or a MEANINGFULLY DIFFERENT one.

Ignore surface-level differences: wording, phrasing, tone, formatting, length, or word order do NOT count as a meaningful change on their own. Only classify as different if the substance changed -- a different answer, a different recommendation, a different refusal-vs-compliance decision, a different conclusion, or information added/dropped that would change what the user does next.

Respond with ONLY a JSON object and nothing else -- no markdown fences, no commentary:
{"same": true or false, "reason": "one short sentence explaining the verdict"}`;

// Strips common wrapping the model sometimes adds around JSON (markdown
// fences) before parsing. Throws if the result still isn't valid JSON of
// the expected shape -- callers treat that as a judge failure and fall back
// to the magnitude heuristic rather than trusting a malformed verdict.
function parseVerdict(raw: string): JudgeVerdict {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.same !== "boolean") {
    throw new Error("Judge response missing a boolean 'same' field.");
  }
  return { same: parsed.same, reason: typeof parsed.reason === "string" ? parsed.reason : "" };
}

// Server-side classification call -- always goes straight to Gemini
// regardless of the agent's own configured provider, so behavioral-diff
// judging works with just GEMINI_API_KEY and never requires an
// OpenAI/Anthropic key just to compare two outputs.
export async function judgeBehavior(
  input: string,
  outputA: string,
  outputB: string,
  apiKey: string
): Promise<JudgeVerdict> {
  const userText = `USER MESSAGE:\n${input}\n\nRESPONSE A:\n${outputA}\n\nRESPONSE B:\n${outputB}`;
  const raw = await gemini.complete(JUDGE_SYSTEM_PROMPT, userText, JUDGE_TEMPERATURE, JUDGE_MODEL, apiKey);
  return parseVerdict(raw);
}
