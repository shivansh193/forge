import { AgentConfig } from "./types";

export interface SharedSnapshot {
  name: string;
  config: AgentConfig;
}

export function encodeShare(snapshot: SharedSnapshot): string {
  return encodeURIComponent(JSON.stringify(snapshot));
}

export function decodeShare(param: string): SharedSnapshot | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(param));
    if (
      typeof parsed?.name === "string" &&
      typeof parsed?.config?.prompt === "string" &&
      typeof parsed?.config?.temperature === "number" &&
      typeof parsed?.config?.model === "string"
    ) {
      return {
        name: parsed.name,
        config: {
          provider: parsed.config.provider ?? "gemini",
          prompt: parsed.config.prompt,
          temperature: parsed.config.temperature,
          model: parsed.config.model,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}
