"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithEmail } from "./actions";

const inputClass =
  "w-full text-[14px] px-3.5 h-11 border border-line rounded-[6px] bg-surface text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold text-ink justify-center mb-8">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
          </svg>
          Forge
        </Link>

        <div className="border border-line rounded-[16px] bg-surface p-6">
          <h1 className="font-serif italic font-medium text-[26px] text-ink text-center mb-1">Welcome back</h1>
          <p className="text-[13px] text-ink-faint text-center mb-6">Sign in to pick up where you left off.</p>

          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <label className="block field-label mb-2 text-[13px]">Email</label>
              <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block field-label mb-2 text-[13px]">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {state?.error && <div className="text-[13px] text-bad">{state.error}</div>}

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 cursor-pointer text-[14px] font-medium h-11 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 transition-colors"
            >
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-[13px] text-ink-faint text-center mt-5">
          New to Forge?{" "}
          <Link href="/auth/sign-up" className="text-accent font-medium">
            Create a workspace
          </Link>
        </p>
      </div>
    </main>
  );
}
