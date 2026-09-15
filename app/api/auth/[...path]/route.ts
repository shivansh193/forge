import { auth } from "@/lib/auth/server";

// Catch-all proxy for every Neon Auth operation (sign-up, sign-in,
// sign-out, session refresh, …) — the client SDK and proxy.ts's middleware
// both call into paths under here, never Neon directly.
export const { GET, POST } = auth.handler();
