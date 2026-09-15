"use client";

import { AgentConfig } from "@/lib/types";

export default function ConfigPanel({
  draft,
  onChange,
  isDirty,
  onSave,
  byokKey,
  onByokChange,
  locked,
}: {
  draft: AgentConfig;
  onChange: (next: AgentConfig) => void;
  isDirty: boolean;
  onSave: () => void;
  byokKey: string;
  onByokChange: (value: string) => void;
  locked: boolean;
}) {
  return (
    <div className="border border-line rounded-sm bg-surface p-5">
      <div className="tag-label mb-3">config</div>

      <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">
        Prompt &amp; context
      </label>
      <textarea
        value={draft.prompt}
        onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
        rows={14}
        disabled={locked}
        placeholder="Paste your full system prompt here — instructions and any background/context together."
        className="w-full p-3 text-[13px] border border-line rounded-sm resize-y leading-relaxed bg-surface-soft text-ink disabled:opacity-60 outline-none focus:border-ink-subtle"
      />

      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">
            Temperature: {draft.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={draft.temperature}
            onChange={(e) => onChange({ ...draft, temperature: parseFloat(e.target.value) })}
            disabled={locked}
            className="w-full disabled:opacity-60"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">Model</label>
          <input
            type="text"
            value={draft.model}
            onChange={(e) => onChange({ ...draft, model: e.target.value })}
            disabled={locked}
            className="w-full text-[13px] px-3 py-2 border border-line rounded-sm font-mono bg-surface text-ink disabled:opacity-60 outline-none focus:border-ink-subtle"
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-line-soft">
        <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">
          API key <span className="font-normal text-ink-subtle">(optional — use your own)</span>
        </label>
        <input
          type="password"
          value={byokKey}
          onChange={(e) => onByokChange(e.target.value)}
          placeholder="Paste a Gemini API key to use instead of the shared demo key"
          className="w-full text-[13px] px-3 py-2 border border-line rounded-sm font-mono bg-surface text-ink outline-none focus:border-ink-subtle"
        />
        <div className="text-[11px] text-ink-subtle mt-1.5">
          Stays in your browser — sent straight to Google, never through our server.
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!isDirty || locked}
        className="mt-5 w-full cursor-pointer text-[13px] font-semibold px-4 py-2.5 rounded-sm bg-accent text-accent-ink disabled:opacity-35 disabled:cursor-not-allowed transition-opacity"
      >
        {locked ? "Resolve the pending commit below" : isDirty ? "Save changes…" : "No changes to commit"}
      </button>
    </div>
  );
}
