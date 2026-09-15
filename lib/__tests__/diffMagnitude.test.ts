import { describe, it, expect } from "vitest";
import { diffMagnitude } from "../diff";

describe("diffMagnitude", () => {
  it("returns 0 for identical text", () => {
    expect(diffMagnitude("hello there", "hello there")).toBe(0);
  });

  it("returns 1 for completely different text", () => {
    expect(diffMagnitude("hello", "goodbye")).toBe(1);
  });

  it("returns a fraction between 0 and 1 for partial changes", () => {
    const mag = diffMagnitude("The sky is blue today", "The sky is grey today");
    expect(mag).toBeGreaterThan(0);
    expect(mag).toBeLessThan(1);
  });

  it("returns 0 for two empty strings", () => {
    expect(diffMagnitude("", "")).toBe(0);
  });
});
