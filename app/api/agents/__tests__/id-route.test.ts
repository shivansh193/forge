import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/requireUserId", () => ({
  requireUserId: vi.fn().mockResolvedValue("user-1"),
}));

// In-memory stand-in for the Agent table, keyed the same way the real
// composite primary key is: (userId, id). Good enough to prove the route's
// upsert *logic* only ever touches the one row its request names — the
// real cross-process race (two Node request handlers actually interleaving
// against Postgres) is proven separately against the live dev server, since
// a mocked, single-threaded Prisma call can't reproduce true concurrency.
const rows = new Map<string, { id: string; userId: string; name: string; data: string }>();

vi.mock("@/lib/db", () => ({
  prisma: {
    agent: {
      upsert: vi.fn(async ({ where, create, update }: { where: { userId_id: { userId: string; id: string } }; create: { id: string; userId: string; name: string; data: string }; update: { name: string; data: string } }) => {
        const key = `${where.userId_id.userId}:${where.userId_id.id}`;
        const existing = rows.get(key);
        rows.set(key, existing ? { ...existing, ...update } : create);
      }),
      deleteMany: vi.fn(async ({ where }: { where: { userId: string; id: string } }) => {
        rows.delete(`${where.userId}:${where.id}`);
      }),
    },
  },
}));

import { PUT, DELETE } from "../[id]/route";

function putRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PUT/DELETE /api/agents/[id]", () => {
  beforeEach(() => {
    rows.clear();
  });

  it("upserts only the named agent's row", async () => {
    const agent = { id: "a", name: "Agent A", commits: [] };
    const res = await PUT(putRequest("a", agent), { params: Promise.resolve({ id: "a" }) });

    expect(res.status).toBe(200);
    expect(rows.get("user-1:a")?.name).toBe("Agent A");
  });

  it("rejects a body whose id doesn't match the URL, without writing anything", async () => {
    const res = await PUT(putRequest("a", { id: "b", name: "x" }), { params: Promise.resolve({ id: "a" }) });

    expect(res.status).toBe(400);
    expect(rows.size).toBe(0);
  });

  it("concurrent PUTs to two different agents both survive — the race the old whole-list PUT lost", async () => {
    // Seed both agents, as if a first save already happened for each.
    rows.set("user-1:a", { id: "a", userId: "user-1", name: "A", data: "{}" });
    rows.set("user-1:b", { id: "b", userId: "user-1", name: "B", data: "{}" });

    // Fire both writes "at once" (no await between them) and let their
    // promises interleave, the same way two browser tabs' in-flight fetches
    // would. Under the old deleteMany+createMany-on-the-whole-table PUT,
    // whichever of these landed second would have wiped out the other's
    // change entirely; per-row upserts can't do that to each other.
    const [resA, resB] = await Promise.all([
      PUT(putRequest("a", { id: "a", name: "A-renamed" }), { params: Promise.resolve({ id: "a" }) }),
      PUT(putRequest("b", { id: "b", name: "B-renamed" }), { params: Promise.resolve({ id: "b" }) }),
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect(rows.get("user-1:a")?.name).toBe("A-renamed");
    expect(rows.get("user-1:b")?.name).toBe("B-renamed");
  });

  it("DELETE removes only the named agent's row and is a no-op if it's already gone", async () => {
    rows.set("user-1:a", { id: "a", userId: "user-1", name: "A", data: "{}" });
    rows.set("user-1:b", { id: "b", userId: "user-1", name: "B", data: "{}" });

    const res1 = await DELETE(putRequest("a", {}), { params: Promise.resolve({ id: "a" }) });
    expect(res1.status).toBe(200);
    expect(rows.has("user-1:a")).toBe(false);
    expect(rows.has("user-1:b")).toBe(true);

    const res2 = await DELETE(putRequest("a", {}), { params: Promise.resolve({ id: "a" }) });
    expect(res2.status).toBe(200);
  });
});
