import { auth } from "@/lib/auth/server";

// Replaces the old anonymous-cookie proxy: instead of stamping a random
// session id on every visitor, this redirects anyone without a valid Neon
// Auth session to /auth/sign-in. @neondatabase/auth's middleware already
// exempts /api/auth/* and the /auth/sign-in, /auth/sign-up routes it needs
// to reach to let someone actually log in (see DEFAULT_AUTH_SKIP_ROUTES in
// the package) — no manual carve-out needed here.
export const proxy = auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
