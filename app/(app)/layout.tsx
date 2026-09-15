import Sidebar from "@/components/Sidebar";
import MobileTopBar from "@/components/MobileTopBar";

// Everything under this route group requires a signed-in session (enforced
// by proxy.ts, which redirects to /auth/sign-in before any of these pages
// render) — that's what makes it safe for Sidebar to eagerly fetch
// /api/agents and show account-scoped state.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar />
        {children}
      </div>
    </div>
  );
}
