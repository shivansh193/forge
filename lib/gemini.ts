import { AgentConfig } from "./types";

const DEFAULT_MODEL = "gemini-flash-lite-latest";

function resolveModel(model: string): string {
  return model?.trim() ? model.trim() : DEFAULT_MODEL;
}

async function callGemini(
  systemInstruction: string,
  userText: string,
  temperature: number,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveModel(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { temperature },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text.");
  return text as string;
}

export async function runAgent(
  config: AgentConfig,
  userMessage: string,
  apiKey: string
): Promise<string> {
  return callGemini(config.prompt, userMessage, config.temperature, config.model, apiKey);
}

export async function generateTestPrompt(config: AgentConfig, apiKey: string): Promise<string> {
  const meta = `You are helping test an AI agent before it ships. Below is the agent's full configuration (its system prompt, which may include background/context it was given). Write ONE realistic message a real end user would send this agent — something that would genuinely exercise what the agent is designed to do. Return ONLY the message text, nothing else, no quotes, no preamble.\n\n--- AGENT CONFIG ---\n${config.prompt}`;
  const result = await callGemini(
    "You write short, realistic test inputs for AI agents. Reply with only the test message itself.",
    meta,
    0.9,
    config.model,
    apiKey
  );
  return result.trim().replace(/^["']|["']$/g, "");
}
