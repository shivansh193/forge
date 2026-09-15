"use client";

import Markdown from "./Markdown";

export type FlowStep = "confirmCommit" | "confirmDemo" | "demoLoading" | "demoResult" | "demoError";

export interface DemoResult {
  testPrompt: string;
  response: string;
}

const primaryBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover transition-colors";
const secondaryBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[2px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors";
const dangerBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[2px] bg-surface text-bad border border-line hover:bg-bad-bg transition-colors";

export default function CommitFlow({
  step,
  commitMessage,
  onCommitMessageChange,
  onConfirmCommit,
  onCancel,
  onWantDemo,
  onSkipDemo,
  demoPhase,
  demoResult,
  demoError,
  onKeep,
  onRollback,
}: {
  step: FlowStep;
  commitMessage: string;
  onCommitMessageChange: (v: string) => void;
  onConfirmCommit: () => void;
  onCancel: () => void;
  onWantDemo: () => void;
  onSkipDemo: () => void;
  demoPhase: "prompt" | "response" | null;
  demoResult: DemoResult | null;
  demoError: string | null;
  onKeep: () => void;
  onRollback: () => void;
}) {
  return (
    <div className="mt-4 p-4 rounded-[14px] border border-accent bg-accent-soft">
      {step === "confirmCommit" && (
        <>
          <div className="text-[13px] font-semibold mb-2.5 text-ink">Commit this change?</div>
          <input
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="Commit message"
            className="w-full text-[13px] px-3 h-9 border border-line rounded-[6px] mb-3 bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <div className="flex gap-2">
            <button onClick={onConfirmCommit} className={primaryBtn}>
              Commit
            </button>
            <button onClick={onCancel} className={secondaryBtn}>
              Cancel
            </button>
          </div>
        </>
      )}

      {step === "confirmDemo" && (
        <>
          <div className="text-[13px] font-semibold mb-2.5 text-ink">
            Committed. Want a demo response with this version?
          </div>
          <div className="flex gap-2">
            <button onClick={onWantDemo} className={primaryBtn}>
              Yes, run a demo
            </button>
            <button onClick={onSkipDemo} className={secondaryBtn}>
              Skip
            </button>
          </div>
        </>
      )}

      {step === "demoLoading" && (
        <div className="flex flex-col gap-2">
          <div className={`flex items-center gap-2 text-[13px] ${demoPhase === "prompt" ? "text-ink" : "text-ink-subtle"}`}>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${demoPhase === "prompt" ? "bg-accent animate-pulse" : "bg-ok"}`}
            />
            Writing a test message{demoPhase === "prompt" ? "…" : " — done"}
          </div>
          <div className={`flex items-center gap-2 text-[13px] ${demoPhase === "response" ? "text-ink" : "text-ink-subtle"}`}>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${demoPhase === "response" ? "bg-accent animate-pulse" : "bg-line"}`}
            />
            Running it against the new version{demoPhase === "response" ? "…" : ""}
          </div>
        </div>
      )}

      {step === "demoError" && (
        <>
          <div className="text-[13px] mb-3 text-bad">{demoError}</div>
          <div className="flex gap-2">
            <button onClick={onKeep} className={primaryBtn}>
              Keep anyway
            </button>
            <button onClick={onRollback} className={dangerBtn}>
              Roll back
            </button>
          </div>
        </>
      )}

      {step === "demoResult" && demoResult && (
        <>
          <div className="text-[13px] font-semibold mb-3 text-ink">Demo response</div>
          <div className="text-[12px] font-semibold text-ink-muted mb-1">Test message</div>
          <div className="font-serif text-[15px] italic text-ink mb-3 pl-3 border-l-2 border-accent">
            {demoResult.testPrompt}
          </div>
          <div className="text-[12px] font-semibold text-ink-muted mb-1">Response</div>
          <div className="text-[13px] leading-relaxed text-ink mb-4 max-h-[240px] overflow-y-auto">
            <Markdown>{demoResult.response}</Markdown>
          </div>
          <div className="flex gap-2">
            <button onClick={onKeep} className={primaryBtn}>
              Keep this version
            </button>
            <button onClick={onRollback} className={dangerBtn}>
              Roll back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
