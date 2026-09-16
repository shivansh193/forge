"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodeShare } from "@/lib/share";
import { createAgentRecord } from "@/lib/agentFactory";
import { useAgents } from "@/lib/storage";
import Avatar from "@/components/Avatar";

function ImportContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { addAgent } = useAgents();
  const [imported, setImported] = useState(false);

  const raw = params.get("a");
  const snapshot = raw ? decodeShare(raw) : null;

  function handleImport() {
    if (!snapshot) return;
    const agent = createAgentRecord(snapshot.name, snapshot.config, `Imported via share link`);
    addAgent(agent);
    setImported(true);
    setTimeout(() => router.push(`/agent/${agent.id}`), 400);
  }

  if (!raw || !snapshot) {
    return (
      <main className="flex-1 px-10 py-16">
        <div className="max-w-[520px]">
          <h1 className="font-serif italic font-medium text-[32px] text-ink">Nothing to import</h1>
          <p className="text-[14px] text-ink-faint mt-3 leading-relaxed">
            This link doesn&apos;t carry a valid agent — it may be malformed or incomplete.
          </p>
          <Link href="/" className="inline-block mt-5 text-[14px] font-medium text-accent">
            ← Back to your agents
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-10 py-16">
      <div className="max-w-[560px]">
        <div className="meta mb-3">shared agent</div>
        <div className="flex items-center gap-4">
          <Avatar seed={snapshot.name} size={48} />
          <h1 className="font-serif italic font-medium text-[32px] text-ink">{snapshot.name}</h1>
        </div>

        <div className="mt-6 border border-line rounded-[14px] bg-surface p-5">
          <div className="field-label text-[13px] mb-2">Prompt &amp; context</div>
          <div className="text-[14px] text-ink-faint leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto">
            {snapshot.config.prompt}
          </div>
          <div className="flex gap-4 mt-4 text-[13px] text-ink-subtle">
            <span>Provider: {snapshot.config.provider}</span>
            <span>Model: {snapshot.config.model}</span>
            <span>Temp: {snapshot.config.temperature}</span>
          </div>
        </div>

        <p className="text-[13px] text-ink-subtle mt-4 leading-relaxed">
          Importing adds this as a new agent in your own workspace, starting fresh — it won&apos;t touch the
          sender&apos;s copy, and you can edit or fork it right away.
        </p>

        <button
          onClick={handleImport}
          disabled={imported}
          className="mt-5 cursor-pointer text-[14px] font-medium h-11 px-6 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-60 transition-colors"
        >
          {imported ? "Imported — opening…" : "Import to my agents"}
        </button>
      </div>
    </main>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<main className="flex-1 px-10 py-16 text-[13px] text-ink-faint">Loading…</main>}>
      <ImportContent />
    </Suspense>
  );
}
