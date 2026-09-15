"use client";

import { useState } from "react";
import { Commit } from "@/lib/types";
import { runBehavioral } from "@/lib/behavioral";
import { diffMagnitude, diffPrompt } from "@/lib/diff";
import DiffView from "./DiffView";
import Markdown from "./Markdown";

interface BisectRun {
  commit: Commit;
  output: string | null;
  error: string | null;
}

export default function BisectPanel({ commits, apiKey }: { commits: Commit[]; apiKey: string }) {
  const [message, setMessage] = useState(commits[commits.length - 1]?.demo?.testPrompt ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [runs, setRuns] = useState<BisectRun[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function run() {
    if (!message.trim() || status === "loading") return;
    setStatus("loading");
    const results = await Promise.all(
      commits.map(async (commit): Promise<BisectRun> => {
        try {
          const output = await runBehavioral(commit.config, message, apiKey);
          return { commit, output, error: null };
        } catch (err) {
          return { commit, output: null, error: err instanceof Error ? err.message : "Request failed." };
        }
      })
    );
    setRuns(results);
    setStatus("done");
  }

  // Find the consecutive pair with the largest output drift — the most
  // likely place the regression was introduced.
  let flagIndex = -1;
  let flagMagnitude = 0;
  if (status === "done") {
    for (let i = 1; i < runs.length; i++) {
      const prev = runs[i - 1];
      const cur = runs[i];
      if (prev.output === null || cur.output === null) continue;
      const mag = diffMagnitude(prev.output, cur.output);
      if (mag > flagMagnitude) {
        flagMagnitude = mag;
        flagIndex = i;
      }
    }
  }

  return (
    <div className="border border-line rounded-[16px] bg-surface">
      <div className="px-5 pt-5 pb-4 border-b border-line-soft">
        <span className="panel-label text-[14px]">Bisect</span>
        <div className="text-[13px] text-ink-subtle leading-relaxed mt-2">
          Run one message against every commit in history to find where a behavior changed.
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test message that shows the bad behavior"
            className="flex-1 text-[13px] px-3 h-9 border border-line rounded-[6px] bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            onClick={run}
            disabled={!message.trim() || status === "loading"}
            className="cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? `Running ${commits.length} commits…` : "Run bisect"}
          </button>
        </div>

        {status === "done" && (
          <div className="mt-4 space-y-2">
            {flagIndex >= 0 && (
              <div className="p-3 rounded-[8px] bg-bad-bg border border-line-soft text-[13px] text-bad">
                Largest behavior shift between <strong>{runs[flagIndex - 1].commit.id.slice(-7)}</strong> and{" "}
                <strong>{runs[flagIndex].commit.id.slice(-7)}</strong> — &quot;{runs[flagIndex].commit.message}&quot;
                is the likely regression point.
              </div>
            )}

            {runs.map((r, i) => {
              const isOpen = expanded === r.commit.id;
              const isFlagged = i === flagIndex;
              return (
                <div key={r.commit.id}>
                  {isFlagged && (
                    <div className="flex items-center gap-2 py-1.5 text-[12px] font-semibold text-bad">
                      <span className="flex-1 border-t border-bad/30" />
                      likely introduced here
                      <span className="flex-1 border-t border-bad/30" />
                    </div>
                  )}
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.commit.id)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-[8px] bg-surface-soft border border-line-soft hover:border-line transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2.5 min-w-0">
                      <span className="meta bg-surface border border-line-soft rounded-[4px] px-2 py-[2px] shrink-0">
                        {r.commit.id.slice(-7)}
                      </span>
                      <span className="text-[13px] font-medium text-ink truncate">{r.commit.message}</span>
                    </div>
                    <span className="meta shrink-0">{r.error ? "error" : isOpen ? "hide" : "view"}</span>
                  </button>
                  {isOpen && (
                    <div className="mt-1.5 p-3.5 rounded-[8px] bg-surface-soft border border-line-soft">
                      {r.error ? (
                        <div className="text-[13px] text-bad">{r.error}</div>
                      ) : i > 0 && runs[i - 1].output !== null ? (
                        <DiffView tokens={diffPrompt(runs[i - 1].output as string, r.output as string)} />
                      ) : (
                        <div className="text-[13px] leading-relaxed text-ink">
                          <Markdown>{r.output ?? ""}</Markdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
