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
    <div className="border border-line rounded-[14px] bg-surface">
      <div className="flex items-baseline justify-between px-4 pt-3.5 pb-3 border-b border-line-soft">
        <span className="panel-label">History</span>
        <span className="meta">
          {commits.length} commit{commits.length === 1 ? "" : "s"}
        </span>
      </div>

      <div>
        {ordered.map((c, i) => {
          const isHead = i === 0;
          const prev = commits[commits.indexOf(c) - 1];
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="px-4 py-3.5 border-b border-line-soft last:border-b-0">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                    <span className="meta bg-surface-soft border border-line-soft rounded-[4px] px-1.5 py-[1px] shrink-0">
                      {c.id.slice(-7)}
                    </span>
                    <span className="text-[13px] font-semibold text-ink">{c.message}</span>
                    {isHead && (
                      <span className="text-[10px] font-semibold text-ok bg-ok-bg px-1.5 py-[1px] rounded-[4px] shrink-0">
                        HEAD
                      </span>
                    )}
                  </div>
                  <div className="meta mt-1">{formatTime(c.timestamp)}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {prev && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="cursor-pointer text-[12px] font-medium px-2 h-7 rounded-[6px] text-ink-muted hover:bg-surface-soft transition-colors"
                    >
                      {isOpen ? "Hide diff" : "View diff"}
                    </button>
                  )}
                  {!isHead && (
                    <button
                      onClick={() => onRestore(c)}
                      className="cursor-pointer text-[12px] font-medium px-2 h-7 rounded-[6px] text-accent hover:bg-surface-soft transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {isOpen && prev && (
                <div className="mt-3 p-3 rounded-[6px] bg-surface-soft border border-line-soft">
                  <DiffView tokens={diffPrompt(prev.config.prompt, c.config.prompt)} />
                </div>
              )}

              {c.demo && (
                <div className="mt-2 text-[12px] text-ink-subtle italic">
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
