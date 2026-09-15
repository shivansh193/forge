"use client";

import Link from "next/link";
import Avatar from "./Avatar";
import { Agent } from "@/lib/types";

export default function AgentCard({ agent }: { agent: Agent }) {
  const commits = agent.commits.filter((c) => c.status !== "discarded");
  const head = commits[commits.length - 1];
  const preview = head?.config.prompt.slice(0, 120) ?? "";

  return (
    <Link
      href={`/agent/${agent.id}`}
      className="block border border-line rounded-sm p-5 bg-surface hover:border-ink-subtle transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar seed={agent.avatarSeed} size={40} />
        <div className="min-w-0">
          <div className="font-semibold text-[15px] text-ink truncate">{agent.name}</div>
          <div className="text-[11px] font-mono text-ink-subtle">
            {commits.length} commit{commits.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <div className="text-[13px] text-ink-faint mt-3 leading-relaxed line-clamp-2">
        {preview}
        {preview.length === 120 ? "…" : ""}
      </div>
    </Link>
  );
}
