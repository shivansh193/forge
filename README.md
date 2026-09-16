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

## Architecture: real accounts, a real backend

Agents — config, commit history, chat — persist server-side in Postgres (via Prisma), scoped to your account. Signing up creates a real user via [Neon Auth](https://neon.com/docs/auth/overview) (Neon's managed Better Auth — email/password, session cookie handled for you); every `Agent` row is keyed by that user's id instead of a browser-bound session. `proxy.ts` redirects any request without a valid session to `/auth/sign-in`, so the whole app — the agent list, every agent's detail page, the API routes that read or write them — requires being signed in.

This *is* cross-device sync, for real: sign in from a different browser or machine and your agents are there, because the identity is an account, not a cookie tied to one browser. `neon_auth.user` (the table Neon Auth manages in the same Postgres database) is the source of truth for who that account belongs to; see the comment on the `Agent` model in `prisma/schema.prisma` for why we read that id at request time rather than declaring a Prisma-level foreign key into a schema Neon Auth owns and migrates independently.

The API key you paste for OpenAI/Anthropic (or your own Gemini key) still stays in `localStorage`, not the database. That was originally because there was no login to gate who could read it back — now that there is a login, the reasoning is different: this app has no encryption-at-rest story, so moving pasted keys into Postgres would turn "one browser's localStorage" into "every user's key in one table" as the blast radius of a database compromise, for no capability this app currently needs (every use of a key happens while its owner is at the keyboard, in the same request that already carries it). See the comment on `useByokKey` in `lib/storage.ts`.

If you used Forge before accounts existed, anything saved in that old `localStorage` array is still on disk. The first time you sign in, a banner offers to import it into your account's workspace.

## Running it locally

Forge needs a Postgres database with Neon Auth enabled — [Neon](https://neon.tech) has a free tier that takes about two minutes to set up. Create a project there, then enable Neon Auth for it (Neon Console → your project → **Auth** tab → Enable, or `npx neon@latest neon-auth enable --project-id <id>`) — this provisions Better Auth tables in a `neon_auth` schema inside the same database, no separate service to run.

```bash
npm install
cp .env.local.example .env.local   # add your keys and DB/auth URLs, see below
npx prisma migrate dev             # applies the schema to your database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account — every page past `/auth/sign-in` requires one.

### Environment variables

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your-gemini-key-here
DATABASE_URL="your-neon-pooled-connection-string"
DIRECT_URL="your-neon-direct-connection-string"
NEON_AUTH_BASE_URL="your-neon-auth-url"
NEON_AUTH_COOKIE_SECRET="a-random-32+-character-secret"
```

`GEMINI_API_KEY` is the **shared fallback key for Gemini only** — get a free one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Gemini is the only provider with a server-side fallback; if you don't set this, every agent using Gemini will need a key pasted into its own Config panel instead.

**OpenAI and Anthropic have no shared key.** To use either provider, paste your own API key into the agent's Config panel — it's sent only with that request, never logged or stored on the server.

`DATABASE_URL` (pooled) is what the running app uses; `DIRECT_URL` (unpooled) is what `prisma migrate` uses — Prisma needs a direct connection to run schema migrations, and a pooled one (via PgBouncer) to behave well under serverless. Prisma's CLI reads a plain `.env` (not `.env.local`), so also copy both DB lines into a root `.env` file, or migrations will fail to find them.

`NEON_AUTH_BASE_URL` is the Better Auth endpoint Neon provisioned for your project — copy it from Neon Console → your project → **Auth** → Configuration (or `npx neon@latest neon-auth status --project-id <id>`, the `Base URL` field). `NEON_AUTH_COOKIE_SECRET` is **not** from Neon — it's a secret this app generates to sign its own session cookie; create one with `openssl rand -base64 32` (minimum 32 characters). Both only need to live in `.env.local`, not `.env` — Prisma's CLI never reads them.

### Deploying on Vercel

Set all five env vars (`GEMINI_API_KEY`, `DATABASE_URL`, `DIRECT_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`) in the Vercel project's Settings → Environment Variables, then deploy. `npx prisma generate` runs automatically via the `postinstall` script, so the client is ready before the build; the schema itself needs to be pushed to the database once via `npx prisma migrate deploy` (run it locally against the same `DATABASE_URL`/`DIRECT_URL` you set in Vercel, or wire it into a deploy hook) before the first request hits `/api/agents`. Use a different `NEON_AUTH_COOKIE_SECRET` in production than the one in your local `.env.local`.

## Tech stack

- **Next.js 16 / React 19**, App Router, Turbopack
- **Tailwind CSS v4** with a custom design token system (see `app/globals.css`)
- **TypeScript** throughout, including the client/server boundary in `lib/llm.ts`
- **Postgres via Prisma** (`prisma/schema.prisma`), hosted on [Neon](https://neon.tech) — one `Agent` row per agent, scoped by the signed-in user's id
- **[Neon Auth](https://neon.com/docs/auth/overview)** (managed Better Auth) for accounts — `lib/auth/server.ts`/`lib/auth/client.ts` wrap the SDK, `app/api/auth/[...path]/route.ts` mounts it, `proxy.ts` gates every route behind a session
- Five Next.js API routes (`/api/agents`, `/api/chat`, `/api/test-prompt`, `/api/auth/*`) — `/api/agents` is the persistence layer, `/api/chat` and `/api/test-prompt` fan out to whichever model provider the agent is set to (`lib/providers/`), `/api/auth/*` is Neon Auth's handler
- `localStorage` only for the one thing that shouldn't touch the server: your own pasted API keys

## Known limitations

- OpenAI and Anthropic completions are untested against a live key in this build; the request/response plumbing and error paths are verified, the actual model output is not.
- Bisect and fork compare re-run one message per commit/fork sequentially in the browser — fine at the scale of a single agent's history, not built for hundreds of commits.
- `/api/agents` persists by replacing your entire agent list on every save (mirrors the old `localStorage` write pattern) — fine for one tab at a time, but two tabs (or two devices) saving concurrently can clobber each other's writes. Real now that accounts make multi-device use real too, just not addressed yet.

## Roadmap

- Streaming responses in chat and demo previews.
- A public template/agent marketplace, built on the existing share/import mechanism.
- Direct API access to a committed prompt version — the path from "tested" to "in production."
