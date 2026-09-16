import { auth } from "./server";

// proxy.ts already redirects unauthenticated page loads to /auth/sign-in,
// but the /api/agents* routes can be hit directly (fetch from a stale tab,
// curl, etc.), so each one re-checks the session itself rather than
// trusting the caller got past middleware. Shared here instead of
// duplicated per route file.
export async function requireUserId(): Promise<string | null> {
  const { data } = await auth.getSession();
  return data?.user?.id ?? null;
}
