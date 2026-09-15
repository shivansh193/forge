import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in dev — Next.js dev mode
// re-evaluates modules on every edit, which would otherwise open a new
// SQLite connection per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
