## Inspiration

Every team building on top of an LLM ends up with the same file eventually: `prompt_v2_FINAL_final.txt`. A prompt gets edited directly in production, in a config panel or a database row, with no history of what it used to say and no way to know if the new version is actually better until a real user hits it and something breaks. Code has had version control for decades. The prompt — the part of an AI agent doing the actual reasoning — usually has none. I wanted to see what happens if you just... give it one. Not a text diff bolted onto a settings page, but the real thing: commits, history, rollback, and a way to know a change is safe *before* you ship it, not after.

## What it does

Forge treats an agent's system prompt like a file under version control. Edit it, and before the edit becomes permanent, Forge writes its own realistic test message and runs the new prompt against it, so you see a real model response before deciding whether to keep the change. Keep it and it's a commit. Don't, and nothing happened.

From there it's version control built specifically for prompt *behavior*, not just prompt *text*:

- **Behavioral diff** — a text diff tells you the prompt changed; this runs one message through two versions and diffs what the agent actually said, so you can see how its behavior shifted, not just its instructions.
- **Pinned regression tests** — save a test input once, and every future commit auto-reruns it against the old and new prompt, flagging drift before you finalize anything.
- **Bisect** — run one message across an entire commit history to find exactly which commit changed the agent's behavior.
- **Fork + fork compare** — clone an agent as a new starting point, then diff behavior across forks the same way you'd diff across commits.
- Multi-model support (Gemini, OpenAI, Anthropic, swappable per agent), shareable agent links, and a handful of starter templates to try it on immediately.

## How I built it

It's a Next.js 16 / React 19 app, TypeScript throughout, Tailwind v4 for the UI. Agents — their config, commit history, and chat — live in Postgres via Prisma, hosted on Neon, with real accounts through Neon Auth (managed Better Auth) gating every route. That backend wasn't the starting point, though. Forge began as a pure client-side tool: every agent's history sat in `localStorage`, which was fast to build and meant zero infrastructure, but also meant clearing your browser deleted your work and there was no such thing as using Forge from a second device. Moving to real accounts was less "add a login screen" and more "rebuild the persistence model" — every agent read/write had to move from a browser array to a scoped database row, while the one thing that genuinely benefits from staying client-side (your pasted API keys) had to stay in `localStorage` on purpose, even after accounts existed, so a database compromise can't turn into a key leak for every user at once.

The behavioral-diff and regression system is the part I spent the most time on, because "diff two AI responses" turns out to be a much harder problem than "diff two files."

## Challenges I ran into

**Text diffing lied about regressions.** The first version of pinned regression tests flagged a commit as broken any time the new response wasn't character-for-character identical to the old one — which meant a harmless paraphrase (same answer, different wording) looked exactly like a real behavioral regression. I ended up replacing exact-match comparison with an LLM-as-judge classifier that looks at *whether the meaning changed*, not whether the string did. That one change is the difference between the regression system being trustworthy and it crying wolf on every commit.

**Accounts introduced races that `localStorage` never had.** A single-user browser array can't race against itself; a shared Postgres table can. Two concrete bugs came out of that move: the collection route used to delete-and-recreate a user's entire agent list on every save, so two saves in flight at once — two tabs, or two edits fired before the first fetch resolved — could silently clobber each other's write. I replaced that with per-agent upserts scoped to `(userId, id)`, so two agents saving at once no longer contend at all. The second was narrower but sneakier: a brand-new account's very first page load seeds its starter presets, and two concurrent first-visit requests could both see "no agents yet" and both try to create them, with the loser hitting a unique-constraint violation instead of a clean success. That one's handled by catching the specific constraint error and re-fetching rather than surfacing it as a failure — the outcome the user actually wanted (their presets exist) already happened; the loser just found that out the hard way.

**Provider reliability, times three.** Wiring up Gemini, OpenAI, and Anthropic behind one interface is the easy part. Making that resilient to a transient 500 or a rate limit from any of the three, without the UI just showing an error, meant building retry-with-backoff into the fetch layer itself and testing it against simulated failures, not just the happy path.

## What I learned

Building "safety net" tooling for AI agents means running into the same categories of bugs you'd hit building the underlying database layer for any multi-writer app — races, constraint violations, idempotency — except now they're triggered by something as mundane as opening the app in a second tab. And the hardest correctness problem in this whole project wasn't a backend one at all: deciding whether two LLM responses "mean the same thing" isn't something exact-match string comparison can ever answer, which is what pushed the regression system toward using a model to judge model output in the first place.
