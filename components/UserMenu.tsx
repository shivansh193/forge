"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { resetAgentsCache } from "@/lib/storage";

// Renders nothing while the session is loading or absent — proxy.ts means
// this only ever mounts on a page that already required a session, so the
// "absent" case is really just the instant between mount and the client
// session fetch resolving, not a real signed-out state to design for.
export default function UserMenu({ compact = false }: { compact?: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending || !session?.user) return <div className={compact ? "w-16 h-8" : "h-10"} />;

  async function handleSignOut() {
    await authClient.signOut();
    // Must run before the navigation below — otherwise the next account to
    // sign in in this tab could see a flash of this account's agent list
    // pulled from the in-memory cache (see lib/storage.ts).
    resetAgentsCache();
    router.push("/auth/sign-in");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        onClick={handleSignOut}
        className="cursor-pointer text-[12.5px] font-medium h-8 px-3 rounded-[6px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors shrink-0"
      >
        Sign out
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-ink-muted truncate">{session.user.name}</div>
        <div className="text-[11px] text-ink-subtle truncate">{session.user.email}</div>
      </div>
      <button
        onClick={handleSignOut}
        className="cursor-pointer text-[12px] font-medium h-8 px-3 rounded-[6px] bg-surface text-ink-muted border border-line hover:bg-surface-soft transition-colors shrink-0"
      >
        Sign out
      </button>
    </div>
  );
}
