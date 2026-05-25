import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // In development avoid Prisma printing raw errors to console which
    // can be noisy when the database is temporarily unreachable.
    // Keep warnings visible.
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
