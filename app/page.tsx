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
      <div className="flex justify-between items-start gap-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint mb-2">
          Forge
        </div>
        <ThemeToggle />
      </div>
      <h1 className="font-serif font-semibold text-[38px] leading-[1.15] tracking-[-0.018em] text-ink">
        Your agents
      </h1>
      <p className="text-[13px] text-ink-faint mt-3 max-w-[520px] leading-relaxed">
        Every agent has a config, a chat, and a commit history. Edit the prompt, see a demo
        response, keep it or roll it back.
      </p>

      <div className="mt-10 flex justify-between items-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {loaded ? `${agents.length} agent${agents.length === 1 ? "" : "s"}` : "Loading…"}
        </div>
        <button
          onClick={createAgent}
          className="cursor-pointer text-[13px] font-semibold px-4 py-2 rounded-sm bg-accent text-accent-ink hover:opacity-90 transition-opacity"
        >
          + New agent
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
