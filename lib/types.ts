export type Provider = "gemini" | "openai" | "anthropic";

export interface AgentConfig {
  provider: Provider;
  prompt: string;
  temperature: number;
  model: string;
}

export type CommitStatus = "finalized" | "pending" | "discarded";

export interface DemoResponse {
  testPrompt: string;
  response: string;
}

export interface PinnedTest {
  id: string;
  label: string;
  input: string;
}

export interface RegressionResult {
  testId: string;
  label: string;
  input: string;
  prevOutput: string | null;
  newOutput: string | null;
  changed: boolean;
  // The judge's one-line explanation for "changed" when a judge call ran
  // (lib/judge.ts), or a note that it fell back to the text-diff heuristic
  // because the judge call failed. Null when no judge call was made at all
  // (outputs were byte-identical, or the whole test errored).
  reason: string | null;
  error: string | null;
}

export interface Commit {
  id: string;
  timestamp: string;
  message: string;
  config: AgentConfig;
  promptDiffFromPrev: string | null;
  status: CommitStatus;
  demo: DemoResponse | null;
  regressionResults?: RegressionResult[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  commitId: string;
}

export interface Agent {
  id: string;
  name: string;
  avatarSeed: string;
  createdAt: string;
  commits: Commit[];
  chatHistory: ChatMessage[];
  pinnedTests: PinnedTest[];
  forkedFrom?: string;
}
