import { ProviderClient } from "./types";
import { robustFetch, ProviderError } from "./request";

const DEFAULT_MODEL = "gpt-4o-mini";

async function complete(
  systemPrompt: string,
  userText: string,
  temperature: number,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await robustFetch("https://api.openai.com/v1/chat/completions", {
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
    throw new ProviderError(`OpenAI ${res.status}: ${body.slice(0, 300)}`, "http_error", res.status);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError("OpenAI returned no text.", "http_error");
  return text as string;
}

export const openai: ProviderClient = { label: "OpenAI", defaultModel: DEFAULT_MODEL, complete };
