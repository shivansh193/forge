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

function setCache(next: Agent[]) {
  cache = next;
  listeners.forEach((fn) => fn(next));
  fetch("/api/agents", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agents: next }),
  }).catch((err) => console.error("Failed to save agents to the server:", err));
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
    const next = (cache ?? []).map((a) => (a.id === id ? updater(a) : a));
    setCache(next);
  }, []);

  const addAgent = useCallback((agent: Agent) => {
    const next = [...(cache ?? []), agent];
    setCache(next);
  }, []);

  return { agents, loaded, updateAgent, addAgent };
}

export function useByokKey() {
  const [key, setKey] = useState("");

  // Reads localStorage, which doesn't exist during SSR — client-only effect.
  // Intentionally stays in localStorage rather than the server: an API key
  // is a secret, and this session model has no login to gate who can read
  // it back from a database.
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
