"use strict";
/**
 * Simple in-memory cache service
 * For production, consider using Redis or similar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = void 0;
class CacheService {
    constructor() {
        this.cache = new Map();
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    /**
     * Set cache entry with TTL in seconds
     */
    set(key, data, ttlSeconds = 300) {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { data, expiresAt });
    }
    /**
     * Get cache entry
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Delete cache entry
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get or set cache entry
     */
    async getOrSet(key, fetchFn, ttlSeconds = 300) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        const data = await fetchFn();
        this.set(key, data, ttlSeconds);
        return data;
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * Invalidate cache entries by pattern
     */
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Cleanup on process exit
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }
}
exports.default = new CacheService();
// Cache key generators
exports.CacheKeys = {
    affiliateAnalytics: () => 'affiliate:analytics:overview',
    affiliateTopPerformers: () => 'affiliate:top-performers',
    affiliateApplications: (status, page) => `affiliate:applications:${status || 'all'}:${page || 1}`,
    affiliateList: (status, search, page) => `affiliate:list:${status || 'all'}:${search || 'none'}:${page || 1}`,
    affiliatePayouts: (status, page) => `affiliate:payouts:${status || 'all'}:${page || 1}`,
    affiliatePerformance: (affiliateId, days) => `affiliate:performance:${affiliateId}:${days}`,
};
