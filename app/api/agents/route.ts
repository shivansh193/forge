import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { getPresetAgents } from "@/lib/presets";
import { normalizeAgent } from "@/lib/normalizeAgent";
import { Agent } from "@/lib/types";

// proxy.ts already redirects unauthenticated page loads to /auth/sign-in,
// but this route can be hit directly (fetch from a stale tab, curl, etc.),
// so it re-checks the session itself rather than trusting the caller got
// past middleware.
async function requireUserId(): Promise<string | null> {
  const { data } = await auth.getSession();
  return data?.user?.id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const rows = await prisma.agent.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  if (rows.length === 0) {
    const presets = getPresetAgents();
    await prisma.agent.createMany({
      data: presets.map((a) => ({ id: a.id, userId, name: a.name, data: JSON.stringify(a) })),
    });
    return NextResponse.json({ agents: presets });
  }

  const agents = rows.map((r) => normalizeAgent(JSON.parse(r.data) as Agent));
  return NextResponse.json({ agents });
}

export async function PUT(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const agents = body.agents;

  if (!Array.isArray(agents)) {
    return NextResponse.json({ error: "Expected { agents: Agent[] }." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.agent.deleteMany({ where: { userId } }),
    ...(agents.length > 0
      ? [
          prisma.agent.createMany({
            data: (agents as Agent[]).map((a) => ({
              id: a.id,
              userId,
              name: a.name,
              data: JSON.stringify(a),
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
