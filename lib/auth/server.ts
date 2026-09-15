import { createNeonAuth } from "@neondatabase/auth/next/server";

// Single entry point for everything server-side: session reads in Route
// Handlers/Server Components, the sign-up/sign-in/sign-out calls in Server
// Actions, the /api/auth/* handler, and proxy.ts's route protection all go
// through this one instance (see @neondatabase/auth's own docs — creating
// more than one instance means each gets its own in-memory session cache).
//
// baseUrl points at the Better Auth endpoint Neon provisioned for this
// project (Neon Console → Project → Auth); the cookie secret is ours, not
// Neon's — it signs the session cookie this app hands back to the browser,
// so it must stay a server-only secret distinct from anything in the Neon
// dashboard.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
