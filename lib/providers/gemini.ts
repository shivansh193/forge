import { ProviderClient } from "./types";
import { robustFetch, ProviderError } from "./request";

const DEFAULT_MODEL = "gemini-flash-lite-latest";

async function complete(
  systemPrompt: string,
  userText: string,
  temperature: number,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await robustFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model?.trim() || DEFAULT_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { temperature },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new ProviderError(`Gemini ${res.status}: ${body.slice(0, 300)}`, "http_error", res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderError("Gemini returned no text.", "http_error");
  return text as string;
}

export const gemini: ProviderClient = { label: "Gemini", defaultModel: DEFAULT_MODEL, complete };
