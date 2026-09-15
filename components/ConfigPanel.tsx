"use client";

import { AgentConfig } from "@/lib/types";

const inputClass =
  "w-full text-[13px] px-3 py-[6px] border border-line rounded-[6px] bg-surface text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

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
    <div className="border border-line rounded-[6px] bg-surface shadow-[var(--shadow-sm)] p-4">
      <div className="panel-label mb-3 pb-3 border-b border-line-soft">Config</div>

      <label className="block field-label mb-1.5">Prompt &amp; context</label>
      <textarea
        value={draft.prompt}
        onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
        rows={14}
        disabled={locked}
        placeholder="Paste your full system prompt here — instructions and any background/context together."
        className={`${inputClass} p-3 resize-y leading-relaxed bg-surface-soft`}
      />

      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className="block field-label mb-1.5">
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
          <label className="block field-label mb-1.5">Model</label>
          <input
            type="text"
            value={draft.model}
            onChange={(e) => onChange({ ...draft, model: e.target.value })}
            disabled={locked}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-line-soft">
        <label className="block field-label mb-1.5">
          API key <span className="font-normal text-ink-subtle">(optional — use your own)</span>
        </label>
        <input
          type="password"
          value={byokKey}
          onChange={(e) => onByokChange(e.target.value)}
          placeholder="Paste a Gemini API key to use instead of the shared demo key"
          className={`${inputClass} font-mono`}
        />
        <div className="text-[12px] text-ink-subtle mt-1.5">
          Stays in your browser — sent straight to Google, never through our server.
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!isDirty || locked}
        className="mt-5 w-full cursor-pointer text-[13px] font-medium h-9 rounded-[6px] bg-accent text-accent-ink border border-black/10 shadow-[var(--shadow-sm)] hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent transition-colors"
      >
        {locked ? "Resolve the pending commit below" : isDirty ? "Save changes…" : "No changes to commit"}
      </button>
    </div>
  );
}
