import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";
import { getPresetAgents } from "@/lib/presets";
import { normalizeAgent } from "@/lib/normalizeAgent";
import { Agent } from "@/lib/types";

export async function GET() {
  const sessionId = await getSessionId();
  const rows = await prisma.agent.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });

  if (rows.length === 0) {
    const presets = getPresetAgents();
    await prisma.agent.createMany({
      data: presets.map((a) => ({ id: a.id, sessionId, name: a.name, data: JSON.stringify(a) })),
    });
    return NextResponse.json({ agents: presets });
  }

  const agents = rows.map((r) => normalizeAgent(JSON.parse(r.data) as Agent));
  return NextResponse.json({ agents });
}

export async function PUT(req: NextRequest) {
  const sessionId = await getSessionId();
  const body = await req.json();
  const agents = body.agents;

  if (!Array.isArray(agents)) {
    return NextResponse.json({ error: "Expected { agents: Agent[] }." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.agent.deleteMany({ where: { sessionId } }),
    ...(agents.length > 0
      ? [
          prisma.agent.createMany({
            data: (agents as Agent[]).map((a) => ({
              id: a.id,
              sessionId,
              name: a.name,
              data: JSON.stringify(a),
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
