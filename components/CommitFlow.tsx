"use client";

export type FlowStep = "confirmCommit" | "confirmDemo" | "demoLoading" | "demoResult" | "demoError";

export interface DemoResult {
  testPrompt: string;
  response: string;
}

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
    <div className="mt-4 p-4 rounded-sm border-2 border-accent bg-accent-soft">
      {step === "confirmCommit" && (
        <>
          <div className="text-[13px] font-semibold mb-2 text-accent">
            Commit this change?
          </div>
          <input
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="Commit message"
            className="w-full text-[13px] px-3 py-2 border border-line rounded-sm mb-3 bg-surface text-ink outline-none focus:border-ink-subtle"
          />
          <div className="flex gap-2">
            <button
              onClick={onConfirmCommit}
              className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm bg-accent text-accent-ink"
            >
              Commit
            </button>
            <button onClick={onCancel} className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm text-ink-muted">
              Cancel
            </button>
          </div>
        </>
      )}

      {step === "confirmDemo" && (
        <>
          <div className="text-[13px] font-semibold mb-2 text-accent">
            Committed. Want a demo response with this version?
          </div>
          <div className="flex gap-2">
            <button
              onClick={onWantDemo}
              className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm bg-accent text-accent-ink"
            >
              Yes, run a demo
            </button>
            <button onClick={onSkipDemo} className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm text-ink-muted">
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
            <button
              onClick={onKeep}
              className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm bg-accent text-accent-ink"
            >
              Keep anyway
            </button>
            <button onClick={onRollback} className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm text-ink-muted">
              Roll back
            </button>
          </div>
        </>
      )}

      {step === "demoResult" && demoResult && (
        <>
          <div className="text-[13px] font-semibold mb-3 text-accent">
            Demo response
          </div>
          <div className="text-[12px] font-semibold text-ink-muted mb-1">Test message</div>
          <div className="text-[13px] italic text-ink mb-3 pl-3 border-l-2 border-accent">
            {demoResult.testPrompt}
          </div>
          <div className="text-[12px] font-semibold text-ink-muted mb-1">Response</div>
          <div className="text-[13px] leading-relaxed text-ink mb-4 whitespace-pre-wrap max-h-[240px] overflow-y-auto">
            {demoResult.response}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onKeep}
              className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm bg-ok text-accent-ink"
            >
              Keep this version
            </button>
            <button onClick={onRollback} className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm text-accent">
              Roll back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
