import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/requireUserId";
import { Agent } from "@/lib/types";

// Upsert, not update — a brand-new agent (addAgent) has never been written
// to this table before, so "replace if present, create if missing" is the
// only version of "save this agent" that works for both a first save and
// every save after it. Scoped to one (userId, id) row, so two of these in
// flight for two different agents never contend with each other the way the
// old whole-list PUT on the collection route did.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  const agent = (await req.json()) as Agent;

  if (agent.id !== id) {
    return NextResponse.json({ error: "Agent id in body must match the URL." }, { status: 400 });
  }

  await prisma.agent.upsert({
    where: { userId_id: { userId, id } },
    create: { id, userId, name: agent.name, data: JSON.stringify(agent) },
    update: { name: agent.name, data: JSON.stringify(agent) },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;

  // deleteMany rather than delete — deleting an id that's already gone
  // (double-click, stale tab) should be a no-op, not a 500 from Prisma's
  // "record to delete does not exist" on a bare delete().
  await prisma.agent.deleteMany({ where: { userId, id } });

  return NextResponse.json({ ok: true });
}
