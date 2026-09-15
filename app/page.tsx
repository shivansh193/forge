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
    <main className="max-w-[640px] mx-auto px-9 py-16 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
          </svg>
          Forge
        </div>
        <ThemeToggle />
      </div>

      <div className="h-px bg-line my-6" />

      <h1 className="font-serif italic font-medium text-[40px] leading-[1.08] tracking-[-0.01em] text-ink">
        Your agents
      </h1>
      <p className="text-[14px] text-ink-faint mt-3.5 max-w-[400px] leading-relaxed">
        Every agent keeps a config, a chat, and a commit history — edit the prompt, preview a
        response, keep it or roll it back.
      </p>

      <div className="mt-8 flex items-baseline justify-between">
        <div className="meta">
          {loaded ? String(agents.length).padStart(2, "0") : "00"} / agents
        </div>
        <button
          onClick={createAgent}
          className="cursor-pointer text-[13px] font-medium h-[34px] px-[18px] rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover transition-colors"
        >
          + New agent
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </main>
  );
}
