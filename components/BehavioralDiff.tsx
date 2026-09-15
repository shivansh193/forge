"use client";

import { useState } from "react";
import { AgentConfig } from "@/lib/types";
import { diffPrompt } from "@/lib/diff";
import { runBehavioral } from "@/lib/behavioral";
import DiffView from "./DiffView";
import Markdown from "./Markdown";

const runBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

export default function BehavioralDiff({
  leftLabel,
  leftConfig,
  rightLabel,
  rightConfig,
  apiKey,
  initialMessage,
}: {
  leftLabel: string;
  leftConfig: AgentConfig;
  rightLabel: string;
  rightConfig: AgentConfig;
  apiKey: string;
  initialMessage?: string;
}) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"diff" | "side">("diff");

  async function run() {
    if (!message.trim() || status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const [l, r] = await Promise.all([
        runBehavioral(leftConfig, message, apiKey),
        runBehavioral(rightConfig, message, apiKey),
      ]);
      setLeft(l);
      setRight(r);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setStatus("error");
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Test message to run against both versions"
          className="flex-1 text-[13px] px-3 h-9 border border-line rounded-[6px] bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button onClick={run} disabled={!message.trim() || status === "loading"} className={runBtn}>
          {status === "loading" ? "Running…" : "Run"}
        </button>
      </div>

      {status === "error" && <div className="mt-3 text-[13px] text-bad">{error}</div>}

      {status === "done" && left !== null && right !== null && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => setView("diff")}
                className={`cursor-pointer text-[12px] font-medium px-2.5 h-7 rounded-[4px] transition-colors ${
                  view === "diff" ? "bg-accent-soft text-accent" : "text-ink-subtle hover:bg-surface-soft"
                }`}
              >
                Diff
              </button>
              <button
                onClick={() => setView("side")}
                className={`cursor-pointer text-[12px] font-medium px-2.5 h-7 rounded-[4px] transition-colors ${
                  view === "side" ? "bg-accent-soft text-accent" : "text-ink-subtle hover:bg-surface-soft"
                }`}
              >
                Side by side
              </button>
            </div>
            <span className="meta">
              {leftLabel} vs {rightLabel}
            </span>
          </div>

          {view === "diff" ? (
            <div className="p-3.5 rounded-[8px] bg-surface-soft border border-line-soft">
              <DiffView tokens={diffPrompt(left, right)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[8px] bg-surface-soft border border-line-soft">
                <div className="text-[12px] font-semibold text-ink-muted mb-2">{leftLabel}</div>
                <div className="text-[13px] leading-relaxed text-ink max-h-[280px] overflow-y-auto">
                  <Markdown>{left}</Markdown>
                </div>
              </div>
              <div className="p-3.5 rounded-[8px] bg-surface-soft border border-line-soft">
                <div className="text-[12px] font-semibold text-ink-muted mb-2">{rightLabel}</div>
                <div className="text-[13px] leading-relaxed text-ink max-h-[280px] overflow-y-auto">
                  <Markdown>{right}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
