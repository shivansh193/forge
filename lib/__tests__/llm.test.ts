import { describe, it, expect, afterEach } from "vitest";
import { PROVIDER_INFO, defaultModelFor, hasServerFallback, resolveApiKey, missingKeyError } from "../llm";

describe("PROVIDER_INFO", () => {
  it("lists exactly the three supported providers", () => {
    const ids = PROVIDER_INFO.map((p) => p.id).sort();
    expect(ids).toEqual(["anthropic", "gemini", "openai"]);
  });

  it("gives every provider a non-empty label and default model", () => {
    for (const p of PROVIDER_INFO) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.defaultModel.length).toBeGreaterThan(0);
    }
  });
});

describe("defaultModelFor", () => {
  it("returns the correct default model per provider", () => {
    expect(defaultModelFor("gemini")).toBe("gemini-flash-lite-latest");
    expect(defaultModelFor("openai")).toBe("gpt-4o-mini");
    expect(defaultModelFor("anthropic")).toBe("claude-haiku-4-5-20251001");
  });
});

describe("hasServerFallback", () => {
  it("is true only for gemini", () => {
    expect(hasServerFallback("gemini")).toBe(true);
    expect(hasServerFallback("openai")).toBe(false);
    expect(hasServerFallback("anthropic")).toBe(false);
  });
});

describe("resolveApiKey", () => {
  const ORIGINAL_ENV = process.env.GEMINI_API_KEY;
  afterEach(() => {
    process.env.GEMINI_API_KEY = ORIGINAL_ENV;
  });

  it("prefers a trimmed client-supplied key over anything else", () => {
    process.env.GEMINI_API_KEY = "server-key";
    expect(resolveApiKey("gemini", "  client-key  ")).toBe("client-key");
  });

  it("falls back to the server env key for gemini when no client key is given", () => {
    process.env.GEMINI_API_KEY = "server-key";
    expect(resolveApiKey("gemini", undefined)).toBe("server-key");
  });

  it("returns an empty string for gemini when neither client key nor env key exists", () => {
    delete process.env.GEMINI_API_KEY;
    expect(resolveApiKey("gemini", undefined)).toBe("");
  });

  it("never falls back to the server env key for non-gemini providers", () => {
    process.env.GEMINI_API_KEY = "server-key";
    expect(resolveApiKey("openai", undefined)).toBe("");
    expect(resolveApiKey("anthropic", "")).toBe("");
  });
});

describe("missingKeyError", () => {
  it("gives a gemini-specific message mentioning the env var", () => {
    expect(missingKeyError("gemini")).toContain("GEMINI_API_KEY");
  });

  it("names the provider for non-gemini providers", () => {
    expect(missingKeyError("openai")).toContain("OpenAI");
    expect(missingKeyError("anthropic")).toContain("Anthropic");
  });
});
