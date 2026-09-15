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

## Architecture: no accounts, but a real backend

Agents — config, commit history, chat — persist server-side in Postgres (via Prisma), not in `localStorage`. There's still no signup: a random session cookie, set on your first request, is your workspace identity. That gets you the win a database is actually for — clearing your browser's site data no longer destroys your agents, and the app can now run on a server instead of purely in one tab — without asking anyone to create an account to try it.

Be precise about what this is *not*: it's not yet cross-device sync. The session cookie is still bound to one browser, the same trust boundary `localStorage` had — open the app in a different browser and you get a fresh, empty workspace. Real accounts (email/password or magic-link, swapping the session cookie for a login) are the next step to make "your agents everywhere" true; see Roadmap.

The API key you paste for OpenAI/Anthropic (or your own Gemini key) stays in `localStorage`, deliberately *not* moved into the database — it's a secret, and this session model has no login to gate who could otherwise read it back out.

If you used Forge before this change, anything saved in that old `localStorage` array is still on disk. The first time you open the app, a banner offers to import it into your new server-backed workspace.

## Running it locally

Forge needs a Postgres database — [Neon](https://neon.tech) has a free tier that takes about two minutes to set up and works well with Prisma + serverless. Create a project there and grab two connection strings from the dashboard: the **pooled** one and the **direct** one (same string, the pooled host has `-pooler` in it, the direct one doesn't).

```bash
npm install
cp .env.local.example .env.local   # add your Gemini key and both DB URLs, see below
npx prisma migrate dev             # applies the schema to your database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your-gemini-key-here
DATABASE_URL="your-neon-pooled-connection-string"
DIRECT_URL="your-neon-direct-connection-string"
```

`GEMINI_API_KEY` is the **shared fallback key for Gemini only** — get a free one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Gemini is the only provider with a server-side fallback; if you don't set this, every agent using Gemini will need a key pasted into its own Config panel instead.

**OpenAI and Anthropic have no shared key.** To use either provider, paste your own API key into the agent's Config panel — it's sent only with that request, never logged or stored on the server.

`DATABASE_URL` (pooled) is what the running app uses; `DIRECT_URL` (unpooled) is what `prisma migrate` uses — Prisma needs a direct connection to run schema migrations, and a pooled one (via PgBouncer) to behave well under serverless. Prisma's CLI reads a plain `.env` (not `.env.local`), so also copy both lines into a root `.env` file, or migrations will fail to find them.

### Deploying on Vercel

Set the same three env vars (`GEMINI_API_KEY`, `DATABASE_URL`, `DIRECT_URL`) in the Vercel project's Settings → Environment Variables, then deploy. `npx prisma generate` runs automatically via the `postinstall` script, so the client is ready before the build; the schema itself needs to be pushed to the database once via `npx prisma migrate deploy` (run it locally against the same `DATABASE_URL`/`DIRECT_URL` you set in Vercel, or wire it into a deploy hook) before the first request hits `/api/agents`.

## Tech stack

- **Next.js 16 / React 19**, App Router, Turbopack
- **Tailwind CSS v4** with a custom design token system (see `app/globals.css`)
- **TypeScript** throughout, including the client/server boundary in `lib/llm.ts`
- **Postgres via Prisma** (`prisma/schema.prisma`), hosted on [Neon](https://neon.tech) — one `Agent` row per agent, scoped by an anonymous session id; `proxy.ts` assigns that session cookie on first visit
- Four Next.js API routes (`/api/agents`, `/api/chat`, `/api/test-prompt`) — the first is the persistence layer, the other two fan out to whichever model provider the agent is set to (`lib/providers/`)
- `localStorage` only for the one thing that shouldn't touch the server: your own pasted API keys

## Known limitations

- Not cross-device — the session cookie, like the `localStorage` it replaced, is bound to one browser. See Architecture above.
- OpenAI and Anthropic completions are untested against a live key in this build; the request/response plumbing and error paths are verified, the actual model output is not.
- Bisect and fork compare re-run one message per commit/fork sequentially in the browser — fine at the scale of a single agent's history, not built for hundreds of commits.
- `/api/agents` persists by replacing a session's entire agent list on every save (mirrors the old `localStorage` write pattern) — fine for one browser tab at a time, but two tabs saving concurrently can clobber each other's writes. No real risk until real multi-device use exists.

## Roadmap

- Real accounts (email/password or magic link) in place of the anonymous session cookie — the actual unlock for cross-device sync, building on the database work already done.
- Streaming responses in chat and demo previews.
- A public template/agent marketplace, built on the existing share/import mechanism.
- Direct API access to a committed prompt version — the path from "tested" to "in production."
