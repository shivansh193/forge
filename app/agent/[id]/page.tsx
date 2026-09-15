"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAgents, useByokKey } from "@/lib/storage";
import { createAgentRecord } from "@/lib/agentFactory";
import { AgentConfig, Commit } from "@/lib/types";
import { diffPrompt, summarizeDiff } from "@/lib/diff";
import Avatar from "@/components/Avatar";
import ConfigPanel from "@/components/ConfigPanel";
import ChatPane from "@/components/ChatPane";
import HistoryPanel from "@/components/HistoryPanel";
import CommitFlow, { DemoResult, FlowStep } from "@/components/CommitFlow";
import ThemeToggle from "@/components/ThemeToggle";

function nanoid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AgentDetail() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { agents, loaded, updateAgent, addAgent } = useAgents();
  const { key: byokKey, setKey: setByokKey } = useByokKey();

  const agent = agents.find((a) => a.id === id);
  const finalized = agent?.commits.filter((c) => c.status !== "discarded" && c.status !== "pending") ?? [];
  const head = finalized[finalized.length - 1];

  const [draft, setDraft] = useState<AgentConfig | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
  const [pendingCommit, setPendingCommit] = useState<Commit | null>(null);
  const [commitMessageDraft, setCommitMessageDraft] = useState("");
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [demoPhase, setDemoPhase] = useState<"prompt" | "response" | null>(null);
  const demoInFlight = useRef(false);

  useEffect(() => {
    if (head && draft === null) setDraft(head.config);
    if (agent) setNameDraft(agent.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head?.id, agent?.name]);

  if (!loaded) {
    return <main className="max-w-[880px] mx-auto px-8 py-16 text-[13px] text-ink-faint">Loading…</main>;
  }
  if (!agent || !head || !draft) {
    return (
      <main className="max-w-[880px] mx-auto px-8 py-16">
        <div className="text-[13px] text-ink-faint">Agent not found.</div>
        <Link href="/" className="text-[13px] font-semibold text-accent">
          ← Back to agents
        </Link>
      </main>
    );
  }

  const isDirty =
    draft.prompt !== head.config.prompt ||
    draft.temperature !== head.config.temperature ||
    draft.model !== head.config.model ||
    draft.provider !== head.config.provider;

  function handleSaveClick() {
    setCommitMessageDraft(summarizeDiff(head!.config.prompt, draft!.prompt) || "Manual edit");
    setFlowStep("confirmCommit");
  }

  function handleConfirmCommit() {
    const newCommit: Commit = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      message: commitMessageDraft.trim() || "Manual edit",
      config: draft!,
      promptDiffFromPrev: JSON.stringify(diffPrompt(head!.config.prompt, draft!.prompt)),
      status: "pending",
      demo: null,
    };
    updateAgent(agent!.id, (a) => ({ ...a, commits: [...a.commits, newCommit] }));
    setPendingCommit(newCommit);
    setFlowStep("confirmDemo");
  }

  function finalizePending(demo: DemoResult | null) {
    if (!pendingCommit) return;
    updateAgent(agent!.id, (a) => ({
      ...a,
      commits: a.commits.map((c) =>
        c.id === pendingCommit.id
          ? { ...c, status: "finalized", demo: demo ? { testPrompt: demo.testPrompt, response: demo.response } : null }
          : c
      ),
    }));
    resetFlow();
  }

  function handleSkipDemo() {
    finalizePending(null);
  }

  async function handleWantDemo() {
    if (!pendingCommit || demoInFlight.current) return;
    demoInFlight.current = true;
    setFlowStep("demoLoading");
    setDemoError(null);
    try {
      setDemoPhase("prompt");
      const promptRes = await fetch("/api/test-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: pendingCommit.config, apiKey: byokKey }),
      });
      const promptData = await promptRes.json();
      if (!promptRes.ok) throw new Error(promptData.error || "Couldn't write a test message.");

      setDemoPhase("response");
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: pendingCommit.config,
          message: promptData.testPrompt,
          apiKey: byokKey,
        }),
      });
      const chatData = await chatRes.json();
      if (!chatRes.ok) throw new Error(chatData.error || "Demo generation failed.");

      setDemoResult({ testPrompt: promptData.testPrompt, response: chatData.response });
      setFlowStep("demoResult");
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Demo generation failed.");
      setFlowStep("demoError");
    } finally {
      demoInFlight.current = false;
      setDemoPhase(null);
    }
  }

  function handleFork() {
    if (!head) return;
    const forked = createAgentRecord(`${agent!.name} (fork)`, head.config, `Forked from ${agent!.name}`);
    addAgent(forked);
    router.push(`/agent/${forked.id}`);
  }

  function handleKeep() {
    finalizePending(demoResult);
  }

  function handleRollback() {
    if (pendingCommit) {
      updateAgent(agent!.id, (a) => ({
        ...a,
        commits: a.commits.filter((c) => c.id !== pendingCommit.id),
      }));
    }
    setDraft(head!.config);
    resetFlow();
  }

  function handleCancelCommit() {
    setFlowStep(null);
  }

  function resetFlow() {
    setFlowStep(null);
    setPendingCommit(null);
    setDemoResult(null);
    setDemoError(null);
  }

  function handleRestore(commit: Commit) {
    setDraft(commit.config);
    setFlowStep(null);
  }

  async function handleChatSend(message: string) {
    const userMsg = {
      id: nanoid(),
      role: "user" as const,
      content: message,
      timestamp: new Date().toISOString(),
      commitId: head!.id,
    };
    updateAgent(agent!.id, (a) => ({ ...a, chatHistory: [...a.chatHistory, userMsg] }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: head!.config, message, apiKey: byokKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed.");
      const assistantMsg = {
        id: nanoid(),
        role: "assistant" as const,
        content: data.response,
        timestamp: new Date().toISOString(),
        commitId: head!.id,
      };
      updateAgent(agent!.id, (a) => ({ ...a, chatHistory: [...a.chatHistory, assistantMsg] }));
    } catch (err) {
      const errMsg = {
        id: nanoid(),
        role: "assistant" as const,
        content: `Error: ${err instanceof Error ? err.message : "request failed"}`,
        timestamp: new Date().toISOString(),
        commitId: head!.id,
      };
      updateAgent(agent!.id, (a) => ({ ...a, chatHistory: [...a.chatHistory, errMsg] }));
    }
  }

  return (
    <main className="max-w-[1240px] mx-auto px-10 py-14">
      <div className="flex justify-between items-start gap-4">
        <Link href="/" className="text-[14px] font-medium text-ink-faint hover:text-ink transition-colors">
          ← All agents
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-between gap-3 mt-5 mb-10">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar seed={agent.avatarSeed} size={60} />
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => updateAgent(agent.id, (a) => ({ ...a, name: nameDraft.trim() || a.name }))}
            className="font-serif italic font-medium text-[38px] tracking-[-0.01em] text-ink bg-transparent outline-none border-b border-transparent focus:border-line min-w-0"
          />
        </div>
        <button
          onClick={handleFork}
          className="shrink-0 cursor-pointer text-[14px] font-medium h-10 px-5 rounded-[2px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors"
        >
          Fork
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-7">
        <div className="space-y-7">
          <ChatPane history={agent.chatHistory} onSend={handleChatSend} disabled={!head.config.prompt.trim()} />
          <HistoryPanel commits={finalized} onRestore={handleRestore} />
        </div>

        <div>
          <ConfigPanel
            draft={draft}
            onChange={setDraft}
            isDirty={isDirty}
            onSave={handleSaveClick}
            byokKey={byokKey}
            onByokChange={setByokKey}
            locked={flowStep !== null}
          />

          {flowStep && (
            <CommitFlow
              step={flowStep}
              commitMessage={commitMessageDraft}
              onCommitMessageChange={setCommitMessageDraft}
              onConfirmCommit={handleConfirmCommit}
              onCancel={handleCancelCommit}
              onWantDemo={handleWantDemo}
              onSkipDemo={handleSkipDemo}
              demoPhase={demoPhase}
              demoResult={demoResult}
              demoError={demoError}
              onKeep={handleKeep}
              onRollback={handleRollback}
            />
          )}
        </div>
      </div>
    </main>
  );
}
