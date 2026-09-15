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
      className="flex gap-4 border border-line rounded-[14px] bg-surface px-5 py-[18px] hover:border-ink-subtle transition-colors"
    >
      <Avatar seed={agent.avatarSeed} size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <div className="font-semibold text-[15px] text-ink truncate">{agent.name}</div>
          <div className="meta shrink-0">
            {commits.length} commit{commits.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="text-[13px] text-ink-faint mt-1.5 leading-relaxed line-clamp-2">
          {preview}
          {preview.length === 120 ? "…" : ""}
        </div>
      </div>
    </Link>
  );
}
