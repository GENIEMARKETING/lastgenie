// Use require to avoid Prisma ESM/CJS issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');

// Type alias for PrismaClient
type PrismaClientType = any;

/**
 * PrismaClient singleton instance
 * Prevents multiple instances in development (hot reload) and ensures
 * proper connection pooling across the application
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required (PostgreSQL connection string).');
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error: any) => {
    console.error('Database connection error:', error);
  });