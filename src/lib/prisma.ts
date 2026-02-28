import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// At build time, Prisma resolves "file:./dev.db" relative to schema.prisma → prisma/dev.db
// At runtime, Prisma Client resolves it relative to CWD → cwd/dev.db (WRONG)
// Fix: detect the actual database location and set the correct absolute path.
function ensureDatabase() {
  const dbInPrismaDir = path.join(process.cwd(), 'prisma', 'dev.db');
  const dbInCwd = path.join(process.cwd(), 'dev.db');

  // If the DB exists in prisma/ but NOT in cwd, fix the DATABASE_URL
  if (fs.existsSync(dbInPrismaDir) && !fs.existsSync(dbInCwd)) {
    process.env.DATABASE_URL = `file:${dbInPrismaDir}`;
  }
}

ensureDatabase();

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
