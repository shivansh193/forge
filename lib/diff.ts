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

// Fraction of the combined text (by character count) that changed between
// two texts — 0 means identical, 1 means completely different. Used to flag
// meaningful drift in model outputs without needing another model call to
// judge "did this change."
export function diffMagnitude(oldText: string, newText: string): number {
  const tokens = diffPrompt(oldText, newText);
  let changed = 0;
  let total = 0;
  for (const t of tokens) {
    total += t.value.length;
    if (t.added || t.removed) changed += t.value.length;
  }
  return total === 0 ? 0 : changed / total;
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
