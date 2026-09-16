import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/requireUserId";
import { getPresetAgents } from "@/lib/presets";
import { normalizeAgent } from "@/lib/normalizeAgent";
import { Agent } from "@/lib/types";

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

// Writes are per-agent now (see app/api/agents/[id]/route.ts) — a whole-list
// PUT here deleted and recreated every row in the user's workspace on each
// save, so two saves in flight at once (two tabs, or two edits fired before
// the first fetch resolved) raced and the loser's change vanished silently.
// Nothing calls this collection route with anything but GET anymore.
