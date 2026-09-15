"use client";

import Link from "next/link";
import Avatar from "./Avatar";
import { Agent } from "@/lib/types";

export default function AgentCard({ agent }: { agent: Agent }) {
  const commits = agent.commits.filter((c) => c.status !== "discarded");
  const head = commits[commits.length - 1];
  const preview = head?.config.prompt.slice(0, 220) ?? "";

  return (
    <Link
      href={`/agent/${agent.id}`}
      className="flex flex-col gap-3 border border-line rounded-[16px] bg-surface px-6 py-6 hover:border-ink-subtle transition-colors"
    >
      <div className="flex items-center gap-3.5">
        <Avatar seed={agent.avatarSeed} size={48} />
        <div className="min-w-0">
          <div className="font-semibold text-[17px] text-ink truncate">{agent.name}</div>
          <div className="meta mt-0.5">
            {commits.length} commit{commits.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <div className="text-[14px] text-ink-faint leading-relaxed line-clamp-4">
        {preview}
        {preview.length === 220 ? "…" : ""}
      </div>
    </Link>
  );
}
