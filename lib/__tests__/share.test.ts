import { describe, it, expect } from "vitest";
import { encodeShare, decodeShare } from "../share";
import { AgentConfig } from "../types";

const config: AgentConfig = {
  provider: "gemini",
  prompt: "You are a helpful assistant.",
  temperature: 0.5,
  model: "gemini-flash-lite-latest",
};

describe("encodeShare / decodeShare round trip", () => {
  it("decodes exactly what was encoded", () => {
    const encoded = encodeShare({ name: "Test Agent", config });
    const decoded = decodeShare(encoded);
    expect(decoded).toEqual({ name: "Test Agent", config });
  });

  it("survives special characters in the prompt (quotes, unicode, newlines)", () => {
    const trickyConfig: AgentConfig = {
      ...config,
      prompt: 'Say "hello" — 你好\nLine two.',
    };
    const encoded = encodeShare({ name: "Tricky", config: trickyConfig });
    const decoded = decodeShare(encoded);
    expect(decoded?.config.prompt).toBe(trickyConfig.prompt);
  });

  it("produces a URL-safe string with no raw special characters", () => {
    const encoded = encodeShare({ name: "A/B Test", config });
    expect(encoded).not.toMatch(/[{}":\s]/);
  });
});

describe("decodeShare error handling", () => {
  it("returns null for garbage input", () => {
    expect(decodeShare("not-valid-json-at-all")).toBeNull();
  });

  it("returns null for valid JSON missing required fields", () => {
    const encoded = encodeURIComponent(JSON.stringify({ name: "No config here" }));
    expect(decodeShare(encoded)).toBeNull();
  });

  it("returns null when config.prompt is the wrong type", () => {
    const encoded = encodeURIComponent(
      JSON.stringify({ name: "Bad", config: { prompt: 123, temperature: 0.5, model: "x" } })
    );
    expect(decodeShare(encoded)).toBeNull();
  });

  it("defaults a missing provider to gemini rather than rejecting", () => {
    const encoded = encodeURIComponent(
      JSON.stringify({ name: "No provider", config: { prompt: "hi", temperature: 0.5, model: "x" } })
    );
    const decoded = decodeShare(encoded);
    expect(decoded?.config.provider).toBe("gemini");
  });
});
