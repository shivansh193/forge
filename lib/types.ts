export interface AgentConfig {
  prompt: string;
  temperature: number;
  model: string;
}

export type CommitStatus = "finalized" | "pending" | "discarded";

export interface DemoResponse {
  testPrompt: string;
  response: string;
}

export interface Commit {
  id: string;
  timestamp: string;
  message: string;
  config: AgentConfig;
  promptDiffFromPrev: string | null;
  status: CommitStatus;
  demo: DemoResponse | null;
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
}
