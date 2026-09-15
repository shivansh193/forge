import { ProviderClient } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

async function complete(
  systemPrompt: string,
  userText: string,
  temperature: number,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model?.trim() || DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no text.");
  return text as string;
}

export const openai: ProviderClient = { label: "OpenAI", defaultModel: DEFAULT_MODEL, complete };
