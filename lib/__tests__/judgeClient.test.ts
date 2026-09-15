import { describe, it, expect, vi, afterEach } from "vitest";
import { runJudge, geminiKeyFor } from "../judgeClient";
import { AgentConfig } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

const geminiConfig: AgentConfig = { provider: "gemini", prompt: "p", temperature: 0.5, model: "x" };
const openaiConfig: AgentConfig = { provider: "openai", prompt: "p", temperature: 0.5, model: "x" };
const anthropicConfig: AgentConfig = { provider: "anthropic", prompt: "p", temperature: 0.5, model: "x" };

describe("runJudge", () => {
  it("returns the verdict on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ same: false, reason: "different conclusion" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runJudge("input", "a", "b", "key");
    expect(result).toEqual({ same: false, reason: "different conclusion" });
    expect(fetchMock).toHaveBeenCalledWith("/api/judge", expect.objectContaining({ method: "POST" }));
  });

  it("throws with the server's error message on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "No API key configured." }), { status: 400 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(runJudge("input", "a", "b", "")).rejects.toThrow("No API key configured.");
  });
});

describe("geminiKeyFor", () => {
  it("forwards the BYOK key when at least one config is a gemini config", () => {
    expect(geminiKeyFor([geminiConfig, openaiConfig], "my-key")).toBe("my-key");
    expect(geminiKeyFor([geminiConfig], "my-key")).toBe("my-key");
  });

  it("withholds a non-gemini key so it can't shadow the server's GEMINI_API_KEY", () => {
    expect(geminiKeyFor([openaiConfig, anthropicConfig], "an-openai-key")).toBe("");
  });
});
