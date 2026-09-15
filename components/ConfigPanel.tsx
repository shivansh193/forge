"use client";

import { AgentConfig, Provider } from "@/lib/types";
import { PROVIDER_INFO, defaultModelFor, hasServerFallback } from "@/lib/llm";

const inputClass =
  "w-full text-[14px] px-3.5 h-11 border border-line rounded-[6px] bg-surface text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

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
    <div className="border border-line rounded-[16px] bg-surface p-6">
      <div className="panel-label mb-4 pb-4 border-b border-line-soft text-[14px]">Config</div>

      <label className="block field-label mb-2 text-[13px]">Prompt &amp; context</label>
      <textarea
        value={draft.prompt}
        onChange={(e) => onChange({ ...draft, prompt: e.target.value })}
        rows={20}
        disabled={locked}
        placeholder="Paste your full system prompt here — instructions and any background/context together."
        className={`w-full text-[14px] p-4 border border-line rounded-[6px] bg-surface-soft text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60 resize-y leading-relaxed`}
      />

      <div className="flex gap-4 mt-5 flex-wrap">
        <div className="flex-1 min-w-[150px]">
          <label className="block field-label mb-2 text-[13px]">
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
        <div className="flex-1 min-w-[150px]">
          <label className="block field-label mb-2 text-[13px]">Provider</label>
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

      <div className="mt-5">
        <label className="block field-label mb-2 text-[13px]">Model</label>
        <input
          type="text"
          value={draft.model}
          onChange={(e) => onChange({ ...draft, model: e.target.value })}
          disabled={locked}
          className={`${inputClass} font-mono`}
        />
      </div>

      <div className="mt-6 pt-5 border-t border-line-soft">
        <label className="block field-label mb-2 text-[13px]">
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
        <div className="text-[13px] text-ink-subtle mt-2 leading-relaxed">
          {hasServerFallback(draft.provider)
            ? "Used only to make this request, never logged or stored — or leave blank to use the shared demo key."
            : `${providerInfo.label} needs your own key — this app has no shared ${providerInfo.label} key. Used only to make this request, never logged or stored.`}
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!isDirty || locked}
        className="mt-6 w-full cursor-pointer text-[14px] font-medium h-11 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent transition-colors"
      >
        {locked ? "Resolve the pending commit below" : isDirty ? "Save changes…" : "No changes to commit"}
      </button>
    </div>
  );
}
