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
        <div className="tag-label flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          forge
        </div>
        <ThemeToggle />
      </div>
      <h1 className="font-bold text-[40px] leading-[1.1] tracking-[-0.02em] text-ink mt-4">
        Your agents
      </h1>
      <p className="text-[14px] text-ink-faint mt-3 max-w-[480px] leading-relaxed">
        Every agent keeps a config, a chat, and a commit history. Edit the prompt, preview a
        response, keep it or roll it back.
      </p>

      <div className="mt-10 flex justify-between items-center">
        <div className="tag-label">
          {loaded ? `${agents.length} agent${agents.length === 1 ? "" : "s"}` : "loading…"}
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
