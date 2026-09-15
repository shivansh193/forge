import { AgentConfig, Provider } from "./types";
import { gemini } from "./providers/gemini";
import { openai } from "./providers/openai";
import { anthropic } from "./providers/anthropic";
import { ProviderClient } from "./providers/types";

const PROVIDERS: Record<Provider, ProviderClient> = { gemini, openai, anthropic };

export const PROVIDER_INFO = (Object.keys(PROVIDERS) as Provider[]).map((id) => ({
  id,
  label: PROVIDERS[id].label,
  defaultModel: PROVIDERS[id].defaultModel,
}));

export function defaultModelFor(provider: Provider): string {
  return PROVIDERS[provider]?.defaultModel ?? PROVIDERS.gemini.defaultModel;
}

// Only Gemini has a shared server-side demo key; other providers require BYOK.
export function hasServerFallback(provider: Provider): boolean {
  return provider === "gemini";
}

export function resolveApiKey(provider: Provider, clientKey: string | undefined): string {
  const trimmed = clientKey?.trim();
  if (trimmed) return trimmed;
  if (provider === "gemini") return process.env.GEMINI_API_KEY || "";
  return "";
}

export function missingKeyError(provider: Provider): string {
  if (provider === "gemini") {
    return "No API key configured. Add GEMINI_API_KEY on the server or paste your own key.";
  }
  const label = PROVIDER_INFO.find((p) => p.id === provider)?.label ?? provider;
  return `This agent uses ${label}, which needs your own API key — paste one in Config.`;
}

export async function runAgent(config: AgentConfig, userMessage: string, apiKey: string): Promise<string> {
  const provider = PROVIDERS[config.provider] ?? PROVIDERS.gemini;
  return provider.complete(config.prompt, userMessage, config.temperature, config.model, apiKey);
}

export async function generateTestPrompt(config: AgentConfig, apiKey: string): Promise<string> {
  const provider = PROVIDERS[config.provider] ?? PROVIDERS.gemini;
  const meta = `You are helping test an AI agent before it ships. Below is the agent's full configuration (its system prompt, which may include background/context it was given). Write ONE realistic message a real end user would send this agent — something that would genuinely exercise what the agent is designed to do. Return ONLY the message text, nothing else, no quotes, no preamble.\n\n--- AGENT CONFIG ---\n${config.prompt}`;
  const result = await provider.complete(
    "You write short, realistic test inputs for AI agents. Reply with only the test message itself.",
    meta,
    0.9,
    config.model,
    apiKey
  );
  return result.trim().replace(/^["']|["']$/g, "");
}
