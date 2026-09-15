"use client";

import { useRouter } from "next/navigation";
import { useAgents } from "@/lib/storage";
import { createAgentRecord, blankConfig } from "@/lib/agentFactory";
import AgentCard from "@/components/AgentCard";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const { agents, loaded, addAgent } = useAgents();
  const router = useRouter();

  function createAgent() {
    const agent = createAgentRecord("New agent", blankConfig(), "Initial version");
    addAgent(agent);
    router.push(`/agent/${agent.id}`);
  }

  return (
    <main className="max-w-[960px] mx-auto px-10 py-20 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
          </svg>
          Forge
        </div>
        <ThemeToggle />
      </div>

      <div className="h-px bg-line my-8" />

      <h1 className="font-serif italic font-medium text-[52px] leading-[1.08] tracking-[-0.01em] text-ink">
        Your agents
      </h1>
      <p className="text-[16px] text-ink-faint mt-4 max-w-[520px] leading-relaxed">
        Every agent keeps a config, a chat, and a commit history — edit the prompt, preview a
        response, keep it or roll it back.
      </p>

      <div className="mt-10 flex items-baseline justify-between">
        <div className="meta text-[13px]">
          {loaded ? String(agents.length).padStart(2, "0") : "00"} / agents
        </div>
        <button
          onClick={createAgent}
          className="cursor-pointer text-[14px] font-medium h-[40px] px-6 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover transition-colors"
        >
          + New agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </main>
  );
}
