import { describe, it, expect } from "vitest";
import { diffPrompt, summarizeDiff } from "../diff";

describe("diffPrompt", () => {
  it("marks unchanged text as neither added nor removed", () => {
    const tokens = diffPrompt("hello world", "hello world");
    expect(tokens.every((t) => !t.added && !t.removed)).toBe(true);
    expect(tokens.map((t) => t.value).join("")).toBe("hello world");
  });

  it("marks appended text as added", () => {
    const tokens = diffPrompt("hello", "hello world");
    const added = tokens.filter((t) => t.added);
    expect(added.length).toBeGreaterThan(0);
    expect(added.map((t) => t.value).join("")).toContain("world");
  });

  it("marks removed text as removed", () => {
    const tokens = diffPrompt("hello world", "hello");
    const removed = tokens.filter((t) => t.removed);
    expect(removed.length).toBeGreaterThan(0);
    expect(removed.map((t) => t.value).join("")).toContain("world");
  });

  it("handles empty strings without throwing", () => {
    expect(() => diffPrompt("", "")).not.toThrow();
    expect(diffPrompt("", "")).toEqual([]);
  });
});

describe("summarizeDiff", () => {
  it("reports no changes for identical text", () => {
    expect(summarizeDiff("same text", "same text")).toBe("No changes");
  });

  it("reports only additions when nothing was removed", () => {
    const summary = summarizeDiff("hello", "hello world");
    expect(summary).toMatch(/^\+\d+ changes?$/);
    expect(summary).not.toContain("-");
  });

  it("reports both additions and removals when both occur", () => {
    const summary = summarizeDiff("hello world", "hello there");
    expect(summary).toMatch(/\+\d+ changes?/);
    expect(summary).toMatch(/-\d+ changes?/);
  });

  it("uses singular 'change' for exactly one token diff", () => {
    const summary = summarizeDiff("a b c", "a b c d");
    expect(summary).toBe("+1 change");
  });
});
