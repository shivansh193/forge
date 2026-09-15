import { describe, it, expect } from "vitest";
import { withFreshIdIfColliding } from "../LocalImportBanner";
import { Agent } from "@/lib/types";

function makeAgent(id: string): Agent {
  return {
    id,
    name: "Test",
    avatarSeed: id,
    createdAt: new Date().toISOString(),
    commits: [
      {
        id: `${id}-c0`,
        timestamp: new Date().toISOString(),
        message: "Initial version",
        config: { provider: "gemini", prompt: "hi", temperature: 0.5, model: "x" },
        promptDiffFromPrev: null,
        status: "finalized",
        demo: null,
      },
    ],
    chatHistory: [],
    pinnedTests: [],
  };
}

describe("withFreshIdIfColliding", () => {
  it("leaves the agent untouched when its id doesn't collide", () => {
    const agent = makeAgent("resume-builder");
    const result = withFreshIdIfColliding(agent, new Set(["code-reviewer"]));
    expect(result).toBe(agent);
  });

  it("assigns a new id, avatarSeed, and re-keyed commit ids on collision", () => {
    const agent = makeAgent("resume-builder");
    const result = withFreshIdIfColliding(agent, new Set(["resume-builder"]));

    expect(result.id).not.toBe("resume-builder");
    expect(result.avatarSeed).toBe(result.id);
    expect(result.commits[0].id).toBe(`${result.id}-c0`);
  });

  it("preserves everything else about the agent on collision", () => {
    const agent = makeAgent("resume-builder");
    const result = withFreshIdIfColliding(agent, new Set(["resume-builder"]));

    expect(result.name).toBe(agent.name);
    expect(result.commits[0].config).toEqual(agent.commits[0].config);
  });
});
