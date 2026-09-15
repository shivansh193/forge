"use client";

import { useRouter } from "next/navigation";
import { useAgents } from "@/lib/storage";
import AgentCard from "@/components/AgentCard";
import ThemeToggle from "@/components/ThemeToggle";
import { Agent } from "@/lib/types";

function newAgentId() {
  return `agent-${Date.now().toString(36)}`;
}

export default function Home() {
  const { agents, loaded, addAgent } = useAgents();
  const router = useRouter();

  function createAgent() {
    const id = newAgentId();
    const name = "New agent";
    const now = new Date().toISOString();
    const agent: Agent = {
      id,
      name,
      avatarSeed: id,
      createdAt: now,
      commits: [
        {
          id: `${id}-c0`,
          timestamp: now,
          message: "Initial version",
          config: { prompt: "", temperature: 0.7, model: "gemini-flash-lite-latest" },
          promptDiffFromPrev: null,
          status: "finalized",
          demo: null,
        },
      ],
      chatHistory: [],
    };
    addAgent(agent);
    router.push(`/agent/${id}`);
  }

  return (
    <main className="max-w-[880px] mx-auto px-8 py-16 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="text-accent">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7V7h2v5zm0-6H7V4h2v2z" />
          </svg>
          Forge
        </div>
        <ThemeToggle />
      </div>
      <h1 className="font-bold text-[32px] leading-[1.2] tracking-[-0.01em] text-ink mt-6">
        Your agents
      </h1>
      <p className="text-[14px] text-ink-faint mt-2 max-w-[480px] leading-relaxed">
        Every agent keeps a config, a chat, and a commit history. Edit the prompt, preview a
        response, keep it or roll it back.
      </p>

      <div className="mt-8 flex justify-between items-center">
        <div className="field-label">
          {loaded ? `${agents.length} agent${agents.length === 1 ? "" : "s"}` : "Loading…"}
        </div>
        <button
          onClick={createAgent}
          className="cursor-pointer text-[13px] font-medium h-8 px-3.5 rounded-[6px] bg-accent text-accent-ink border border-black/10 shadow-[var(--shadow-sm)] hover:bg-accent-hover transition-colors"
        >
          New agent
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </main>
  );
}
