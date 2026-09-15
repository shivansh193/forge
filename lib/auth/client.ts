"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Client-side counterpart to lib/auth/server.ts — talks to /api/auth/*
// (mounted from auth.handler()) rather than hitting Neon directly, so the
// browser never needs to know NEON_AUTH_BASE_URL. Used for the
// sign-in/sign-up forms' pending state and for reading the live session
// (authClient.useSession()) in client components like the sidebar's
// sign-out control.
export const authClient = createAuthClient();
