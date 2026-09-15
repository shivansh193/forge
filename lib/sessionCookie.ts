// No accounts — this cookie is the entire identity model. Whoever holds it
// owns the agents scoped to it, the same trust model as "whoever has this
// browser's localStorage" that it replaces.
//
// Split into its own file (no next/headers import) so middleware.ts, which
// runs in the Edge runtime, can share the cookie name with lib/session.ts
// (used from Route Handlers) without pulling in a Node-only API.
export const SESSION_COOKIE = "forge_session";

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};
