import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * PrismaClient singleton instance
 * Prevents multiple instances in development (hot reload) and ensures
 * proper connection pooling across the application
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create SQLite database connection
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Ensure DATABASE_URL is set in environment for Prisma's internal use
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

let dbPath = databaseUrl.replace('file:', '');

// Resolve relative paths relative to server directory
if (!path.isAbsolute(dbPath)) {
  // __dirname is available in CommonJS
  dbPath = path.resolve(__dirname, '..', '..', dbPath);
}

console.log('Database path:', {
  originalUrl: databaseUrl,
  resolvedPath: dbPath,
  isAbsolute: path.isAbsolute(dbPath),
  exists: fs.existsSync(dbPath),
});

// Create absolute URL for adapter (use absolute path)
const absoluteDatabaseUrl = `file:${dbPath}`;

// Ensure DATABASE_URL is set with absolute path for adapter's internal use
process.env.DATABASE_URL = absoluteDatabaseUrl;

// Create Prisma adapter with URL option
// The adapter will create the database instance from the URL
const adapter = new PrismaBetterSqlite3({
  url: absoluteDatabaseUrl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
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
  .catch((error) => {
    console.error('Database connection error:', error);
  });