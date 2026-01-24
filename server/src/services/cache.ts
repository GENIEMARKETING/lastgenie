/**
 * Simple in-memory cache service
 * For production, consider using Redis or similar
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Set cache entry with TTL in seconds
   */
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Get cache entry
   */
  get(key: string): any | null {
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
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set cache entry
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
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
  private cleanup(): void {
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
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
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
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export default new CacheService();

// Cache key generators
export const CacheKeys = {
  affiliateAnalytics: () => 'affiliate:analytics:overview',
  affiliateTopPerformers: () => 'affiliate:top-performers',
  affiliateApplications: (status?: string, page?: number) => 
    `affiliate:applications:${status || 'all'}:${page || 1}`,
  affiliateList: (status?: string, search?: string, page?: number) => 
    `affiliate:list:${status || 'all'}:${search || 'none'}:${page || 1}`,
  affiliatePayouts: (status?: string, page?: number) => 
    `affiliate:payouts:${status || 'all'}:${page || 1}`,
  affiliatePerformance: (affiliateId: string, days: number) => 
    `affiliate:performance:${affiliateId}:${days}`,
};