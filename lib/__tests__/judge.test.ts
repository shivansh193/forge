import { describe, it, expect, vi, afterEach } from "vitest";
import { judgeBehavior } from "../judge";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockGeminiResponse(text: string) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200 }
  );
}

describe("judgeBehavior", () => {
  it("parses a plain JSON verdict", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockGeminiResponse('{"same": true, "reason": "Both refuse politely."}')
    );
    vi.stubGlobal("fetch", fetchMock);

    const verdict = await judgeBehavior("hi", "no", "nope", "key");
    expect(verdict).toEqual({ same: true, reason: "Both refuse politely." });
  });

  it("strips markdown fences around the JSON verdict", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockGeminiResponse('```json\n{"same": false, "reason": "One complies, one refuses."}\n```')
    );
    vi.stubGlobal("fetch", fetchMock);

    const verdict = await judgeBehavior("hi", "sure, here", "I can't help with that", "key");
    expect(verdict).toEqual({ same: false, reason: "One complies, one refuses." });
  });

  it("defaults reason to an empty string when the model omits it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockGeminiResponse('{"same": true}'));
    vi.stubGlobal("fetch", fetchMock);

    const verdict = await judgeBehavior("hi", "a", "b", "key");
    expect(verdict).toEqual({ same: true, reason: "" });
  });

  it("throws when the model response isn't valid JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockGeminiResponse("not json at all"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(judgeBehavior("hi", "a", "b", "key")).rejects.toThrow();
  });

  it("throws when the parsed JSON is missing a boolean 'same' field", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockGeminiResponse('{"reason": "no verdict field"}'));
    vi.stubGlobal("fetch", fetchMock);

    await expect(judgeBehavior("hi", "a", "b", "key")).rejects.toThrow();
  });

  it("calls Gemini directly with a low temperature, independent of any agent provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockGeminiResponse('{"same": true, "reason": "ok"}'));
    vi.stubGlobal("fetch", fetchMock);

    await judgeBehavior("hi", "a", "b", "my-key");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("generativelanguage.googleapis.com"),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-goog-api-key": "my-key" }),
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.generationConfig.temperature).toBe(0);
  });
});
