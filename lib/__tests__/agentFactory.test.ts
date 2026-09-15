import { describe, it, expect } from "vitest";
import { newAgentId, blankConfig, createAgentRecord } from "../agentFactory";

describe("newAgentId", () => {
  it("produces unique ids across calls", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newAgentId()));
    expect(ids.size).toBe(50);
  });

  it("always starts with the agent- prefix", () => {
    expect(newAgentId().startsWith("agent-")).toBe(true);
  });
});

describe("blankConfig", () => {
  it("defaults to gemini with an empty prompt", () => {
    const config = blankConfig();
    expect(config.provider).toBe("gemini");
    expect(config.prompt).toBe("");
    expect(config.model).toBe("gemini-flash-lite-latest");
  });
});

describe("createAgentRecord", () => {
  it("creates exactly one finalized initial commit carrying the given config", () => {
    const config = blankConfig();
    const agent = createAgentRecord("My Agent", config, "Initial version");

    expect(agent.name).toBe("My Agent");
    expect(agent.commits).toHaveLength(1);
    expect(agent.commits[0].status).toBe("finalized");
    expect(agent.commits[0].message).toBe("Initial version");
    expect(agent.commits[0].config).toEqual(config);
    expect(agent.commits[0].promptDiffFromPrev).toBeNull();
    expect(agent.chatHistory).toEqual([]);
  });

  it("derives the avatar seed and commit id from the agent's own id", () => {
    const agent = createAgentRecord("X", blankConfig(), "Initial version");
    expect(agent.avatarSeed).toBe(agent.id);
    expect(agent.commits[0].id).toBe(`${agent.id}-c0`);
  });

  it("produces a valid ISO timestamp for createdAt", () => {
    const agent = createAgentRecord("X", blankConfig(), "Initial version");
    expect(() => new Date(agent.createdAt).toISOString()).not.toThrow();
  });
});
