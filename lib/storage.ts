"use client";

import { useCallback, useEffect, useState } from "react";
import { Agent } from "./types";
import { normalizeAgent } from "./normalizeAgent";

export { normalizeAgent };

const API_KEY_STORAGE = "forge.byokKey.v1";

// Module-level cache shared by every useAgents() instance in the tab
// (Sidebar, the agents list, the agent detail page all mount their own
// hook). Loaded once per page session from the server, then kept in sync
// purely in memory — mutations update this cache synchronously (so code
// right after addAgent/updateAgent, like a router.push, sees the new agent
// immediately) and persist to the server in the background. A second
// useAgents() mount (e.g. after client-side navigation) reads the
// already-loaded cache instead of re-fetching, which also avoids a race
// where a fresh GET could land before an in-flight PUT and show stale data.
let cache: Agent[] | null = null;
let inFlight: Promise<Agent[]> | null = null;
const listeners = new Set<(agents: Agent[]) => void>();

async function loadAgents(): Promise<Agent[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;
  inFlight = fetch("/api/agents")
    .then((res) => res.json())
    .then((data) => {
      const agents = (data.agents as Agent[]).map(normalizeAgent);
      cache = agents;
      inFlight = null;
      return agents;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
  return inFlight;
}

// Called on sign-out. The cache and its in-flight promise are module-level
// (see comment above), so they outlive a client-side navigation to
// /auth/sign-in and back — without this, signing out and into a *different*
// account in the same tab would briefly render the previous account's
// agents from memory before any request had a chance to run.
export function resetAgentsCache() {
  cache = null;
  inFlight = null;
}

function setCache(next: Agent[], changed: Agent) {
  cache = next;
  listeners.forEach((fn) => fn(next));
  // Upsert only the one agent that actually changed, not the whole array —
  // a whole-list write here raced with any other write in flight (another
  // tab, or another mutation fired before this one's fetch resolved) and
  // whichever PUT landed last silently discarded the other's change. A
  // per-agent PUT scoped to (userId, id) can't collide with a write to a
  // different agent, and two writes to the *same* agent just serialize to
  // last-write-wins on that one row, which is the correct outcome.
  fetch(`/api/agents/${changed.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changed),
  }).catch((err) => console.error("Failed to save agent to the server:", err));
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(cache ?? []);
  const [loaded, setLoaded] = useState(cache !== null);

  useEffect(() => {
    let cancelled = false;
    if (cache === null) {
      loadAgents()
        .then((loadedAgents) => {
          if (!cancelled) {
            setAgents(loadedAgents);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });
    }

    function onChange(next: Agent[]) {
      if (!cancelled) setAgents(next);
    }
    listeners.add(onChange);
    return () => {
      cancelled = true;
      listeners.delete(onChange);
    };
  }, []);

  const updateAgent = useCallback((id: string, updater: (agent: Agent) => Agent) => {
    const current = cache ?? [];
    const existing = current.find((a) => a.id === id);
    if (!existing) return; // unknown id — nothing to update, nothing to PUT
    const updated = updater(existing);
    const next = current.map((a) => (a.id === id ? updated : a));
    setCache(next, updated);
  }, []);

  const addAgent = useCallback((agent: Agent) => {
    const next = [...(cache ?? []), agent];
    setCache(next, agent);
  }, []);

  return { agents, loaded, updateAgent, addAgent };
}

export function useByokKey() {
  const [key, setKey] = useState("");

  // Reads localStorage, which doesn't exist during SSR — client-only effect.
  //
  // Still intentionally client-only even now that real accounts exist (see
  // README's "BYOK" section for the full reasoning) — the original
  // justification here ("no login to gate who could read it back") is gone,
  // but the replacement one isn't about login at all: this app has no
  // encryption-at-rest story, so a pasted OpenAI/Anthropic key sitting in
  // Postgres would just move the blast radius of a DB compromise from "one
  // browser's localStorage" to "every user's key in one table," for no
  // feature this app actually needs (nothing here uses a key when its owner
  // isn't at the keyboard). Server-side storage would be the right call the
  // moment that stops being true — e.g. scheduled/background runs.
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
