"use client";

import { useState } from "react";
import { Commit } from "@/lib/types";
import { diffPrompt } from "@/lib/diff";
import DiffView from "./DiffView";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPanel({
  commits,
  onRestore,
}: {
  commits: Commit[];
  onRestore: (commit: Commit) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const ordered = [...commits].reverse();

  return (
    <div className="border border-line rounded-sm bg-surface">
      <div className="flex items-baseline justify-between px-5 pt-4 pb-3 border-b border-line-soft">
        <span className="tag-label">history</span>
        <span className="tag-label">
          {commits.length} commit{commits.length === 1 ? "" : "s"}
        </span>
      </div>

      <div>
        {ordered.map((c, i) => {
          const isHead = i === 0;
          const prev = commits[commits.indexOf(c) - 1];
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="px-5 py-3.5 border-b border-line-soft last:border-b-0">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-ink-subtle shrink-0">
                      {c.id.slice(-7)}
                    </span>
                    <span className="text-[13px] font-semibold text-ink truncate">{c.message}</span>
                    {isHead && (
                      <span className="font-mono text-[10px] text-ok border border-ok px-1 rounded-sm shrink-0">
                        HEAD
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-ink-subtle mt-1">
                    {formatTime(c.timestamp)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {prev && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="cursor-pointer text-[11px] font-semibold px-2 py-1 rounded-sm text-ink-muted hover:bg-surface-soft"
                    >
                      {isOpen ? "Hide diff" : "View diff"}
                    </button>
                  )}
                  {!isHead && (
                    <button
                      onClick={() => onRestore(c)}
                      className="cursor-pointer text-[11px] font-semibold px-2 py-1 rounded-sm text-accent hover:bg-surface-soft"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {isOpen && prev && (
                <div className="mt-3 p-3 rounded-sm bg-surface-soft">
                  <DiffView tokens={diffPrompt(prev.config.prompt, c.config.prompt)} />
                </div>
              )}

              {c.demo && (
                <div className="mt-2 text-[11px] text-ink-subtle italic">
                  Demo-tested before commit
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
