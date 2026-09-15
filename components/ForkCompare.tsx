"use client";

import { useMemo, useState } from "react";
import { Agent } from "@/lib/types";
import BehavioralDiff from "./BehavioralDiff";

export default function ForkCompare({
  agent,
  otherAgents,
  apiKey,
}: {
  agent: Agent;
  otherAgents: Agent[];
  apiKey: string;
}) {
  const defaultOtherId = useMemo(() => {
    if (agent.forkedFrom && otherAgents.some((a) => a.id === agent.forkedFrom)) return agent.forkedFrom;
    const child = otherAgents.find((a) => a.forkedFrom === agent.id);
    return child?.id ?? otherAgents[0]?.id ?? "";
  }, [agent, otherAgents]);

  const [otherId, setOtherId] = useState(defaultOtherId);
  const other = otherAgents.find((a) => a.id === otherId);

  const head = agent.commits.filter((c) => c.status === "finalized").at(-1);
  const otherHead = other?.commits.filter((c) => c.status === "finalized").at(-1);

  if (otherAgents.length === 0 || !head) return null;

  return (
    <div className="border border-line rounded-[16px] bg-surface p-5 mb-7">
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-line-soft">
        <span className="panel-label text-[14px]">Compare forks</span>
        <select
          value={otherId}
          onChange={(e) => setOtherId(e.target.value)}
          className="text-[13px] px-2.5 h-8 border border-line rounded-[6px] bg-surface text-ink outline-none focus:border-accent"
        >
          {otherAgents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {otherHead && (
        <BehavioralDiff
          leftLabel={agent.name}
          leftConfig={head.config}
          rightLabel={other!.name}
          rightConfig={otherHead.config}
          apiKey={apiKey}
          initialMessage={head.demo?.testPrompt ?? ""}
        />
      )}
    </div>
  );
}
