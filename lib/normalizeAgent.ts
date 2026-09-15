import { Agent } from "./types";

// Backward-compat shim for records written before a field existed. No
// browser/React dependency, so it's shared by both the client-side
// useAgents() hook and the server-side /api/agents route.
export function normalizeAgent(agent: Agent): Agent {
  return {
    ...agent,
    commits: agent.commits.map((c) => ({
      ...c,
      config: { ...c.config, provider: c.config.provider ?? "gemini" },
    })),
    pinnedTests: agent.pinnedTests ?? [],
  };
}
