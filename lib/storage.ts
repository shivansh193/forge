"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Agent } from "./types";
import { getPresetAgents } from "./presets";

const STORAGE_KEY = "forge.agents.v1";
const API_KEY_STORAGE = "forge.byokKey.v1";
const SYNC_EVENT = "forge:agents-changed";

export function normalizeAgent(agent: Agent): Agent {
  return {
    ...agent,
    commits: agent.commits.map((c) => ({
      ...c,
      config: { ...c.config, provider: c.config.provider ?? "gemini" },
    })),
    pinnedTests: agent.pinnedTests ?? [],
  };
}

function readAgents(): Agent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getPresetAgents();
    const parsed = JSON.parse(raw) as Agent[];
    if (!Array.isArray(parsed) || parsed.length === 0) return getPresetAgents();
    return parsed.map(normalizeAgent);
  } catch {
    return getPresetAgents();
  }
}

function writeAgents(agents: Agent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  // Every useAgents() call site holds its own React state — this notifies
  // sibling instances (e.g. the persistent Sidebar) mounted elsewhere in the
  // tree so an action on one page (import, fork, new agent) shows up
  // everywhere immediately instead of only after a reload. The `storage`
  // event doesn't fire within the same document, so this has to be manual.
  window.dispatchEvent(new CustomEvent<Agent[]>(SYNC_EVENT, { detail: agents }));
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Mirrors `agents` synchronously so writes never depend on setState-updater
  // timing — code right after addAgent/updateAgent (e.g. router.push) must
  // see localStorage already updated, not wait for React to flush.
  const agentsRef = useRef<Agent[]>([]);

  // Reads localStorage, which doesn't exist during SSR — can't be a lazy
  // useState initializer without diverging from the server-rendered markup
  // and breaking hydration, so this has to run as a client-only effect.
  useEffect(() => {
    const initial = readAgents();
    agentsRef.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgents(initial);
    setLoaded(true);

    function onSync(e: Event) {
      const next = (e as CustomEvent<Agent[]>).detail;
      if (next === agentsRef.current) return;
      agentsRef.current = next;
      setAgents(next);
    }
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  const commit = useCallback((next: Agent[]) => {
    agentsRef.current = next;
    writeAgents(next);
    setAgents(next);
  }, []);

  const persist = useCallback(
    (next: Agent[]) => {
      commit(next);
    },
    [commit]
  );

  const updateAgent = useCallback(
    (id: string, updater: (agent: Agent) => Agent) => {
      const next = agentsRef.current.map((a) => (a.id === id ? updater(a) : a));
      commit(next);
    },
    [commit]
  );

  const addAgent = useCallback(
    (agent: Agent) => {
      const next = [...agentsRef.current, agent];
      commit(next);
    },
    [commit]
  );

  return { agents, loaded, persist, updateAgent, addAgent };
}

export function useByokKey() {
  const [key, setKey] = useState("");

  // Reads localStorage, which doesn't exist during SSR — client-only effect
  // for the same reason as useAgents above.
  useEffect(() => {
    const stored = window.localStorage.getItem(API_KEY_STORAGE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setKey(stored);
  }, []);

  const update = useCallback((value: string) => {
    setKey(value);
    if (value.trim()) window.localStorage.setItem(API_KEY_STORAGE, value.trim());
    else window.localStorage.removeItem(API_KEY_STORAGE);
  }, []);

  return { key, setKey: update };
}
