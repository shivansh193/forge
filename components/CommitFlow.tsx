"use client";

import Markdown from "./Markdown";

export type FlowStep = "confirmCommit" | "confirmDemo" | "demoLoading" | "demoResult" | "demoError";

export interface DemoResult {
  testPrompt: string;
  response: string;
}

const primaryBtn =
  "cursor-pointer text-[14px] font-medium h-11 px-5 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover transition-colors";
const secondaryBtn =
  "cursor-pointer text-[14px] font-medium h-11 px-5 rounded-[2px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors";
const dangerBtn =
  "cursor-pointer text-[14px] font-medium h-11 px-5 rounded-[2px] bg-surface text-bad border border-line hover:bg-bad-bg transition-colors";

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
    <div className="mt-5 p-5 rounded-[16px] border border-accent bg-accent-soft">
      {step === "confirmCommit" && (
        <>
          <div className="text-[14px] font-semibold mb-3 text-ink">Commit this change?</div>
          <input
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="Commit message"
            className="w-full text-[14px] px-4 h-11 border border-line rounded-[6px] mb-4 bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
          <div className="text-[14px] font-semibold mb-3 text-ink">
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
        <div className="flex flex-col gap-2.5">
          <div className={`flex items-center gap-2.5 text-[14px] ${demoPhase === "prompt" ? "text-ink" : "text-ink-subtle"}`}>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${demoPhase === "prompt" ? "bg-accent animate-pulse" : "bg-ok"}`}
            />
            Writing a test message{demoPhase === "prompt" ? "…" : " — done"}
          </div>
          <div className={`flex items-center gap-2.5 text-[14px] ${demoPhase === "response" ? "text-ink" : "text-ink-subtle"}`}>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${demoPhase === "response" ? "bg-accent animate-pulse" : "bg-line"}`}
            />
            Running it against the new version{demoPhase === "response" ? "…" : ""}
          </div>
        </div>
      )}

      {step === "demoError" && (
        <>
          <div className="text-[14px] mb-4 text-bad">{demoError}</div>
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
          <div className="text-[14px] font-semibold mb-4 text-ink">Demo response</div>
          <div className="text-[13px] font-semibold text-ink-muted mb-1.5">Test message</div>
          <div className="font-serif text-[17px] italic text-ink mb-4 pl-3.5 border-l-2 border-accent">
            {demoResult.testPrompt}
          </div>
          <div className="text-[13px] font-semibold text-ink-muted mb-1.5">Response</div>
          <div className="text-[14px] leading-relaxed text-ink mb-5 max-h-[300px] overflow-y-auto">
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
