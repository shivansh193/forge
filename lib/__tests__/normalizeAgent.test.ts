import { describe, it, expect } from "vitest";
import { normalizeAgent } from "../normalizeAgent";
import { Agent } from "../types";

function makeAgentWithConfig(config: Record<string, unknown>): Agent {
  return {
    id: "agent-1",
    name: "Test",
    avatarSeed: "agent-1",
    createdAt: new Date().toISOString(),
    commits: [
      {
        id: "agent-1-c0",
        timestamp: new Date().toISOString(),
        message: "Initial version",
        // Deliberately cast — simulating old data saved before `provider` existed.
        config: config as never,
        promptDiffFromPrev: null,
        status: "finalized",
        demo: null,
      },
    ],
    chatHistory: [],
    pinnedTests: [],
  };
}

describe("normalizeAgent", () => {
  it("backfills a missing provider field to gemini", () => {
    const agent = makeAgentWithConfig({ prompt: "hi", temperature: 0.5, model: "x" });
    const normalized = normalizeAgent(agent);
    expect(normalized.commits[0].config.provider).toBe("gemini");
  });

  it("leaves an existing provider field untouched", () => {
    const agent = makeAgentWithConfig({ prompt: "hi", temperature: 0.5, model: "x", provider: "openai" });
    const normalized = normalizeAgent(agent);
    expect(normalized.commits[0].config.provider).toBe("openai");
  });

  it("normalizes every commit, not just the first", () => {
    const agent = makeAgentWithConfig({ prompt: "hi", temperature: 0.5, model: "x" });
    agent.commits.push({
      id: "agent-1-c1",
      timestamp: new Date().toISOString(),
      message: "second",
      config: { prompt: "hi 2", temperature: 0.6, model: "x" } as never,
      promptDiffFromPrev: null,
      status: "finalized",
      demo: null,
    });
    const normalized = normalizeAgent(agent);
    expect(normalized.commits.every((c) => c.config.provider === "gemini")).toBe(true);
  });

  it("does not mutate the original agent object", () => {
    const agent = makeAgentWithConfig({ prompt: "hi", temperature: 0.5, model: "x" });
    normalizeAgent(agent);
    expect(agent.commits[0].config).not.toHaveProperty("provider");
  });
});
