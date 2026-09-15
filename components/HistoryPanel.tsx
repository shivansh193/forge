"use client";

import { useState } from "react";
import { Commit } from "@/lib/types";
import { diffPrompt } from "@/lib/diff";
import DiffView from "./DiffView";
import BehavioralDiff from "./BehavioralDiff";

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
  byokKey,
}: {
  commits: Commit[];
  onRestore: (commit: Commit) => void;
  byokKey: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [behaviorOpen, setBehaviorOpen] = useState<string | null>(null);
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
                  {prev && (
                    <button
                      onClick={() => setBehaviorOpen(behaviorOpen === c.id ? null : c.id)}
                      className="cursor-pointer text-[13px] font-medium px-2.5 h-8 rounded-[6px] text-accent hover:bg-surface-soft transition-colors"
                    >
                      {behaviorOpen === c.id ? "Hide behavior" : "Compare behavior"}
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

              {behaviorOpen === c.id && prev && (
                <div className="mt-3.5 p-4 rounded-[8px] bg-surface-soft border border-line-soft">
                  <BehavioralDiff
                    leftLabel={prev.id.slice(-7)}
                    leftConfig={prev.config}
                    rightLabel={c.id.slice(-7)}
                    rightConfig={c.config}
                    apiKey={byokKey}
                    initialMessage={c.demo?.testPrompt ?? prev.demo?.testPrompt ?? ""}
                  />
                </div>
              )}

              {c.demo && (
                <div className="mt-2.5 text-[13px] text-ink-subtle italic">
                  Demo-tested before commit
                </div>
              )}

              {c.regressionResults && c.regressionResults.length > 0 && (
                <RegressionBadge results={c.regressionResults} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegressionBadge({ results }: { results: Commit["regressionResults"] }) {
  const [open, setOpen] = useState(false);
  const list = results ?? [];
  const drifted = list.filter((r) => r.changed);
  const failed = list.filter((r) => r.error);

  return (
    <div className="mt-2.5">
      <button
        onClick={() => setOpen(!open)}
        className={`cursor-pointer text-[13px] font-medium px-2.5 h-7 rounded-[4px] transition-colors ${
          drifted.length > 0
            ? "text-bad bg-bad-bg hover:opacity-80"
            : "text-ok bg-ok-bg hover:opacity-80"
        }`}
      >
        {drifted.length > 0
          ? `${drifted.length} of ${list.length} pinned test${list.length === 1 ? "" : "s"} drifted`
          : `${list.length} pinned test${list.length === 1 ? "" : "s"} passed`}
        {failed.length > 0 ? ` · ${failed.length} couldn't run` : ""}
      </button>

      {open && (
        <div className="mt-2.5 space-y-3">
          {list.map((r) => (
            <div key={r.testId} className="p-3.5 rounded-[8px] bg-surface-soft border border-line-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-ink">{r.label}</span>
                {r.error ? (
                  <span className="meta text-bad">{r.error}</span>
                ) : (
                  <span className={`meta ${r.changed ? "text-bad" : "text-ok"}`}>
                    {r.changed ? "drifted" : "stable"}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-ink-subtle italic mb-2">{r.input}</div>
              {r.prevOutput !== null && r.newOutput !== null && (
                <DiffView tokens={diffPrompt(r.prevOutput, r.newOutput)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
