import { Agent, AgentConfig } from "./types";

export function newAgentId(): string {
  return `agent-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newTestId(): string {
  return `test-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function blankConfig(): AgentConfig {
  return { provider: "gemini", prompt: "", temperature: 0.7, model: "gemini-flash-lite-latest" };
}

export function createAgentRecord(
  name: string,
  config: AgentConfig,
  commitMessage: string,
  forkedFrom?: string
): Agent {
  const id = newAgentId();
  const now = new Date().toISOString();
  return {
    id,
    name,
    avatarSeed: id,
    createdAt: now,
    commits: [
      {
        id: `${id}-c0`,
        timestamp: now,
        message: commitMessage,
        config,
        promptDiffFromPrev: null,
        status: "finalized",
        demo: null,
      },
    ],
    chatHistory: [],
    pinnedTests: [],
    forkedFrom,
  };
}
