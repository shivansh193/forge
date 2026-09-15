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
    <div className="border border-line rounded-[16px] bg-surface">
      <div className="flex items-baseline justify-between px-5 pt-5 pb-4 border-b border-line-soft">
        <span className="panel-label text-[14px]">History</span>
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
            <div key={c.id} className="px-5 py-4 border-b border-line-soft last:border-b-0">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2.5 min-w-0 flex-wrap">
                    <span className="meta bg-surface-soft border border-line-soft rounded-[4px] px-2 py-[2px] shrink-0">
                      {c.id.slice(-7)}
                    </span>
                    <span className="text-[14px] font-semibold text-ink">{c.message}</span>
                    {isHead && (
                      <span className="text-[11px] font-semibold text-ok bg-ok-bg px-2 py-[2px] rounded-[4px] shrink-0">
                        HEAD
                      </span>
                    )}
                  </div>
                  <div className="meta mt-1.5">{formatTime(c.timestamp)}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {prev && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="cursor-pointer text-[13px] font-medium px-2.5 h-8 rounded-[6px] text-ink-muted hover:bg-surface-soft transition-colors"
                    >
                      {isOpen ? "Hide diff" : "View diff"}
                    </button>
                  )}
                  {!isHead && (
                    <button
                      onClick={() => onRestore(c)}
                      className="cursor-pointer text-[13px] font-medium px-2.5 h-8 rounded-[6px] text-accent hover:bg-surface-soft transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {isOpen && prev && (
                <div className="mt-3.5 p-4 rounded-[8px] bg-surface-soft border border-line-soft">
                  <DiffView tokens={diffPrompt(prev.config.prompt, c.config.prompt)} />
                </div>
              )}

              {c.demo && (
                <div className="mt-2.5 text-[13px] text-ink-subtle italic">
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
