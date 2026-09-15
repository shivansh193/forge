"use client";

import { AgentConfig, Provider } from "@/lib/types";
import { PROVIDER_INFO, defaultModelFor, hasServerFallback } from "@/lib/llm";

const inputClass =
  "w-full text-[13px] px-3 py-[6px] border border-line rounded-[6px] bg-surface text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

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
  const providerInfo = PROVIDER_INFO.find((p) => p.id === draft.provider) ?? PROVIDER_INFO[0];

  function setProvider(provider: Provider) {
    onChange({ ...draft, provider, model: defaultModelFor(provider) });
  }

  return (
    <div className="border border-line rounded-[14px] bg-surface p-5">
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
        <div className="flex-1 min-w-[130px]">
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
        <div className="flex-1 min-w-[130px]">
          <label className="block field-label mb-1.5">Provider</label>
          <select
            value={draft.provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            disabled={locked}
            className={inputClass}
          >
            {PROVIDER_INFO.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block field-label mb-1.5">Model</label>
        <input
          type="text"
          value={draft.model}
          onChange={(e) => onChange({ ...draft, model: e.target.value })}
          disabled={locked}
          className={`${inputClass} font-mono`}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-line-soft">
        <label className="block field-label mb-1.5">
          {providerInfo.label} API key{" "}
          <span className="font-normal text-ink-subtle">
            {hasServerFallback(draft.provider) ? "(optional — use your own)" : "(required)"}
          </span>
        </label>
        <input
          type="password"
          value={byokKey}
          onChange={(e) => onByokChange(e.target.value)}
          placeholder={
            hasServerFallback(draft.provider)
              ? `Paste a ${providerInfo.label} API key to use instead of the shared demo key`
              : `Paste your ${providerInfo.label} API key`
          }
          className={`${inputClass} font-mono`}
        />
        <div className="text-[12px] text-ink-subtle mt-1.5">
          {hasServerFallback(draft.provider)
            ? "Used only to make this request, never logged or stored — or leave blank to use the shared demo key."
            : `${providerInfo.label} needs your own key — this app has no shared ${providerInfo.label} key. Used only to make this request, never logged or stored.`}
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!isDirty || locked}
        className="mt-5 w-full cursor-pointer text-[13px] font-medium h-9 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent transition-colors"
      >
        {locked ? "Resolve the pending commit below" : isDirty ? "Save changes…" : "No changes to commit"}
      </button>
    </div>
  );
}
