"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAgents } from "@/lib/storage";
import { createAgentRecord, blankConfig } from "@/lib/agentFactory";
import { TEMPLATES } from "@/lib/templates";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

export default function Sidebar() {
  const { agents, addAgent } = useAgents();
  const router = useRouter();
  const pathname = usePathname();

  function createFromTemplate(templateId?: string) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    const agent = template
      ? createAgentRecord(
          template.name,
          { provider: "gemini", prompt: template.prompt, temperature: template.temperature, model: "gemini-flash-lite-latest" },
          `Started from the ${template.name} template`
        )
      : createAgentRecord("New agent", blankConfig(), "Initial version");
    addAgent(agent);
    router.push(`/agent/${agent.id}`);
  }

  return (
    <aside className="hidden md:flex flex-col w-[280px] shrink-0 h-screen sticky top-0 border-r border-line bg-surface">
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
          </svg>
          Forge
        </Link>
        <ThemeToggle />
      </div>

      <div className="px-5">
        <button
          onClick={() => createFromTemplate()}
          className="w-full cursor-pointer text-[14px] font-medium h-10 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover transition-colors"
        >
          + New agent
        </button>
      </div>

      <div className="mt-7 px-5">
        <div className="field-label text-[12px] mb-2.5">Templates</div>
        <div className="flex flex-col gap-0.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => createFromTemplate(t.id)}
              className="text-left cursor-pointer rounded-[8px] px-2.5 py-2 hover:bg-surface-soft transition-colors group"
            >
              <div className="text-[13px] font-medium text-ink-muted group-hover:text-ink">{t.name}</div>
              <div className="text-[11.5px] text-ink-subtle mt-0.5 leading-snug">{t.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 px-5 flex-1 overflow-y-auto pb-6">
        <div className="field-label text-[12px] mb-2.5">
          Agents <span className="text-ink-subtle font-normal">({agents.length})</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {agents.map((a) => {
            const active = pathname === `/agent/${a.id}`;
            const commits = a.commits.filter((c) => c.status !== "discarded").length;
            return (
              <Link
                key={a.id}
                href={`/agent/${a.id}`}
                className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-colors ${
                  active ? "bg-accent-soft" : "hover:bg-surface-soft"
                }`}
              >
                <Avatar seed={a.avatarSeed} size={26} />
                <div className="min-w-0 flex-1">
                  <div className={`text-[13px] font-medium truncate ${active ? "text-ink" : "text-ink-muted"}`}>
                    {a.name}
                  </div>
                </div>
                <div className="meta shrink-0">{commits}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-line">
        <UserMenu />
      </div>
    </aside>
  );
}
