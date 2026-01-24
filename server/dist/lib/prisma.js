"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * PrismaClient singleton instance
 * Prevents multiple instances in development (hot reload) and ensures
 * proper connection pooling across the application
 */
const globalForPrisma = globalThis;
// Create SQLite database connection
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
// Ensure DATABASE_URL is set in environment for Prisma's internal use
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
}
let dbPath = databaseUrl.replace('file:', '');
// Resolve relative paths relative to server directory
if (!path_1.default.isAbsolute(dbPath)) {
    // __dirname is available in CommonJS
    dbPath = path_1.default.resolve(__dirname, '..', '..', dbPath);
}
console.log('Database path:', {
    originalUrl: databaseUrl,
    resolvedPath: dbPath,
    isAbsolute: path_1.default.isAbsolute(dbPath),
    exists: fs_1.default.existsSync(dbPath),
});
// Create absolute URL for adapter (use absolute path)
const absoluteDatabaseUrl = `file:${dbPath}`;
// Ensure DATABASE_URL is set with absolute path for adapter's internal use
process.env.DATABASE_URL = absoluteDatabaseUrl;
// Create Prisma adapter with URL option
// The adapter will create the database instance from the URL
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({
    url: absoluteDatabaseUrl,
});
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Test database connection on startup
exports.prisma.$connect()
    .then(() => {
    console.log('Database connected successfully');
})
    .catch((error) => {
    console.error('Database connection error:', error);
});
