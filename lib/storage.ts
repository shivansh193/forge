"use client";

import { useCallback, useEffect, useState } from "react";
import { Agent } from "./types";
import { getPresetAgents } from "./presets";

const STORAGE_KEY = "forge.agents.v1";
const API_KEY_STORAGE = "forge.byokKey.v1";

function readAgents(): Agent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getPresetAgents();
    const parsed = JSON.parse(raw) as Agent[];
    if (!Array.isArray(parsed) || parsed.length === 0) return getPresetAgents();
    return parsed;
  } catch {
    return getPresetAgents();
  }
}

function writeAgents(agents: Agent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAgents(readAgents());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Agent[]) => {
    setAgents(next);
    writeAgents(next);
  }, []);

  const updateAgent = useCallback(
    (id: string, updater: (agent: Agent) => Agent) => {
      setAgents((prev) => {
        const next = prev.map((a) => (a.id === id ? updater(a) : a));
        writeAgents(next);
        return next;
      });
    },
    []
  );

  const addAgent = useCallback((agent: Agent) => {
    setAgents((prev) => {
      const next = [...prev, agent];
      writeAgents(next);
      return next;
    });
  }, []);

  return { agents, loaded, persist, updateAgent, addAgent };
}

export function useByokKey() {
  const [key, setKey] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(API_KEY_STORAGE);
    if (stored) setKey(stored);
  }, []);

  const update = useCallback((value: string) => {
    setKey(value);
    if (value.trim()) window.localStorage.setItem(API_KEY_STORAGE, value.trim());
    else window.localStorage.removeItem(API_KEY_STORAGE);
  }, []);

  return { key, setKey: update };
}
