"use client";

import { useState } from "react";
import { Commit } from "@/lib/types";
import { runBehavioral } from "@/lib/behavioral";
import { runJudge, geminiKeyFor, JUDGE_FALLBACK_THRESHOLD } from "@/lib/judgeClient";
import { diffMagnitude, diffPrompt } from "@/lib/diff";
import DiffView from "./DiffView";
import Markdown from "./Markdown";

interface BisectRun {
  commit: Commit;
  output: string | null;
  error: string | null;
}

// Verdict for the pair (runs[i-1], runs[i]), indexed by i. index 0 is
// always null (no predecessor). Bisect still ranks candidate pairs by raw
// diffMagnitude -- a binary same/different judge call doesn't naturally
// give a continuous "how severe" score, and severity ranking across many
// commits is exactly what bisect needs to pick ONE likely culprit. The
// judge's job here is narrower: veto pairs that are just a paraphrase
// (high magnitude, same meaning) so they can't outrank a smaller-but-real
// behavior change and get wrongly flagged as the regression point.
interface PairVerdict {
  magnitude: number;
  same: boolean;
  reason: string;
  judged: boolean; // false when skipped (identical output) or judge call failed
}

export default function BisectPanel({ commits, apiKey }: { commits: Commit[]; apiKey: string }) {
  const [message, setMessage] = useState(commits[commits.length - 1]?.demo?.testPrompt ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [runs, setRuns] = useState<BisectRun[]>([]);
  const [verdicts, setVerdicts] = useState<(PairVerdict | null)[]>([]);
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

    const pairVerdicts = await Promise.all(
      results.map(async (cur, i): Promise<PairVerdict | null> => {
        if (i === 0) return null;
        const prev = results[i - 1];
        if (prev.output === null || cur.output === null) return null;

        const magnitude = diffMagnitude(prev.output, cur.output);
        if (magnitude === 0) {
          return { magnitude, same: true, reason: "Outputs are identical.", judged: false };
        }

        try {
          const judgeKey = geminiKeyFor([prev.commit.config, cur.commit.config], apiKey);
          const verdict = await runJudge(message, prev.output, cur.output, judgeKey);
          return { magnitude, same: verdict.same, reason: verdict.reason, judged: true };
        } catch {
          return {
            magnitude,
            same: magnitude < JUDGE_FALLBACK_THRESHOLD,
            reason: "Judge unavailable — used text-diff heuristic instead.",
            judged: false,
          };
        }
      })
    );
    setVerdicts(pairVerdicts);
    setStatus("done");
  }

  // Among pairs the judge (or its fallback) confirms are actually
  // different, flag the one with the largest text drift as the likely
  // regression point. A pair the judge calls "same" (a paraphrase, or
  // formatting-only change) can never win here even if it has the highest
  // raw magnitude in the run.
  let flagIndex = -1;
  let flagMagnitude = 0;
  if (status === "done") {
    for (let i = 1; i < verdicts.length; i++) {
      const v = verdicts[i];
      if (!v || v.same) continue;
      if (v.magnitude > flagMagnitude) {
        flagMagnitude = v.magnitude;
        flagIndex = i;
      }
    }
  }
  const flagVerdict = flagIndex >= 0 ? verdicts[flagIndex] : null;

  return (
    <div className="border border-line rounded-[16px] bg-surface">
      <div className="px-5 pt-5 pb-4 border-b border-line-soft">
        <span className="panel-label text-[14px]">Bisect</span>
        <div className="text-[13px] text-ink-subtle leading-relaxed mt-2">
          Run one message against every commit in history. An LLM judge checks each consecutive pair
          for a meaningful behavior change — not just different wording — before flagging one as the
          likely regression point.
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
                Behavior changed between <strong>{runs[flagIndex - 1].commit.id.slice(-7)}</strong> and{" "}
                <strong>{runs[flagIndex].commit.id.slice(-7)}</strong> — &quot;{runs[flagIndex].commit.message}&quot;
                is the likely regression point.
                {flagVerdict?.reason ? <span className="text-ink-subtle"> {flagVerdict.reason}</span> : null}
                {flagVerdict && !flagVerdict.judged ? (
                  <span className="text-ink-subtle"> (judge unavailable, used text-diff heuristic)</span>
                ) : null}
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
                      ) : (
                        <>
                          {i > 0 && verdicts[i] && (
                            <div className={`text-[12px] mb-2 ${verdicts[i]!.same ? "text-ok" : "text-bad"}`}>
                              {verdicts[i]!.same ? "Judge: same behavior" : "Judge: different behavior"}
                              {!verdicts[i]!.judged ? " (heuristic fallback)" : ""}
                              {verdicts[i]!.reason ? ` — ${verdicts[i]!.reason}` : ""}
                            </div>
                          )}
                          {i > 0 && runs[i - 1].output !== null ? (
                            <DiffView tokens={diffPrompt(runs[i - 1].output as string, r.output as string)} />
                          ) : (
                            <div className="text-[13px] leading-relaxed text-ink">
                              <Markdown>{r.output ?? ""}</Markdown>
                            </div>
                          )}
                        </>
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
