# Forge — git for AI agent prompts

Editing an AI agent's system prompt has no safety net. Change one line, ship it, and you find out it broke something when a user hits it — there's no history of what changed, no way to preview a change before it's live. Most teams fall back to a shared doc: `prompt_v2_FINAL_final.txt`.

Forge treats a prompt like code: every agent keeps a real commit history. Edit the prompt, and before anything is permanent, Forge writes its own realistic test message, runs the new version against it, and shows you the result. Keep it and it becomes a real commit. Roll back and nothing changed.

**[Architecture diagram](architecture.svg)** · Built for the AI Builders Hackathon.

## What it does

- **Commit-based versioning** — real word-level diffs and history for every agent's prompt, not autosave.
- **Demo before you commit** — an AI writes a realistic test message from the prompt itself and runs the proposed version against it, so you see a real response before deciding to keep it.
- **Behavioral diff** — a text diff only shows the prompt changed; this runs one message through two versions and diffs the actual outputs, so you see how the agent's behavior changed, not just its instructions.
- **Pinned regression tests** — save test inputs on an agent; every new commit auto-reruns them against the old and new prompt and flags any output that drifted, before you finalize the commit.
- **Bisect** — run one message across an agent's entire commit history to pinpoint which commit introduced a behavior change.
- **Fork compare** — the same behavioral diff, applied across two forks instead of two commits, to see how they've diverged.
- **One-click rollback** — discard a bad version instantly; nothing overwrites silently.
- **Fork** — clone any agent's current version as the starting point for a new one.
- **Multi-model** — Gemini, OpenAI, or Anthropic per agent, swappable from a dropdown.
- **Shareable links** — an agent's config is encoded directly into a URL (no backend to store it), so anyone can open the link and import it into their own workspace.
- **Starter templates** — resume builder, code reviewer, customer support agent, SQL assistant, cold email writer.

## Why local-first

Forge has no server database and no accounts — an agent's config, commit history, and chat all live in the browser's `localStorage`. That's a deliberate choice, not a missing feature: zero setup, nothing to sign up for, and your prompts never leave your machine unless you explicitly generate a share link. The trade-off is real and worth stating plainly: there's no cross-device sync, and clearing your browser data clears your agents. A team-workspace backend is the natural next step (see Roadmap below) — this version optimizes for "open the link and start using it," not for team infrastructure.

## Running it locally

```bash
npm install
cp .env.local.example .env.local   # add your Gemini key, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your-gemini-key-here
```

This is the **shared fallback key for Gemini only** — get a free one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Gemini is the only provider with a server-side fallback; if you don't set this, every agent using Gemini will need a key pasted into its own Config panel instead.

**OpenAI and Anthropic have no shared key.** To use either provider, paste your own API key into the agent's Config panel — it's sent only with that request, never logged or stored on the server.

## Tech stack

- **Next.js 16 / React 19**, App Router, Turbopack
- **Tailwind CSS v4** with a custom design token system (see `app/globals.css`)
- **TypeScript** throughout, including the client/server boundary in `lib/llm.ts`
- No database, no auth — `localStorage` on the client, three thin Next.js API routes on the server (`/api/chat`, `/api/test-prompt`) that fan out to whichever model provider the agent is set to (`lib/providers/`)

## Known limitations

- No cross-device sync — an agent lives in the browser that created it, until shared.
- OpenAI and Anthropic completions are untested against a live key in this build; the request/response plumbing and error paths are verified, the actual model output is not.
- Bisect and fork compare re-run one message per commit/fork sequentially in the browser — fine at the scale of a single agent's history, not built for hundreds of commits.

## Roadmap

- Team workspaces — a real backend so commit history is shared, not per-browser.
- Streaming responses in chat and demo previews.
- A public template/agent marketplace, built on the existing share/import mechanism.
- Direct API access to a committed prompt version — the path from "tested" to "in production."
