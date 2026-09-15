"use client";

export type FlowStep = "confirmCommit" | "confirmDemo" | "demoLoading" | "demoResult" | "demoError";

export interface DemoResult {
  testPrompt: string;
  response: string;
}

const primaryBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-accent text-accent-ink border border-black/10 shadow-[var(--shadow-sm)] hover:bg-accent-hover transition-colors";
const secondaryBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors";
const dangerBtn =
  "cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-surface text-bad border border-line hover:bg-bad-bg transition-colors";

export default function CommitFlow({
  step,
  commitMessage,
  onCommitMessageChange,
  onConfirmCommit,
  onCancel,
  onWantDemo,
  onSkipDemo,
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
  demoResult: DemoResult | null;
  demoError: string | null;
  onKeep: () => void;
  onRollback: () => void;
}) {
  return (
    <div className="mt-4 p-4 rounded-[6px] border border-accent bg-accent-soft shadow-[var(--shadow-sm)]">
      {step === "confirmCommit" && (
        <>
          <div className="text-[13px] font-semibold mb-2.5 text-ink">Commit this change?</div>
          <input
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="Commit message"
            className="w-full text-[13px] px-3 h-9 border border-line rounded-[6px] mb-3 bg-surface text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
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
        <div className="text-[13px] text-ink-faint italic">
          Generating a test message and running it against the new version…
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
          <div className="text-[13px] italic text-ink mb-3 pl-3 border-l-2 border-accent">
            {demoResult.testPrompt}
          </div>
          <div className="text-[12px] font-semibold text-ink-muted mb-1">Response</div>
          <div className="text-[13px] leading-relaxed text-ink mb-4 whitespace-pre-wrap max-h-[240px] overflow-y-auto">
            {demoResult.response}
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
