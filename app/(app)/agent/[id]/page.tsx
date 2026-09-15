"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAgents, useByokKey } from "@/lib/storage";
import { createAgentRecord } from "@/lib/agentFactory";
import { encodeShare } from "@/lib/share";
import { AgentConfig, Commit, PinnedTest } from "@/lib/types";
import { diffPrompt, summarizeDiff } from "@/lib/diff";
import { runRegressionSuite } from "@/lib/regression";
import Avatar from "@/components/Avatar";
import ConfigPanel from "@/components/ConfigPanel";
import ChatPane from "@/components/ChatPane";
import HistoryPanel from "@/components/HistoryPanel";
import CommitFlow, { DemoResult, FlowStep } from "@/components/CommitFlow";
import PinnedTestsPanel from "@/components/PinnedTestsPanel";
import BisectPanel from "@/components/BisectPanel";
import ForkCompare from "@/components/ForkCompare";

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
  const otherAgents = agents.filter((a) => a.id !== id);

  const [draft, setDraft] = useState<AgentConfig | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
  const [pendingCommit, setPendingCommit] = useState<Commit | null>(null);
  const [commitMessageDraft, setCommitMessageDraft] = useState("");
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [demoPhase, setDemoPhase] = useState<"prompt" | "response" | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [bisectOpen, setBisectOpen] = useState(false);
  const demoInFlight = useRef(false);

  // head/agent come from useAgents(), which only populates after mount (it
  // reads localStorage) — this can't be computed during render, and needs to
  // re-sync whenever the route's :id changes to a different agent.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (head && draft === null) setDraft(head.config);
    if (agent) setNameDraft(agent.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head?.id, agent?.name]);

  if (!loaded) {
    return <main className="flex-1 px-10 py-16 text-[13px] text-ink-faint">Loading…</main>;
  }
  if (!agent || !head || !draft) {
    return (
      <main className="flex-1 px-10 py-16">
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

  async function handleConfirmCommit() {
    const pinnedTests = agent!.pinnedTests;
    let regressionResults: Commit["regressionResults"];
    if (pinnedTests.length > 0) {
      setFlowStep("regressionLoading");
      regressionResults = await runRegressionSuite(pinnedTests, head!.config, draft!, byokKey);
    }

    const newCommit: Commit = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      message: commitMessageDraft.trim() || "Manual edit",
      config: draft!,
      promptDiffFromPrev: JSON.stringify(diffPrompt(head!.config.prompt, draft!.prompt)),
      status: "pending",
      demo: null,
      regressionResults,
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
    const forked = createAgentRecord(
      `${agent!.name} (fork)`,
      head.config,
      `Forked from ${agent!.name}`,
      agent!.id
    );
    addAgent(forked);
    router.push(`/agent/${forked.id}`);
  }

  function handlePinnedTestsChange(next: PinnedTest[]) {
    updateAgent(agent!.id, (a) => ({ ...a, pinnedTests: next }));
  }

  async function handleShare() {
    if (!head) return;
    const encoded = encodeShare({ name: agent!.name, config: head.config });
    const url = `${window.location.origin}/import?a=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
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
    <main className="flex-1 px-10 py-14">
      <div className="max-w-[1700px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar seed={agent.avatarSeed} size={60} />
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => updateAgent(agent.id, (a) => ({ ...a, name: nameDraft.trim() || a.name }))}
              className="font-serif italic font-medium text-[38px] tracking-[-0.01em] text-ink bg-transparent outline-none border-b border-transparent focus:border-line min-w-0"
            />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleShare}
              className="cursor-pointer text-[14px] font-medium h-10 px-5 rounded-[2px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors"
            >
              {shareCopied ? "Link copied" : "Share"}
            </button>
            <button
              onClick={handleFork}
              className="cursor-pointer text-[14px] font-medium h-10 px-5 rounded-[2px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors"
            >
              Fork
            </button>
            {finalized.length >= 2 && (
              <button
                onClick={() => setBisectOpen(!bisectOpen)}
                className="cursor-pointer text-[14px] font-medium h-10 px-5 rounded-[2px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors"
              >
                {bisectOpen ? "Hide bisect" : "Bisect"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <div className="space-y-7">
            <ChatPane history={agent.chatHistory} onSend={handleChatSend} disabled={!head.config.prompt.trim()} />
            <HistoryPanel commits={finalized} onRestore={handleRestore} byokKey={byokKey} />
            {bisectOpen && <BisectPanel commits={finalized} apiKey={byokKey} />}
            <PinnedTestsPanel tests={agent.pinnedTests} onChange={handlePinnedTestsChange} />
          </div>

          <div>
            {otherAgents.length > 0 && <ForkCompare agent={agent} otherAgents={otherAgents} apiKey={byokKey} />}
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
      </div>
    </main>
  );
}
