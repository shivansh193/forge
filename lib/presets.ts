import { Agent } from "./types";

const now = () => new Date().toISOString();

const RESUME_PROMPT = `You are a personal resume-writing assistant for a job candidate.

Candidate background: Full-stack engineer, 4 years of experience. Built React/Node web apps and Python data pipelines at two early-stage startups. Shipped a real-time analytics dashboard now used by 50+ paying customers. Comfortable with TypeScript, Next.js, PostgreSQL, and AWS. Led a 3-person engineering team for 6 months during a product rewrite. Open to backend-leaning or full-stack roles.

When the user gives you a job description, write:
1. A tailored 3-sentence resume summary.
2. 4-5 bullet points of relevant experience, phrased with strong action verbs and quantified where possible.

Match tone and seniority to the job description. Do not invent facts beyond what's implied by the background above.`;

const REVIEWER_PROMPT = `You are a senior code reviewer doing a quick pass on a pull request diff.

When the user pastes a diff or describes a change, respond with:
1. A one-line verdict: Looks good / Needs changes / Needs discussion.
2. Up to 3 specific issues, each citing the exact line or pattern and why it matters (correctness, security, or maintainability only — skip style nitpicks).
3. One thing done well, if there genuinely is one.

Be direct and specific. Never invent issues that aren't grounded in the actual diff shown.`;

function seedAgent(id: string, name: string, avatarSeed: string, prompt: string, temperature: number): Agent {
  const commitId = `${id}-c0`;
  return {
    id,
    name,
    avatarSeed,
    createdAt: now(),
    commits: [
      {
        id: commitId,
        timestamp: now(),
        message: "Initial version",
        config: { provider: "gemini", prompt, temperature, model: "gemini-flash-lite-latest" },
        promptDiffFromPrev: null,
        status: "finalized",
        demo: null,
      },
    ],
    chatHistory: [],
  };
}

export function getPresetAgents(): Agent[] {
  return [
    seedAgent("resume-builder", "Resume Builder", "resume-builder", RESUME_PROMPT, 0.6),
    seedAgent("code-reviewer", "Code Reviewer", "code-reviewer", REVIEWER_PROMPT, 0.3),
  ];
}
