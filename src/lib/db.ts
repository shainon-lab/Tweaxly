// Hard guard: any client component (transitively) importing db.ts will
// fail the build with a clear error instead of silently bundling
// @prisma/client into the browser. The previous incident had a stale
// PrismaClient instance leak into the layout's client chunk; this
// import makes that class of bug impossible to merge.
import "server-only";
import { PrismaClient } from "@prisma/client";

// Global singleton so dev-mode hot-reload doesn't pile up connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Base client. The exported `prisma` below extends it with a global
// soft-delete filter on Transaction reads — trashed rows (deletedAt
// not null) are invisible to every findMany / findFirst / count /
// aggregate / groupBy in the app. Writes pass through unchanged so
// the trash API can still set deletedAt and the restore API can clear
// it via raw updateMany; findUnique is also NOT filtered so the
// restore flow can look a trashed row up by id.
const base = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

export const prisma = base.$extends({
  name: "soft-delete-transactions",
  query: {
    transaction: {
      async findMany({ args, query }) {
        args.where = mergeDeletedAtNull(args.where);
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = mergeDeletedAtNull(args.where);
        return query(args);
      },
      async findFirstOrThrow({ args, query }) {
        args.where = mergeDeletedAtNull(args.where);
        return query(args);
      },
      async count({ args, query }) {
        args.where = mergeDeletedAtNull(args.where ?? {});
        return query(args);
      },
      async aggregate({ args, query }) {
        args.where = mergeDeletedAtNull(args.where ?? {});
        return query(args);
      },
      async groupBy({ args, query }) {
        args.where = mergeDeletedAtNull(args.where ?? {});
        return query(args);
      },
    },
  },
});

// Merge `deletedAt: null` into a where clause without clobbering an
// explicit deletedAt passed by the caller (the trash API DOES want
// to query trashed rows). Operates on an opaque type to stay
// compatible with Prisma's generated WhereInput shapes.
function mergeDeletedAtNull<T extends Record<string, unknown> | undefined>(where: T): T {
  if (!where) return ({ deletedAt: null } as unknown) as T;
  if ("deletedAt" in where) return where;
  return ({ ...where, deletedAt: null } as unknown) as T;
}

// Type alias for the extended client. Re-exported so helpers that
// accept a Prisma client (e.g. updateMarketingPreferences, suppressEmail)
// can type their param compatibly with the soft-delete extension.
export type Db = typeof prisma;
