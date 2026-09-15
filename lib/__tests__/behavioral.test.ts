import { describe, it, expect, vi, afterEach } from "vitest";
import { runBehavioral } from "../behavioral";
import { AgentConfig } from "../types";

const config: AgentConfig = { provider: "gemini", prompt: "You are helpful.", temperature: 0.5, model: "x" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runBehavioral", () => {
  it("returns the response text on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ response: "hi there" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await runBehavioral(config, "hello", "key");
    expect(result).toBe("hi there");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws with the server's error message on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "No API key configured." }), { status: 400 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(runBehavioral(config, "hello", "")).rejects.toThrow("No API key configured.");
  });
});
