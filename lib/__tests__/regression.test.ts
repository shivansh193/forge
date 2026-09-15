import { describe, it, expect, vi, beforeEach } from "vitest";
import { runRegressionSuite } from "../regression";
import { AgentConfig, PinnedTest } from "../types";

vi.mock("../behavioral", () => ({
  runBehavioral: vi.fn(),
}));

vi.mock("../judgeClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../judgeClient")>();
  return { ...actual, runJudge: vi.fn() };
});

import { runBehavioral } from "../behavioral";
import { runJudge } from "../judgeClient";

const prevConfig: AgentConfig = { provider: "gemini", prompt: "old prompt", temperature: 0.5, model: "x" };
const newConfig: AgentConfig = { provider: "gemini", prompt: "new prompt", temperature: 0.5, model: "x" };

function test(input: string): PinnedTest {
  return { id: `t-${input}`, label: input, input };
}

describe("runRegressionSuite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flags a test as changed when the judge finds a meaningful difference", async () => {
    vi.mocked(runBehavioral).mockImplementation(async (config) =>
      config === prevConfig ? "The weather is sunny today." : "I cannot help with that request."
    );
    vi.mocked(runJudge).mockResolvedValue({ same: false, reason: "One complies, one refuses." });

    const results = await runRegressionSuite([test("weather")], prevConfig, newConfig, "key");

    expect(results).toHaveLength(1);
    expect(results[0].changed).toBe(true);
    expect(results[0].reason).toBe("One complies, one refuses.");
    expect(results[0].error).toBeNull();
  });

  it("does not flag a test when outputs are byte-identical, without calling the judge", async () => {
    vi.mocked(runBehavioral).mockResolvedValue("The weather is sunny today.");

    const results = await runRegressionSuite([test("weather")], prevConfig, newConfig, "key");

    expect(results[0].changed).toBe(false);
    expect(results[0].reason).toBeNull();
    expect(runJudge).not.toHaveBeenCalled();
  });

  it("trusts the judge's SAME verdict over a large character-level diff", async () => {
    vi.mocked(runBehavioral).mockImplementation(async (config) =>
      config === prevConfig
        ? "The capital of France is Paris."
        : "Paris is the capital city of France."
    );
    vi.mocked(runJudge).mockResolvedValue({ same: true, reason: "Same fact, reworded." });

    const results = await runRegressionSuite([test("capital")], prevConfig, newConfig, "key");

    expect(results[0].changed).toBe(false);
    expect(results[0].reason).toBe("Same fact, reworded.");
  });

  it("falls back to the text-diff heuristic when the judge call fails", async () => {
    vi.mocked(runBehavioral).mockImplementation(async (config) =>
      config === prevConfig ? "The weather is sunny today." : "I cannot help with that request."
    );
    vi.mocked(runJudge).mockRejectedValue(new Error("rate limited"));

    const results = await runRegressionSuite([test("weather")], prevConfig, newConfig, "key");

    expect(results[0].error).toBeNull();
    expect(results[0].changed).toBe(true); // magnitude well above the fallback threshold
    expect(results[0].reason).toMatch(/heuristic/i);
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
