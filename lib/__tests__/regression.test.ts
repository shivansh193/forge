import { describe, it, expect, vi } from "vitest";
import { runRegressionSuite } from "../regression";
import { AgentConfig, PinnedTest } from "../types";

vi.mock("../behavioral", () => ({
  runBehavioral: vi.fn(),
}));

import { runBehavioral } from "../behavioral";

const prevConfig: AgentConfig = { provider: "gemini", prompt: "old prompt", temperature: 0.5, model: "x" };
const newConfig: AgentConfig = { provider: "gemini", prompt: "new prompt", temperature: 0.5, model: "x" };

function test(input: string): PinnedTest {
  return { id: `t-${input}`, label: input, input };
}

describe("runRegressionSuite", () => {
  it("flags a test as changed when outputs diverge significantly", async () => {
    vi.mocked(runBehavioral).mockImplementation(async (config) =>
      config === prevConfig ? "The weather is sunny today." : "I cannot help with that request."
    );

    const results = await runRegressionSuite([test("weather")], prevConfig, newConfig, "key");

    expect(results).toHaveLength(1);
    expect(results[0].changed).toBe(true);
    expect(results[0].error).toBeNull();
  });

  it("does not flag a test when outputs are effectively the same", async () => {
    vi.mocked(runBehavioral).mockResolvedValue("The weather is sunny today.");

    const results = await runRegressionSuite([test("weather")], prevConfig, newConfig, "key");

    expect(results[0].changed).toBe(false);
  });

  it("captures a per-test error without throwing, and does not flag it as changed", async () => {
    vi.mocked(runBehavioral).mockRejectedValue(new Error("rate limited"));

    const results = await runRegressionSuite([test("weather")], prevConfig, newConfig, "key");

    expect(results[0].error).toBe("rate limited");
    expect(results[0].changed).toBe(false);
    expect(results[0].prevOutput).toBeNull();
    expect(results[0].newOutput).toBeNull();
  });

  it("runs every pinned test independently", async () => {
    vi.mocked(runBehavioral).mockResolvedValue("same output");

    const results = await runRegressionSuite(
      [test("a"), test("b"), test("c")],
      prevConfig,
      newConfig,
      "key"
    );

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.label)).toEqual(["a", "b", "c"]);
  });
});
