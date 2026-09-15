import { diffWords, Change } from "diff";

export interface DiffToken {
  value: string;
  added: boolean;
  removed: boolean;
}

export function diffPrompt(oldText: string, newText: string): DiffToken[] {
  const changes: Change[] = diffWords(oldText, newText);
  return changes.map((c) => ({
    value: c.value,
    added: !!c.added,
    removed: !!c.removed,
  }));
}

export function summarizeDiff(oldText: string, newText: string): string {
  const tokens = diffPrompt(oldText, newText);
  const added = tokens.filter((t) => t.added).length;
  const removed = tokens.filter((t) => t.removed).length;
  if (added === 0 && removed === 0) return "No changes";
  const parts: string[] = [];
  if (added > 0) parts.push(`+${added} change${added === 1 ? "" : "s"}`);
  if (removed > 0) parts.push(`-${removed} change${removed === 1 ? "" : "s"}`);
  return parts.join(" ");
}
