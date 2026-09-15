"use client";

import { useState } from "react";
import { PinnedTest } from "@/lib/types";
import { newTestId } from "@/lib/agentFactory";

export default function PinnedTestsPanel({
  tests,
  onChange,
}: {
  tests: PinnedTest[];
  onChange: (next: PinnedTest[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    const test: PinnedTest = {
      id: newTestId(),
      label: label.trim() || `Test ${tests.length + 1}`,
      input: input.trim(),
    };
    onChange([...tests, test]);
    setLabel("");
    setInput("");
  }

  function remove(id: string) {
    onChange(tests.filter((t) => t.id !== id));
  }

  return (
    <div className="border border-line rounded-[16px] bg-surface">
      <div className="flex items-baseline justify-between px-5 pt-5 pb-4 border-b border-line-soft">
        <span className="panel-label text-[14px]">Pinned tests</span>
        <span className="meta">
          {tests.length} test{tests.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        <div className="text-[13px] text-ink-subtle leading-relaxed">
          Every commit auto-reruns these against the old and new prompt, and flags any output that drifted.
        </div>

        {tests.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between gap-3 p-3 rounded-[8px] bg-surface-soft border border-line-soft"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink">{t.label}</div>
              <div className="text-[13px] text-ink-subtle italic truncate">{t.input}</div>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="cursor-pointer text-[12px] font-medium px-2 h-7 rounded-[4px] text-bad hover:bg-bad-bg transition-colors shrink-0"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="pt-1 space-y-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-full text-[13px] px-3 h-9 border border-line rounded-[6px] bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Test input, e.g. a message this agent should handle well"
              className="flex-1 text-[13px] px-3 h-9 border border-line rounded-[6px] bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              onClick={add}
              disabled={!input.trim()}
              className="cursor-pointer text-[13px] font-medium px-4 h-9 rounded-[6px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
