import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth/requireUserId", () => ({
  requireUserId: vi.fn().mockResolvedValue("race-user"),
}));

// In-memory stand-in for the Agent table, keyed like the real composite
// primary key: (userId, id). createMany enforces that key the same way
// Postgres does — throwing a P2002 PrismaClientKnownRequestError on a
// collision — so this reproduces the actual concurrent-first-visit race
// (two GETs both seeing an empty table before either createMany commits)
// without needing a live database.
const rows = new Map<string, { id: string; userId: string; name: string; data: string }>();

vi.mock("@/lib/db", () => ({
  prisma: {
    agent: {
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        [...rows.values()].filter((r) => r.userId === where.userId)
      ),
      createMany: vi.fn(async ({ data }: { data: { id: string; userId: string; name: string; data: string }[] }) => {
        for (const row of data) {
          const key = `${row.userId}:${row.id}`;
          if (rows.has(key)) {
            throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`userId`,`id`)", {
              code: "P2002",
              clientVersion: "6.19.3",
            });
          }
        }
        for (const row of data) rows.set(`${row.userId}:${row.id}`, row);
      }),
    },
  },
}));

import { GET } from "../route";

describe("GET /api/agents seeding race", () => {
  beforeEach(() => {
    rows.clear();
  });

  it("two concurrent first-visit requests both get exactly the two presets, not a 500 and not four rows", async () => {
    const [resA, resB] = await Promise.all([GET(), GET()]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const bodyA = await resA.json();
    const bodyB = await resB.json();

    expect(bodyA.agents).toHaveLength(2);
    expect(bodyB.agents).toHaveLength(2);
    expect(bodyA.agents.map((a: { id: string }) => a.id).sort()).toEqual(["code-reviewer", "resume-builder"]);
    expect(bodyB.agents.map((a: { id: string }) => a.id).sort()).toEqual(["code-reviewer", "resume-builder"]);

    // The database itself only ever ended up with one copy per preset —
    // the race didn't silently double-seed, and the loser recovered by
    // reading back what the winner had already committed.
    const stored = [...rows.values()].filter((r) => r.userId === "race-user");
    expect(stored).toHaveLength(2);
  });

  it("a normal (non-race) first visit still seeds and returns the two presets", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agents).toHaveLength(2);
  });

  it("a returning user's existing rows are returned as-is, without reseeding", async () => {
    rows.set("race-user:custom", {
      id: "custom",
      userId: "race-user",
      name: "Custom",
      data: JSON.stringify({ id: "custom", name: "Custom", commits: [] }),
    });

    const res = await GET();
    const body = await res.json();
    expect(body.agents).toHaveLength(1);
    expect(body.agents[0].id).toBe("custom");
  });
});
