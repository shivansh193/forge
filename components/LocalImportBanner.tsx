"use client";

import { useEffect, useState } from "react";
import { Agent } from "@/lib/types";
import { normalizeAgent } from "@/lib/normalizeAgent";
import { newAgentId } from "@/lib/agentFactory";

const LEGACY_STORAGE_KEY = "forge.agents.v1";
const HANDLED_KEY = "forge.localImportHandled.v1";

function readLegacyAgents(): Agent[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeAgent) : [];
  } catch {
    return [];
  }
}

// De-collides an imported agent's id against the ids already present in the
// destination workspace — the deterministic preset ids ("resume-builder",
// "code-reviewer") are the likely collision, since both the legacy
// localStorage seed and the server seed start from the same presets.
export function withFreshIdIfColliding(agent: Agent, existingIds: Set<string>): Agent {
  if (!existingIds.has(agent.id)) return agent;
  const id = newAgentId();
  return {
    ...agent,
    id,
    avatarSeed: id,
    commits: agent.commits.map((c, i) => ({ ...c, id: `${id}-c${i}` })),
  };
}

export default function LocalImportBanner({
  existingAgents,
  onImport,
}: {
  existingAgents: Agent[];
  onImport: (agent: Agent) => void;
}) {
  const [legacyAgents, setLegacyAgents] = useState<Agent[] | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(HANDLED_KEY)) return;
    const found = readLegacyAgents();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found.length > 0) setLegacyAgents(found);
  }, []);

  if (!legacyAgents) return null;

  function handleImport() {
    setImporting(true);
    const existingIds = new Set(existingAgents.map((a) => a.id));
    for (const agent of legacyAgents!) {
      const deduped = withFreshIdIfColliding(agent, existingIds);
      existingIds.add(deduped.id);
      onImport(deduped);
    }
    window.localStorage.setItem(HANDLED_KEY, "true");
    setLegacyAgents(null);
  }

  function handleDismiss() {
    window.localStorage.setItem(HANDLED_KEY, "true");
    setLegacyAgents(null);
  }

  return (
    <div className="mb-8 flex items-center justify-between gap-4 p-4 rounded-[12px] border border-accent bg-accent-soft">
      <div className="text-[14px] text-ink leading-relaxed">
        Found <strong>{legacyAgents.length}</strong> agent{legacyAgents.length === 1 ? "" : "s"} saved only in
        this browser, from before agents synced to your account. Import them into this workspace?
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleImport}
          disabled={importing}
          className="cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          {importing ? "Importing…" : "Import"}
        </button>
        <button
          onClick={handleDismiss}
          disabled={importing}
          className="cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[6px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
