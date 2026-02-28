import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// On Netlify serverless (Lambda), the filesystem is read-only.
// Copy the pre-seeded SQLite database to /tmp (writable) at runtime.
function ensureDatabase() {
  if (process.env.NETLIFY && process.env.NODE_ENV === 'production') {
    const tmpDb = '/tmp/dev.db';
    if (!fs.existsSync(tmpDb)) {
      // Look for the bundled database in the function package
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
        '/var/task/prisma/dev.db',
      ];
      for (const src of candidates) {
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, tmpDb);
          break;
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDb}`;
  }
}

ensureDatabase();

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
