"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAgents } from "@/lib/storage";
import { createAgentRecord, blankConfig } from "@/lib/agentFactory";
import AgentCard from "@/components/AgentCard";
import Avatar from "@/components/Avatar";
import Link from "next/link";

interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  avatarSeed: string;
  kind: "commit" | "chat";
  text: string;
  timestamp: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function Home() {
  const { agents, loaded, addAgent } = useAgents();
  const router = useRouter();

  function createAgent() {
    const agent = createAgentRecord("New agent", blankConfig(), "Initial version");
    addAgent(agent);
    router.push(`/agent/${agent.id}`);
  }

  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    for (const a of agents) {
      for (const c of a.commits) {
        if (c.status === "finalized") {
          items.push({
            id: c.id,
            agentId: a.id,
            agentName: a.name,
            avatarSeed: a.avatarSeed,
            kind: "commit",
            text: c.message,
            timestamp: c.timestamp,
          });
        }
      }
      for (const m of a.chatHistory) {
        if (m.role === "user") {
          items.push({
            id: m.id,
            agentId: a.id,
            agentName: a.name,
            avatarSeed: a.avatarSeed,
            kind: "chat",
            text: m.content,
            timestamp: m.timestamp,
          });
        }
      }
    }
    return items.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()).slice(0, 16);
  }, [agents]);

  return (
    <main className="flex-1 px-12 py-16 w-full">
      <div className="max-w-[1400px] mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>

        {activity.length > 0 && (
          <div className="mt-14">
            <div className="panel-label text-[14px] mb-4">Recent activity</div>
            <div className="border border-line rounded-[16px] bg-surface divide-y divide-line-soft">
              {activity.map((item) => (
                <Link
                  key={item.id}
                  href={`/agent/${item.agentId}`}
                  className="flex items-start gap-3.5 px-5 py-4 hover:bg-surface-soft transition-colors"
                >
                  <Avatar seed={item.avatarSeed} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">
                      <span className="font-semibold text-ink">{item.agentName}</span>{" "}
                      <span className="text-ink-subtle">
                        {item.kind === "commit" ? "committed" : "was asked"}
                      </span>
                    </div>
                    <div className="text-[14px] text-ink-faint mt-0.5 truncate">{item.text}</div>
                  </div>
                  <div className="meta shrink-0 mt-0.5">{formatTime(item.timestamp)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
